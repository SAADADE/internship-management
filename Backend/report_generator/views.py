import logging
import mimetypes
import os
import uuid
from collections import defaultdict
from datetime import timedelta
from html import unescape

from django.contrib.auth import authenticate, get_user_model, login
from django.core.files.storage import default_storage
from django.db import OperationalError, ProgrammingError
from django.db.models import Q
from django.http import FileResponse, HttpResponse
from django.utils.html import strip_tags
from django.utils import timezone
from django.utils.text import get_valid_filename
from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated


class IsStudentUser(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "student", None) is not None


class IsStudentProfileOwnerOrCreator(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        if getattr(request.user, "student", None) is not None:
            return True
        return (
            request.method == "POST"
            and getattr(request.user, "supervisor", None) is None
            and not request.user.is_staff
            and not request.user.is_superuser
        )


class IsSupervisorUser(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "supervisor", None) is not None


class IsAdminStaffUser(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return bool(request.user and request.user.is_active and request.user.is_staff)


from rest_framework.response import Response
from rest_framework.views import APIView

from .docx_builder import build_docx
from .file_extractor import extract_text_from_file
from .llm_service import generate_report_structure
from .models import ActivityLog, Appraisal, Company, CompanyRequest, DailyLog, Internship, InternshipReportDraft, LogFeedback, Report, StudentProfile, SupervisorProfile
from .serializers import (
    ActivityNotificationSerializer,
    AdminCompanyRequestReviewSerializer,
    AdminCompanySerializer,
    AppraisalSerializer,
    AuthLoginSerializer,
    BulkStatusUpdateSerializer,
    CompanySerializer,
    DailyLogSerializer,
    InternshipReportDraftSerializer,
    InternshipSerializer,
    PasswordChangeSerializer,
    ReportRequestSerializer,
    ReportSerializer,
    StudentActivityItemSerializer,
    StudentCompanyRequestSerializer,
    StudentFeedbackSerializer,
    StudentProfileSerializer,
    SupervisorAssignedStudentSerializer,
    SupervisorReportSerializer,
    SupervisorLogUpdateSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger(__name__)


def _clean_rich_text(value):
    normalized = unescape(strip_tags(value or ""))
    lines = [line.strip() for line in normalized.splitlines()]
    return "\n".join(line for line in lines if line)


def _get_admin_users():
    return get_user_model().objects.filter(is_active=True, is_staff=True)


def _notify_users(*, recipients, activity_type, title, message, actor=None, metadata=None):
    recipient_map = {}
    for recipient in recipients or []:
        if recipient and getattr(recipient, "pk", None) is not None:
            recipient_map[recipient.pk] = recipient

    if not recipient_map:
        return 0

    payload = []
    for recipient in recipient_map.values():
        payload.append(
            ActivityLog(
                recipient=recipient,
                actor=actor,
                activity_type=activity_type,
                title=title,
                message=message,
                metadata=metadata or {},
            )
        )

    ActivityLog.objects.bulk_create(payload)
    return len(payload)


class HealthCheckView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({"status": "ok", "service": "Internship Report Generator", "version": "1.0.0"})


class GenerateReportView(APIView):
    parser_classes = [MultiPartParser, JSONParser]
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ReportRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"error": "Invalid request.", "details": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        document_text = data.get("text", "")

        if not document_text and data.get("file"):
            try:
                document_text = extract_text_from_file(data["file"])
            except ValueError as exc:
                return Response({"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

        if not document_text.strip():
            return Response({"error": "The provided text or file appears to be empty."}, status=status.HTTP_400_BAD_REQUEST)

        metadata = {
            "intern_name": data.get("intern_name", ""),
            "company_name": data.get("company_name", ""),
            "internship_duration": data.get("internship_duration", ""),
            "department": data.get("department", ""),
            "supervisor_name": data.get("supervisor_name", ""),
            "institution_name": data.get("institution_name", ""),
            "programme": data.get("programme", ""),
            "additional_instructions": data.get("additional_instructions", ""),
        }

        try:
            report_data = generate_report_structure(document_text=document_text, **metadata)
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RuntimeError as exc:
            logger.exception("LLM processing error")
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.exception("Unexpected LLM error")
            return Response({"error": f"Unexpected error: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            docx_bytes = build_docx(report_data, metadata)
        except Exception as exc:
            logger.exception("Document build error")
            return Response({"error": f"Document generation failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        intern_slug = data.get("intern_name", "intern").replace(" ", "_").lower() or "intern"
        filename = f"internship_report_{intern_slug}.docx"
        response = HttpResponse(
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(docx_bytes)
        return response


class AuthRegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        user_model = get_user_model()
        user = user_model.objects.create_user(
            username=data["username"],
            email=data["email"],
            password=data["password"],
            first_name=data["first_name"],
            last_name=data["last_name"],
        )

        if data["role"] == "supervisor":
            supervisor = SupervisorProfile.objects.create(user=user, fullname=f"{data['first_name']} {data['last_name']}".strip(), email=data["email"])
            supervisor.link_students_by_email()
            profile_payload = {"fullname": supervisor.fullname, "email": supervisor.email}
        else:
            profile = StudentProfile.objects.create(
                user=user,
                sch_email=data["email"],
                index_number=data.get("index_number", ""),
                first_name=data["first_name"],
                last_name=data["last_name"],
                faculty=data.get("faculty", ""),
                department=data.get("department", ""),
                programme=data.get("programme", ""),
                level=data.get("level", ""),
                institution_name=data.get("institution_name", ""),
                phone_number=data.get("phone_number", ""),
            )
            profile_payload = StudentProfileSerializer(profile).data

        return Response(
            {
                "message": "Account created successfully.",
                "role": data["role"],
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": data["role"],
                },
                "profile": profile_payload,
            },
            status=status.HTTP_201_CREATED,
        )


class AuthLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AuthLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        username_or_email = data["username"]
        user = None
        if username_or_email:
            user_obj = get_user_model().objects.filter(Q(username=username_or_email) | Q(email__iexact=username_or_email)).first()
            if user_obj:
                user = authenticate(request, username=user_obj.username, password=data["password"])

        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        role = "supervisor" if hasattr(user, "supervisor") else "student" if hasattr(user, "student") else "admin" if user.is_staff else "user"
        profile = None
        if role == "student":
            profile = StudentProfile.objects.filter(user=user).first()
        elif role == "supervisor":
            profile = SupervisorProfile.objects.filter(user=user).first()

        return Response(
            {
                "message": "Login successful.",
                "role": role,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "role": role,
                },
                "profile": StudentProfileSerializer(profile).data if profile and role == "student" else {"fullname": profile.fullname, "email": profile.email} if profile and role == "supervisor" else {},
            }
        )


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        if not request.user.check_password(data["current_password"]):
            return Response({"current_password": "Current password is incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(data["new_password"])
        request.user.save(update_fields=["password"])
        return Response({"message": "Password updated successfully."})


class CurrentUserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = "supervisor" if hasattr(user, "supervisor") else "student" if hasattr(user, "student") else "admin" if user.is_staff else "user"

        profile_payload = {
            "name": user.get_full_name().strip() or user.username,
            "email": user.email,
            "role": role,
            "last_login": timezone.localtime(user.last_login).isoformat() if user.last_login else None,
        }

        if role == "student":
            profile = StudentProfile.objects.filter(user=user).first()
            if profile:
                profile_payload.update(
                    {
                        "faculty": profile.faculty,
                        "department": profile.department,
                        "programme": profile.programme,
                        "level": profile.level,
                        "institution_name": profile.institution_name,
                        "phone_number": profile.phone_number,
                    }
                )
        elif role == "supervisor":
            profile = SupervisorProfile.objects.filter(user=user).first()
            if profile:
                profile_payload.update(
                    {
                        "fullname": profile.fullname,
                        "supervisor_email": profile.email,
                    }
                )

        return Response(profile_payload)


class StudentProfileView(APIView):
    permission_classes = [IsStudentProfileOwnerOrCreator]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        return Response(StudentProfileSerializer(profile).data)

    def post(self, request):
        profile = StudentProfile.objects.filter(user=request.user).first()
        serializer = StudentProfileSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        if profile:
            for field, value in serializer.validated_data.items():
                if field == "user":
                    continue
                setattr(profile, field, value)
            profile.save()
            return Response(StudentProfileSerializer(profile).data, status=status.HTTP_200_OK)
        serializer.save(user=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def patch(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        serializer = StudentProfileSerializer(profile, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class StudentCompanyListView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        companies = Company.objects.all().order_by("name")
        return Response(CompanySerializer(companies, many=True).data)


class StudentCompanyRequestListCreateView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        student = StudentProfile.objects.get(user=request.user)
        requests = CompanyRequest.objects.filter(requested_by=student).order_by("-created_at")
        return Response(StudentCompanyRequestSerializer(requests, many=True).data)

    def post(self, request):
        student = StudentProfile.objects.get(user=request.user)
        serializer = StudentCompanyRequestSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        company_request = serializer.save(requested_by=student)
        student_name = f"{student.first_name} {student.last_name}".strip() or student.sch_email

        _notify_users(
            recipients=_get_admin_users(),
            activity_type="company_request_submitted",
            title="New company request submitted",
            message=f"{student_name} requested '{company_request.name}'.",
            actor=request.user,
            metadata={"company_request_id": str(company_request.request_id)},
        )

        return Response(StudentCompanyRequestSerializer(company_request).data, status=status.HTTP_201_CREATED)


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = request.query_params.get("limit")
        notifications = ActivityLog.objects.filter(recipient=request.user).order_by("-created_at")
        if limit:
            try:
                limit_value = max(1, min(int(limit), 100))
                notifications = notifications[:limit_value]
            except ValueError:
                notifications = notifications[:60]
        else:
            notifications = notifications[:60]
        return Response(ActivityNotificationSerializer(notifications, many=True).data)


class NotificationSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        unread_count = ActivityLog.objects.filter(recipient=request.user, is_read=False).count()
        return Response({"unread_count": unread_count})


class NotificationMarkReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, activity_id):
        notification = ActivityLog.objects.filter(activity_id=activity_id, recipient=request.user).first()
        if not notification:
            return Response({"detail": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])
        return Response({"id": str(notification.activity_id), "is_read": True})


class NotificationMarkAllReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        unread = ActivityLog.objects.filter(recipient=request.user, is_read=False)
        updated = unread.update(is_read=True, read_at=timezone.now())
        return Response({"updated": updated})


class StudentDashboardView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        internships = Internship.objects.filter(student=profile).order_by("-created_at")
        latest_internship = internships.first()
        logs = DailyLog.objects.filter(student=profile).order_by("-log_date", "-created_at")
        reports = Report.objects.filter(student=profile).order_by("-created_at")
        feedback_count = LogFeedback.objects.filter(log__student=profile).count()
        pending_reviews = logs.filter(status__in=["draft", "submitted", "needs_revision"]).count()
        reviewed_logs = logs.filter(status="reviewed")

        activity_items = []
        for log in logs[:5]:
            if log.status == "reviewed":
                activity_items.append({
                    "icon": "check",
                    "label": f"Log sheet {log.week_number or 'week'} reviewed by supervisor",
                    "time": log.updated_at.strftime("%Y-%m-%d %H:%M"),
                })
            elif log.status == "needs_revision":
                activity_items.append({
                    "icon": "alert",
                    "label": f"Log sheet {log.week_number or 'week'} needs revision",
                    "time": log.updated_at.strftime("%Y-%m-%d %H:%M"),
                })
            else:
                activity_items.append({
                    "icon": "upload",
                    "label": f"Weekly log sheet {log.week_number or 'week'} saved",
                    "time": log.updated_at.strftime("%Y-%m-%d %H:%M"),
                })

        if not activity_items and latest_internship:
            activity_items.append({
                "icon": "check",
                "label": f"Internship registered at {latest_internship.company_name}",
                "time": latest_internship.created_at.strftime("%Y-%m-%d %H:%M"),
            })

        deadlines = []
        if latest_internship:
            deadlines.append({
                "label": f"Final report for {latest_internship.company_name}",
                "due": "3 days",
                "badge": "badge-warning",
            })
        if reviewed_logs.exists():
            deadlines.append({
                "label": "Reviewed logs ready for final report",
                "due": "1 day",
                "badge": "badge-info",
            })
        if reports.exists():
            deadlines.append({
                "label": "Latest report is ready",
                "due": "3 weeks",
                "badge": "badge-success",
            })

        status_label = latest_internship.status.title() if latest_internship else "Pending"
        stats = {
            "internship_status": status_label,
            "reports_submitted": reports.count(),
            "pending_reviews": pending_reviews,
            "feedback_received": feedback_count,
        }

        return Response({
            "student": {
                "name": f"{profile.first_name} {profile.last_name}".strip() or profile.sch_email,
                "department": profile.department,
                "programme": profile.programme,
                "level": profile.level,
            },
            "stats": stats,
            "activity": activity_items,
            "deadlines": deadlines,
        })


class StudentReportsView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        logs = DailyLog.objects.filter(student=profile).order_by("-log_date", "-created_at")
        reports = Report.objects.filter(student=profile).order_by("-created_at")

        items = []
        for log in logs:
            items.append({
                "id": log.log_id,
                "source": "log",
                "title": f"Weekly Log - Week {log.week_number or 1}",
                "type": "Weekly Log",
                "date": log.log_date.isoformat() if log.log_date else log.created_at.date().isoformat(),
                "status": {
                    "submitted": "Submitted",
                    "reviewed": "Reviewed",
                    "needs_revision": "Needs Revision",
                    "draft": "Draft",
                }.get(log.status, log.status.title()),
                "grade": "-",
                "feedback": "",
                "company_name": log.company_name or (log.internship.company_name if log.internship else ""),
                "week_number": log.week_number,
                "details": log.log_text or log.achievements or "",
                "created_at": log.created_at,
            })

        for report in reports:
            payload = ReportSerializer(report).data
            payload.update({
                "source": "report",
                "type": "Report",
                "company_name": report.student.company or "",
                "details": report.supervisor_feedback or "",
                "created_at": report.created_at,
            })
            items.append(payload)

        items.sort(key=lambda item: item["created_at"], reverse=True)
        return Response(StudentActivityItemSerializer(items, many=True).data)


class StudentInternshipView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        internships = Internship.objects.filter(student=profile).order_by("-created_at")
        return Response(InternshipSerializer(internships, many=True).data)

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        payload = request.data.copy()

        if payload.get("start_date") and not payload.get("internship_duration"):
            payload["internship_duration"] = payload["start_date"]
        if payload.get("end_date") and payload.get("internship_duration") and " to " not in payload["internship_duration"]:
            payload["internship_duration"] = f"{payload['internship_duration']} to {payload['end_date']}"

        serializer = InternshipSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        supervisor = profile.link_supervisor_by_email(payload.get("internship_supervisor_email") or "")
        internship = serializer.save(student=profile, supervisor=supervisor)

        recipients = list(_get_admin_users())
        if supervisor and supervisor.user:
            recipients.append(supervisor.user)

        student_name = f"{profile.first_name} {profile.last_name}".strip() or profile.sch_email
        _notify_users(
            recipients=recipients,
            activity_type="internship_registered",
            title="New internship registration",
            message=f"{student_name} registered internship at {internship.company_name}.",
            actor=request.user,
            metadata={"internship_id": str(internship.internship_id)},
        )

        return Response(InternshipSerializer(internship).data, status=status.HTTP_201_CREATED)


class StudentLogView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        logs = DailyLog.objects.filter(student=profile).order_by("-log_date", "-created_at")
        return Response(DailyLogSerializer(logs, many=True).data)

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        payload = request.data.copy()

        if isinstance(payload, dict):
            daily_entries = []
            for day in ["monday", "tuesday", "wednesday", "thursday", "friday"]:
                day_payload = {
                    "day": day.title(),
                    "tasks": payload.get(f"{day}Tasks", ""),
                    "skills": payload.get(f"{day}Skills", ""),
                    "challenges": payload.get(f"{day}Challenges", ""),
                    "solutions": payload.get(f"{day}Solutions", ""),
                }
                daily_entries.append(day_payload)

            payload["daily_entries"] = daily_entries
            payload["student_name"] = payload.get("studentName", "")
            payload["student_index_number"] = payload.get("studentId", "")
            payload["department"] = payload.get("department", "")
            payload["programme"] = payload.get("programme", "")
            payload["level"] = payload.get("level", "")
            payload["institution"] = payload.get("institution", "")
            payload["company_name"] = payload.get("companyName", "")
            payload["department_unit"] = payload.get("departmentUnit", "")
            payload["supervisor_name"] = payload.get("supervisorName", "")
            payload["achievements"] = payload.get("achievements", "")
            payload["log_text"] = payload.get("achievements", "")
            payload["status"] = "submitted"
            payload["week_number"] = payload.get("weekNumber") or payload.get("week_number")
            payload["log_date"] = payload.get("startDate") or payload.get("start_date") or payload.get("log_date")
            payload["start_date"] = payload.get("startDate") or payload.get("start_date")
            payload["end_date"] = payload.get("endDate") or payload.get("end_date")
            payload["internship_id"] = payload.get("internshipId") or payload.get("internship_id")

            if payload.get("week_number") and isinstance(payload["week_number"], str):
                try:
                    payload["week_number"] = int(payload["week_number"])
                except ValueError:
                    payload["week_number"] = None

        serializer = DailyLogSerializer(data=payload)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        log = serializer.save(student=profile)

        supervisor_users = [sup.user for sup in profile.supervisors.select_related("user") if sup.user]
        if supervisor_users:
            student_name = f"{profile.first_name} {profile.last_name}".strip() or profile.sch_email
            _notify_users(
                recipients=supervisor_users,
                activity_type="weekly_log_submitted",
                title="Student submitted weekly log",
                message=f"{student_name} submitted week {log.week_number or '-'} log for review.",
                actor=request.user,
                metadata={"log_id": str(log.log_id)},
            )

        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentFeedbackView(APIView):
    permission_classes = [IsStudentUser]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        feedbacks = LogFeedback.objects.filter(log__student=profile, supervisor__in=profile.supervisors.all()).order_by("-created_at")
        return Response(StudentFeedbackSerializer(feedbacks, many=True).data)


class StudentLogDetailView(APIView):
    permission_classes = [IsStudentUser]

    def patch(self, request, log_id):
        profile = StudentProfile.objects.get(user=request.user)
        log = DailyLog.objects.filter(student=profile, log_id=log_id).first()
        if not log:
            return Response({"detail": "Log not found."}, status=status.HTTP_404_NOT_FOUND)
        if log.status == "reviewed":
            return Response({"detail": "Reviewed logs cannot be edited."}, status=status.HTTP_400_BAD_REQUEST)
        serializer = DailyLogSerializer(log, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)


class StudentReportDraftView(APIView):
    permission_classes = [IsStudentUser]

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        draft, _ = InternshipReportDraft.objects.get_or_create(student=profile)
        serializer = InternshipReportDraftSerializer(draft, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentGenerateReportView(APIView):
    permission_classes = [IsStudentUser]

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        draft = profile.report_draft if hasattr(profile, "report_draft") else None
        if not draft:
            return Response({"detail": "Please fill in the required report fields first."}, status=status.HTTP_400_BAD_REQUEST)
        if not draft.introduction.strip() or not draft.abstract.strip() or not draft.conclusion.strip():
            return Response({"detail": "Introduction, abstract, and conclusion are required."}, status=status.HTTP_400_BAD_REQUEST)

        approved_logs = DailyLog.objects.filter(student=profile, status="reviewed").order_by("log_date", "created_at")
        if not approved_logs.exists():
            return Response({"detail": "At least one reviewed log is required before generating a report."}, status=status.HTTP_400_BAD_REQUEST)

        draft_sections = {
            "introduction": _clean_rich_text(draft.introduction),
            "abstract": _clean_rich_text(draft.abstract),
            "conclusion": _clean_rich_text(draft.conclusion),
        }

        log_sections = []
        student_logs = []
        for log in approved_logs:
            daily_entries = []
            for index, entry in enumerate(log.daily_entries or []):
                if not isinstance(entry, dict):
                    continue
                day = entry.get("day") or f"Day {index + 1}"
                daily_entries.append(
                    {
                        "day": day,
                        "tasks": entry.get("tasks", ""),
                        "skills": entry.get("skills", ""),
                        "challenges": entry.get("challenges", ""),
                        "solutions": entry.get("solutions", ""),
                    }
                )

            student_logs.append(
                {
                    "week_number": log.week_number,
                    "log_date": log.log_date.isoformat() if log.log_date else "",
                    "company_name": log.company_name or profile.company,
                    "department_unit": log.department_unit,
                    "supervisor_name": log.supervisor_name,
                    "achievements": log.achievements,
                    "log_text": log.log_text,
                    "daily_entries": daily_entries,
                }
            )

            log_sections.append(
                "\n".join(
                    filter(
                        None,
                        [
                            f"Week: {log.week_number}" if log.week_number else "",
                            f"Date: {log.log_date}" if log.log_date else "",
                            f"Department / Unit: {log.department_unit}" if log.department_unit else "",
                            f"Achievements: {log.achievements}" if log.achievements else "",
                            log.log_text,
                        ],
                    )
                )
            )

        document_text = "\n\n".join(
            [
                f"Introduction:\n{draft_sections['introduction']}",
                f"Abstract:\n{draft_sections['abstract']}",
                f"Conclusion:\n{draft_sections['conclusion']}",
                "Reviewed logs:",
                *log_sections,
            ]
        )

        metadata = {
            "intern_name": request.user.get_full_name() or request.user.username,
            "company_name": profile.company,
            "internship_duration": "",
            "department": draft.department or profile.position,
            "supervisor_name": draft.supervisor_name,
            "institution_name": profile.university,
            "programme": profile.programme,
            "additional_instructions": draft.additional_notes,
        }

        try:
            report_data = generate_report_structure(
                document_text=document_text,
                draft_sections=draft_sections,
                student_logs=student_logs,
                **metadata,
            )
        except ValueError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except RuntimeError as exc:
            logger.exception("LLM processing error")
            return Response({"error": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as exc:
            logger.exception("Unexpected LLM error")
            return Response({"error": f"Unexpected error: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        try:
            docx_bytes = build_docx(report_data, metadata)
        except Exception as exc:
            logger.exception("Document build error")
            return Response({"error": f"Document generation failed: {exc}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        filename = f"internship_report_{request.user.username}.docx"
        response = HttpResponse(
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(docx_bytes)
        return response


class StudentReportUploadView(APIView):
    permission_classes = [IsStudentUser]
    parser_classes = [MultiPartParser, JSONParser]

    ALLOWED_EXTENSIONS = {".pdf", ".doc", ".docx"}

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        uploaded_file = request.FILES.get("file")

        if not uploaded_file:
            return Response({"detail": "Report file is required."}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(uploaded_file.name or "")[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return Response(
                {"detail": "Unsupported file type. Upload PDF, DOC, or DOCX."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        safe_name = get_valid_filename(os.path.basename(uploaded_file.name))
        report_dir = f"reports/student_{profile.student_id}"
        report_path = f"{report_dir}/{uuid.uuid4().hex}_{safe_name}"
        stored_path = default_storage.save(report_path, uploaded_file)

        report = Report.objects.create(
            student=profile,
            report_file=stored_path,
            status="ready",
            supervisor_feedback="",
            grade=None,
        )

        recipients = list(_get_admin_users())
        recipients.extend([sup.user for sup in profile.supervisors.select_related("user") if sup.user])
        student_name = f"{profile.first_name} {profile.last_name}".strip() or profile.sch_email
        _notify_users(
            recipients=recipients,
            activity_type="report_submitted",
            title="Student submitted final report",
            message=f"{student_name} uploaded a final report file.",
            actor=request.user,
            metadata={"report_id": str(report.report_id)},
        )

        return Response(
            {
                "id": str(report.report_id),
                "filename": os.path.basename(stored_path),
                "uploaded_at": report.created_at.isoformat(),
                "status": report.status,
            },
            status=status.HTTP_201_CREATED,
        )


class SupervisorStudentsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            students = (
                StudentProfile.objects.filter(internships__supervisor=supervisor)
                .distinct()
                .order_by("first_name", "last_name")
            )
        except (OperationalError, ProgrammingError):
            students = StudentProfile.objects.filter(supervisors=supervisor).distinct().order_by("first_name", "last_name")
        return Response(StudentProfileSerializer(students, many=True).data)


class SupervisorAssignedAppraisalStudentsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            students = (
                StudentProfile.objects.filter(internships__supervisor=supervisor)
                .distinct()
                .select_related("appraisal")
                .order_by("first_name", "last_name")
            )
        except (OperationalError, ProgrammingError):
            students = StudentProfile.objects.filter(supervisors=supervisor).distinct().select_related("appraisal").order_by("first_name", "last_name")
        return Response(SupervisorAssignedStudentSerializer(students, many=True, context={"request": request}).data)


class SupervisorLogsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            logs = DailyLog.objects.filter(internship__supervisor=supervisor).order_by("-log_date", "-created_at")
        except (OperationalError, ProgrammingError):
            logs = DailyLog.objects.filter(student__supervisors=supervisor).distinct().order_by("-log_date", "-created_at")
        return Response(DailyLogSerializer(logs, many=True).data)


class SupervisorReportsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            logs = (
                DailyLog.objects.filter(internship__supervisor=supervisor)
                .select_related("student", "internship", "feedback")
                .order_by("-log_date", "-created_at")
            )
        except (OperationalError, ProgrammingError):
            logs = (
                DailyLog.objects.filter(student__supervisors=supervisor)
                .distinct()
                .select_related("student", "internship", "feedback")
                .order_by("-log_date", "-created_at")
            )
        return Response(SupervisorReportSerializer(logs, many=True).data)


class SupervisorLogDetailView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request, log_id):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            log = (
                DailyLog.objects.filter(internship__supervisor=supervisor, log_id=log_id)
                .select_related("feedback")
                .first()
            )
        except (OperationalError, ProgrammingError):
            log = (
                DailyLog.objects.filter(student__supervisors=supervisor, log_id=log_id)
                .select_related("feedback")
                .first()
            )
        if not log:
            return Response({"detail": "Log not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(DailyLogSerializer(log).data)

    def patch(self, request, log_id):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        try:
            log = DailyLog.objects.filter(internship__supervisor=supervisor, log_id=log_id).first()
        except (OperationalError, ProgrammingError):
            log = DailyLog.objects.filter(student__supervisors=supervisor, log_id=log_id).first()
        if not log:
            return Response({"detail": "Log not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = SupervisorLogUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        feedback, _ = LogFeedback.objects.update_or_create(
            log=log,
            defaults={
                "supervisor": supervisor,
                "decision": serializer.validated_data["decision"],
                "comment": serializer.validated_data.get("comment", ""),
                "score": serializer.validated_data.get("score"),
            },
        )

        if log.student and log.student.user:
            decision_label = feedback.decision.title()
            _notify_users(
                recipients=[log.student.user],
                activity_type="log_reviewed",
                title="Supervisor reviewed your log",
                message=f"Your week {log.week_number or '-'} log was marked {decision_label}.",
                actor=request.user,
                metadata={"log_id": str(log.log_id), "decision": feedback.decision},
            )

        return Response(DailyLogSerializer(log).data)


class SupervisorBulkStatusView(APIView):
    permission_classes = [IsSupervisorUser]

    def post(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        serializer = BulkStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            logs = DailyLog.objects.filter(internship__supervisor=supervisor)
        except (OperationalError, ProgrammingError):
            logs = DailyLog.objects.filter(student__supervisors=supervisor).distinct()
        decision = serializer.validated_data["decision"]
        comment = serializer.validated_data.get("comment", "")
        student_decision_counts = defaultdict(int)

        for log in logs:
            LogFeedback.objects.update_or_create(
                log=log,
                defaults={
                    "supervisor": supervisor,
                    "decision": decision,
                    "comment": comment,
                },
            )
            student_decision_counts[log.student_id] += 1

        students = StudentProfile.objects.filter(student_id__in=student_decision_counts.keys()).select_related("user")
        for student in students:
            if not student.user:
                continue
            _notify_users(
                recipients=[student.user],
                activity_type="logs_bulk_reviewed",
                title="Supervisor reviewed your logs",
                message=f"{student_decision_counts[student.student_id]} log(s) were marked {decision}.",
                actor=request.user,
                metadata={"decision": decision},
            )

        return Response({"updated": logs.count(), "decision": decision})


class SupervisorAppraisalListView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        appraisals = Appraisal.objects.filter(supervisor=supervisor).select_related("student").order_by("-submitted_at", "-created_at")
        return Response(AppraisalSerializer(appraisals, many=True, context={"request": request}).data)

    def post(self, request):
        serializer = AppraisalSerializer(data=request.data, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        appraisal = serializer.save()

        recipients = list(_get_admin_users())
        if appraisal.student and appraisal.student.user:
            recipients.append(appraisal.student.user)
        student_name = f"{appraisal.student.first_name} {appraisal.student.last_name}".strip() or appraisal.student.sch_email
        _notify_users(
            recipients=recipients,
            activity_type="appraisal_submitted",
            title="Supervisor submitted appraisal",
            message=f"Appraisal submitted for {student_name}.",
            actor=request.user,
            metadata={"appraisal_id": str(appraisal.appraisal_id), "student_id": str(appraisal.student.student_id)},
        )

        return Response(AppraisalSerializer(appraisal, context={"request": request}).data, status=status.HTTP_201_CREATED)


class SupervisorAppraisalDetailView(APIView):
    permission_classes = [IsSupervisorUser]

    def _get_appraisal(self, request, appraisal_id):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        return Appraisal.objects.filter(appraisal_id=appraisal_id, supervisor=supervisor).select_related("student").first()

    def patch(self, request, appraisal_id):
        appraisal = self._get_appraisal(request, appraisal_id)
        if not appraisal:
            return Response({"detail": "Appraisal not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AppraisalSerializer(appraisal, data=request.data, partial=True, context={"request": request})
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, appraisal_id):
        appraisal = self._get_appraisal(request, appraisal_id)
        if not appraisal:
            return Response({"detail": "Appraisal not found."}, status=status.HTTP_404_NOT_FOUND)
        appraisal.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCompanyListCreateView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        companies = Company.objects.all().order_by("name")
        if query:
            companies = companies.filter(name__icontains=query)
        return Response(AdminCompanySerializer(companies, many=True).data)

    def post(self, request):
        serializer = AdminCompanySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        company = serializer.save(created_by=request.user)
        return Response(AdminCompanySerializer(company).data, status=status.HTTP_201_CREATED)


class AdminCompanyDetailView(APIView):
    permission_classes = [IsAdminStaffUser]

    def _get_company(self, company_id):
        return Company.objects.filter(company_id=company_id).first()

    def patch(self, request, company_id):
        company = self._get_company(company_id)
        if not company:
            return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCompanySerializer(company, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, company_id):
        company = self._get_company(company_id)
        if not company:
            return Response({"detail": "Company not found."}, status=status.HTTP_404_NOT_FOUND)
        company.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminCompanyRequestListView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        status_filter = request.query_params.get("status", "").strip().lower()
        requests = CompanyRequest.objects.select_related("requested_by", "requested_by__user").all()
        if status_filter in {"pending", "approved", "rejected"}:
            requests = requests.filter(status=status_filter)
        requests = requests.order_by("-created_at")
        return Response(StudentCompanyRequestSerializer(requests, many=True).data)


class AdminCompanyRequestDetailView(APIView):
    permission_classes = [IsAdminStaffUser]

    def _get_request(self, request_id):
        return CompanyRequest.objects.select_related("requested_by", "requested_by__user").filter(request_id=request_id).first()

    def patch(self, request, request_id):
        company_request = self._get_request(request_id)
        if not company_request:
            return Response({"detail": "Company request not found."}, status=status.HTTP_404_NOT_FOUND)

        if company_request.status != "pending":
            return Response({"detail": "This request has already been reviewed."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = AdminCompanyRequestReviewSerializer(company_request, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        next_status = serializer.validated_data.get("status")
        if not next_status:
            return Response({"status": ["Status is required."]}, status=status.HTTP_400_BAD_REQUEST)

        serializer.save(
            reviewed_by=request.user,
            reviewed_at=timezone.now(),
        )

        if next_status == "approved" and not Company.objects.filter(name__iexact=company_request.name).exists():
            Company.objects.create(
                name=company_request.name,
                location=(company_request.location or "").strip() or "Kumasi",
                created_by=request.user,
            )

        if company_request.requested_by and company_request.requested_by.user:
            _notify_users(
                recipients=[company_request.requested_by.user],
                activity_type="company_request_reviewed",
                title="Company request reviewed",
                message=f"Your request for {company_request.name} was {next_status}.",
                actor=request.user,
                metadata={"company_request_id": str(company_request.request_id), "status": next_status},
            )

        company_request.refresh_from_db()
        return Response(StudentCompanyRequestSerializer(company_request).data)


class AdminDashboardView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        total_students = StudentProfile.objects.count()
        total_reports = Report.objects.count()
        active_internships = Internship.objects.filter(status="active").count()

        recent_registrations = []
        for internship in Internship.objects.select_related("student").order_by("-created_at")[:6]:
            recent_registrations.append(
                {
                    "id": str(internship.internship_id),
                    "name": f"{internship.student.first_name} {internship.student.last_name}".strip() or internship.student.sch_email,
                    "index": internship.student.index_number,
                    "company": internship.company_name,
                    "date": internship.created_at.date().isoformat(),
                }
            )

        activity_items = []

        for appraisal in Appraisal.objects.select_related("student", "supervisor").order_by("-submitted_at")[:6]:
            activity_items.append(
                {
                    "id": f"appraisal-{appraisal.appraisal_id}",
                    "type": "appraisal",
                    "action": "Supervisor submitted appraisal",
                    "detail": f"{appraisal.supervisor.fullname} completed evaluation for {appraisal.student.first_name} {appraisal.student.last_name}".strip(),
                    "time": appraisal.submitted_at.isoformat(),
                }
            )

        for report in Report.objects.select_related("student").order_by("-created_at")[:6]:
            has_uploaded_file = bool((report.report_file or "").strip())
            activity_items.append(
                {
                    "id": f"report-{report.report_id}",
                    "type": "report",
                    "action": "Student final report file submitted" if has_uploaded_file else "Student report draft generated",
                    "detail": (
                        f"{report.student.first_name} {report.student.last_name} uploaded a final report file"
                        if has_uploaded_file
                        else f"{report.student.first_name} {report.student.last_name} generated a report record"
                    ).strip(),
                    "time": report.created_at.isoformat(),
                }
            )

        for internship in Internship.objects.select_related("student").order_by("-created_at")[:6]:
            activity_items.append(
                {
                    "id": f"internship-{internship.internship_id}",
                    "type": "internship",
                    "action": "Internship registration received",
                    "detail": f"{internship.student.first_name} {internship.student.last_name} registered at {internship.company_name}".strip(),
                    "time": internship.created_at.isoformat(),
                }
            )

        activity_items.sort(key=lambda item: item["time"], reverse=True)

        return Response(
            {
                "stats": {
                    "total_students": total_students,
                    "total_reports": total_reports,
                    "active_internships": active_internships,
                },
                "activity": activity_items[:8],
                "recent_registrations": recent_registrations,
            }
        )


class AdminStudentsView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        students = StudentProfile.objects.all().prefetch_related("supervisors", "internships").order_by("first_name", "last_name")

        payload = []
        for student in students:
            latest_internship = student.internships.order_by("-created_at").first()
            latest_report = student.reports.order_by("-created_at").first()
            appraisal = getattr(student, "appraisal", None)

            payload.append(
                {
                    "id": str(student.student_id),
                    "name": f"{student.first_name} {student.last_name}".strip() or student.sch_email,
                    "studentId": student.index_number,
                    "email": student.sch_email,
                    "department": student.department,
                    "company": latest_internship.company_name if latest_internship else "",
                    "status": latest_internship.status if latest_internship else "inactive",
                    "startDate": latest_internship.start_date.isoformat() if latest_internship and latest_internship.start_date else "",
                    "endDate": latest_internship.end_date.isoformat() if latest_internship and latest_internship.end_date else "",
                    "hasSubmittedReportFile": bool(latest_report and (latest_report.report_file or "").strip()),
                    "appraisalScore":
                        sum(int(score) for score in appraisal.scores.values()) if appraisal and appraisal.scores else None,
                }
            )

        return Response(payload)


class AdminStudentDetailView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request, student_id):
        student = StudentProfile.objects.filter(student_id=student_id).prefetch_related("supervisors", "internships", "logs", "reports").first()
        if not student:
            return Response({"detail": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        latest_internship = student.internships.order_by("-created_at").first()
        latest_report = student.reports.order_by("-created_at").first()
        appraisal = getattr(student, "appraisal", None)

        achievements = []
        for log in student.logs.order_by("-created_at")[:5]:
            text = (log.achievements or log.log_text or "").strip()
            if text:
                achievements.append(text[:140])
        if not achievements:
            achievements = ["No weekly achievements recorded yet."]

        supervisors = [sup.fullname for sup in student.supervisors.all() if sup.fullname]

        report_status = "Pending"
        if latest_report:
            report_status = "Reviewed" if latest_report.status == "graded" else "Submitted"

        report_file_name = ""
        report_download_url = ""
        if latest_report and (latest_report.report_file or "").strip():
            report_file_name = os.path.basename(latest_report.report_file)
            report_download_url = f"/api/admin/reports/{latest_report.report_id}/download/"

        payload = {
            "id": str(student.student_id),
            "name": f"{student.first_name} {student.last_name}".strip() or student.sch_email,
            "studentId": student.index_number,
            "email": student.sch_email,
            "department": student.department,
            "phone": student.phone_number,
            "address": student.institution_name,
            "company": latest_internship.company_name if latest_internship else "",
            "status": latest_internship.status if latest_internship else "inactive",
            "startDate": latest_internship.start_date.isoformat() if latest_internship and latest_internship.start_date else "",
            "endDate": latest_internship.end_date.isoformat() if latest_internship and latest_internship.end_date else "",
            "supervisor": ", ".join(supervisors) if supervisors else "Not linked",
            "reportStatus": report_status,
            "reportFileSubmitted": bool(report_file_name),
            "reportFileName": report_file_name,
            "reportDownloadUrl": report_download_url,
            "appraisalStatus": "Received" if appraisal else "Pending",
            "summary": "Student profile and internship progress overview generated from submitted records.",
            "achievements": achievements,
        }
        return Response(payload)


class AdminReportsIndexView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request):
        final_reports = []
        for report in Report.objects.select_related("student").order_by("-created_at"):
            final_reports.append(
                {
                    "id": str(report.report_id),
                    "studentName": f"{report.student.first_name} {report.student.last_name}".strip() or report.student.sch_email,
                    "studentId": report.student.index_number,
                    "department": report.student.department,
                    "title": "Final Internship Report",
                    "submittedOn": report.created_at.date().isoformat(),
                    "status": report.status,
                    "hasFile": bool((report.report_file or "").strip()),
                }
            )

        appraisal_forms = []
        for appraisal in Appraisal.objects.select_related("student", "supervisor").order_by("-submitted_at"):
            appraisal_forms.append(
                {
                    "id": str(appraisal.appraisal_id),
                    "studentName": f"{appraisal.student.first_name} {appraisal.student.last_name}".strip() or appraisal.student.sch_email,
                    "studentId": appraisal.student.index_number,
                    "supervisorName": appraisal.supervisor.fullname,
                    "submittedOn": appraisal.submitted_at.date().isoformat(),
                }
            )

        return Response({"finalReports": final_reports, "appraisalForms": appraisal_forms})


class AdminReportDetailView(APIView):
    permission_classes = [IsAdminStaffUser]

    def _get_report(self, report_id):
        return Report.objects.filter(report_id=report_id).select_related("student").first()

    def get(self, request, report_id):
        report = self._get_report(report_id)
        if not report:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        summary = (report.supervisor_feedback or "").strip()
        if not summary:
            summary = "No supervisor feedback yet."

        sections = []
        if report.report_file:
            sections.append(f"Report file reference: {report.report_file}")
        sections.append(f"Current status: {report.status}")
        sections.append(f"Score: {report.grade if report.grade is not None else 'Not scored'}")

        payload = {
            "id": str(report.report_id),
            "studentName": f"{report.student.first_name} {report.student.last_name}".strip() or report.student.sch_email,
            "studentId": report.student.index_number,
            "department": report.student.department,
            "company": report.student.company,
            "title": "Final Internship Report",
            "submittedOn": report.created_at.date().isoformat(),
            "type": "Final Report",
            "summary": summary,
            "sections": sections,
            "status": report.status,
            "grade": str(report.grade) if report.grade is not None else "",
            "score": str(report.grade) if report.grade is not None else "",
            "feedback": report.supervisor_feedback or "",
            "reportFileSubmitted": bool((report.report_file or "").strip()),
            "reportFileName": os.path.basename(report.report_file) if (report.report_file or "").strip() else "",
            "reportDownloadUrl": f"/api/admin/reports/{report.report_id}/download/" if (report.report_file or "").strip() else "",
            "reportPreviewUrl": f"/api/admin/reports/{report.report_id}/preview/" if ((report.report_file or "").strip() and (os.path.basename(report.report_file).lower().endswith('.pdf'))) else "",
        }
        return Response(payload)

    def patch(self, request, report_id):
        report = self._get_report(report_id)
        if not report:
            return Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        decision = request.data.get("decision", "").strip()
        comment = request.data.get("comment", "").strip()
        score_value = request.data.get("score", request.data.get("grade"))

        if comment:
            report.supervisor_feedback = comment

        if decision == "Approved":
            report.status = "graded"
        else:
            report.status = "ready"

        if score_value not in [None, ""]:
            try:
                report.grade = float(score_value)
            except (TypeError, ValueError):
                return Response({"score": "Score must be a numeric value."}, status=status.HTTP_400_BAD_REQUEST)

        report.save(update_fields=["supervisor_feedback", "status", "grade", "updated_at"])
        return self.get(request, report_id)


class AdminAppraisalDetailView(APIView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request, appraisal_id):
        appraisal = Appraisal.objects.filter(appraisal_id=appraisal_id).select_related("student", "supervisor").first()
        if not appraisal:
            return Response({"detail": "Appraisal not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(AppraisalSerializer(appraisal, context={"request": request}).data)


class AdminReportDownloadView(APIView):
    permission_classes = [IsAdminStaffUser]

    def _resolve_report_file(self, report_id):
        report = Report.objects.filter(report_id=report_id).first()
        if not report:
            return None, None, Response({"detail": "Report not found."}, status=status.HTTP_404_NOT_FOUND)

        file_path = (report.report_file or "").strip()
        if not file_path:
            return None, None, Response({"detail": "No uploaded file is attached to this report."}, status=status.HTTP_404_NOT_FOUND)

        if not default_storage.exists(file_path):
            return None, None, Response({"detail": "Stored report file could not be found."}, status=status.HTTP_404_NOT_FOUND)

        return report, file_path, None

    def get(self, request, report_id):
        _, file_path, error_response = self._resolve_report_file(report_id)
        if error_response:
            return error_response

        filename = os.path.basename(file_path)
        content_type = mimetypes.guess_type(filename)[0] or "application/octet-stream"
        file_handle = default_storage.open(file_path, "rb")
        return FileResponse(file_handle, as_attachment=True, filename=filename, content_type=content_type)


class AdminReportPreviewView(AdminReportDownloadView):
    permission_classes = [IsAdminStaffUser]

    def get(self, request, report_id):
        _, file_path, error_response = self._resolve_report_file(report_id)
        if error_response:
            return error_response

        filename = os.path.basename(file_path)
        if not filename.lower().endswith('.pdf'):
            return Response({"detail": "Only PDF files can be previewed inline."}, status=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

        file_handle = default_storage.open(file_path, "rb")
        response = FileResponse(file_handle, as_attachment=False, filename=filename, content_type="application/pdf")
        response["Content-Disposition"] = f'inline; filename="{filename}"'
        return response
