import logging

from django.contrib.auth import authenticate, get_user_model, login
from django.db.models import Q
from django.utils import timezone
from django.http import HttpResponse
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
        return request.method == "POST" and getattr(request.user, "supervisor", None) is None


class IsSupervisorUser(IsAuthenticated):
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return getattr(request.user, "supervisor", None) is not None
from rest_framework.response import Response
from rest_framework.views import APIView

from .docx_builder import build_docx
from .file_extractor import extract_text_from_file
from .llm_service import generate_report_structure
from .models import Appraisal, DailyLog, Internship, InternshipReportDraft, LogFeedback, Report, StudentProfile, SupervisorProfile
from .serializers import (
    AppraisalSerializer,
    AuthLoginSerializer,
    BulkStatusUpdateSerializer,
    DailyLogSerializer,
    InternshipReportDraftSerializer,
    InternshipSerializer,
    PasswordChangeSerializer,
    ReportRequestSerializer,
    ReportSerializer,
    StudentActivityItemSerializer,
    StudentFeedbackSerializer,
    StudentProfileSerializer,
    SupervisorAssignedStudentSerializer,
    SupervisorReportSerializer,
    SupervisorLogUpdateSerializer,
    UserRegistrationSerializer,
)

logger = logging.getLogger(__name__)


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
        internship = serializer.save(student=profile)
        profile.link_supervisor_by_email(internship.internship_supervisor_email)
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
        serializer.save(student=profile)
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

        log_sections = []
        for log in approved_logs:
            log_sections.append(f"Date: {log.log_date}\n{log.log_text}")

        document_text = "\n\n".join(
            [
                f"Introduction:\n{draft.introduction}",
                f"Abstract:\n{draft.abstract}",
                f"Conclusion:\n{draft.conclusion}",
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

        filename = f"internship_report_{request.user.username}.docx"
        response = HttpResponse(
            docx_bytes,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = len(docx_bytes)
        return response


class SupervisorStudentsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        students = supervisor.students.all().order_by("first_name", "last_name")
        return Response(StudentProfileSerializer(students, many=True).data)


class SupervisorAssignedAppraisalStudentsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        students = supervisor.students.all().select_related("appraisal").order_by("first_name", "last_name")
        return Response(SupervisorAssignedStudentSerializer(students, many=True, context={"request": request}).data)


class SupervisorLogsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        logs = DailyLog.objects.filter(student__supervisors=supervisor).distinct().order_by("-log_date", "-created_at")
        return Response(DailyLogSerializer(logs, many=True).data)


class SupervisorReportsView(APIView):
    permission_classes = [IsSupervisorUser]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
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

        return Response(DailyLogSerializer(log).data)


class SupervisorBulkStatusView(APIView):
    permission_classes = [IsSupervisorUser]

    def post(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        serializer = BulkStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        logs = DailyLog.objects.filter(student__supervisors=supervisor).distinct()
        decision = serializer.validated_data["decision"]
        comment = serializer.validated_data.get("comment", "")

        for log in logs:
            LogFeedback.objects.update_or_create(
                log=log,
                defaults={
                    "supervisor": supervisor,
                    "decision": decision,
                    "comment": comment,
                },
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
