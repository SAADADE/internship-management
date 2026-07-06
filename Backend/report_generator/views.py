import logging

from django.http import HttpResponse
from rest_framework import status
from rest_framework.parsers import JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .docx_builder import build_docx
from .file_extractor import extract_text_from_file
from .llm_service import generate_report_structure
from .models import DailyLog, InternshipReportDraft, LogFeedback, StudentProfile, SupervisorProfile
from .serializers import (
    BulkStatusUpdateSerializer,
    DailyLogSerializer,
    InternshipReportDraftSerializer,
    ReportRequestSerializer,
    StudentProfileSerializer,
    SupervisorLogUpdateSerializer,
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


class StudentProfileView(APIView):
    permission_classes = [IsAuthenticated]

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


class StudentLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        logs = DailyLog.objects.filter(student=profile).order_by("-log_date", "-created_at")
        return Response(DailyLogSerializer(logs, many=True).data)

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        serializer = DailyLogSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save(student=profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile = StudentProfile.objects.get(user=request.user)
        draft, _ = InternshipReportDraft.objects.get_or_create(student=profile)
        serializer = InternshipReportDraftSerializer(draft, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class StudentGenerateReportView(APIView):
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        students = supervisor.students.all().order_by("first_name", "last_name")
        return Response(StudentProfileSerializer(students, many=True).data)


class SupervisorLogsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        logs = DailyLog.objects.filter(student__supervisor=supervisor).order_by("-log_date", "-created_at")
        return Response(DailyLogSerializer(logs, many=True).data)


class SupervisorLogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, log_id):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        log = DailyLog.objects.filter(student__supervisor=supervisor, log_id=log_id).first()
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
            },
        )

        return Response(DailyLogSerializer(log).data)


class SupervisorBulkStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        supervisor = SupervisorProfile.objects.get(user=request.user)
        serializer = BulkStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        logs = DailyLog.objects.filter(student__supervisor=supervisor)
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
