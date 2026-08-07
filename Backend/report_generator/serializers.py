from django.contrib.auth import get_user_model
from django.db import OperationalError, ProgrammingError
from rest_framework import serializers
from django.utils import timezone

from .models import ActivityLog, Appraisal, Company, CompanyRequest, DailyLog, Internship, InternshipReportDraft, LogFeedback, Report, StudentProfile, Supervisor, SupervisorProfile


APPRAISAL_SCORE_LABELS = {
    "punctuality": "1. Punctuality at Work",
    "attitude": "2. Ability on the Job / Attitude to Work",
    "superiors": "3. Relationship with Superiors",
    "colleagues": "4. Relationship with Colleagues",
    "cooperation": "5. Cooperation",
    "safety": "6. Safety Consciousness",
    "resourcefulness": "7. Resourcefulness",
    "initiative": "8. Initiative",
    "leadership": "9. Leadership Drive",
}


class CompanySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="company_id", read_only=True)

    class Meta:
        model = Company
        fields = ["id", "name", "location"]
        read_only_fields = ["id"]


class AdminCompanySerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="company_id", read_only=True)
    createdBy = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = ["id", "name", "location", "createdBy", "created_at", "updated_at"]
        read_only_fields = ["id", "createdBy", "created_at", "updated_at"]

    def get_createdBy(self, obj):
        if obj.created_by is None:
            return None
        return {
            "id": obj.created_by.id,
            "username": obj.created_by.username,
            "email": obj.created_by.email,
        }

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Company name is required.")

        existing = Company.objects.filter(name__iexact=normalized)
        if self.instance is not None:
            existing = existing.exclude(pk=self.instance.pk)
        if existing.exists():
            raise serializers.ValidationError("A company with this name already exists.")
        return normalized

    def validate_location(self, value):
        normalized = (value or "").strip()
        if not normalized:
            raise serializers.ValidationError("Company location is required.")
        return normalized


class StudentCompanyRequestSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="request_id", read_only=True)
    requestedBy = serializers.SerializerMethodField()

    class Meta:
        model = CompanyRequest
        fields = [
            "id",
            "name",
            "location",
            "note",
            "status",
            "requestedBy",
            "admin_note",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "status",
            "requestedBy",
            "admin_note",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_requestedBy(self, obj):
        student = obj.requested_by
        return {
            "id": student.student_id,
            "name": f"{student.first_name} {student.last_name}".strip() or student.sch_email,
            "index_number": student.index_number,
            "email": student.sch_email,
        }

    def validate_name(self, value):
        normalized = value.strip()
        if not normalized:
            raise serializers.ValidationError("Company name is required.")

        if Company.objects.filter(name__iexact=normalized).exists():
            raise serializers.ValidationError("This company already exists in the directory.")

        request = self.context.get("request")
        student = getattr(getattr(request, "user", None), "student", None)
        if student and CompanyRequest.objects.filter(
            requested_by=student,
            name__iexact=normalized,
            status="pending",
        ).exists():
            raise serializers.ValidationError("You already have a pending request for this company.")

        return normalized


class AdminCompanyRequestReviewSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="request_id", read_only=True)
    requestedBy = serializers.SerializerMethodField()

    class Meta:
        model = CompanyRequest
        fields = [
            "id",
            "name",
            "location",
            "note",
            "status",
            "requestedBy",
            "admin_note",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "name",
            "location",
            "note",
            "requestedBy",
            "reviewed_at",
            "created_at",
            "updated_at",
        ]

    def get_requestedBy(self, obj):
        student = obj.requested_by
        return {
            "id": student.student_id,
            "name": f"{student.first_name} {student.last_name}".strip() or student.sch_email,
            "index_number": student.index_number,
            "email": student.sch_email,
        }

    def validate_status(self, value):
        if value not in {"approved", "rejected"}:
            raise serializers.ValidationError("Status must be either approved or rejected.")
        return value


class ActivityNotificationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="activity_id", read_only=True)
    type = serializers.CharField(source="activity_type", read_only=True)
    read = serializers.BooleanField(source="is_read", read_only=True)
    time = serializers.SerializerMethodField()
    actorName = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            "id",
            "type",
            "title",
            "message",
            "time",
            "read",
            "actorName",
            "metadata",
            "created_at",
        ]
        read_only_fields = fields

    def get_time(self, obj):
        return timezone.localtime(obj.created_at).isoformat()

    def get_actorName(self, obj):
        actor = obj.actor
        if not actor:
            return "System"
        display_name = actor.get_full_name().strip()
        return display_name or actor.username


class StudentProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="student_id", read_only=True)
    sch_email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    supervisors = serializers.SerializerMethodField()

    def get_supervisors(self, obj):
        return [
            {"id": supervisor.supervisor_id, "fullname": supervisor.fullname, "email": supervisor.email}
            for supervisor in obj.supervisors.all().order_by("fullname")
        ]

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "sch_email",
            "index_number",
            "first_name",
            "last_name",
            "faculty",
            "department",
            "programme",
            "level",
            "institution_name",
            "phone_number",
            "supervisors",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "supervisors", "created_at", "updated_at"]


class UserRegistrationSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150)
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=["student", "supervisor"], default="student")
    index_number = serializers.CharField(required=False, allow_blank=True, max_length=50)
    faculty = serializers.CharField(required=False, allow_blank=True, max_length=150)
    department = serializers.CharField(required=False, allow_blank=True, max_length=150)
    programme = serializers.CharField(required=False, allow_blank=True, max_length=150)
    level = serializers.CharField(required=False, allow_blank=True, max_length=10)
    institution_name = serializers.CharField(required=False, allow_blank=True, max_length=255)
    phone_number = serializers.CharField(required=False, allow_blank=True, max_length=50)

    def validate(self, attrs):
        user_model = get_user_model()
        if user_model.objects.filter(username=attrs["username"]).exists():
            raise serializers.ValidationError({"username": "A user with that username already exists."})
        if user_model.objects.filter(email__iexact=attrs["email"]).exists():
            raise serializers.ValidationError({"email": "A user with that email already exists."})
        if attrs.get("role") == "student":
            if not attrs.get("index_number"):
                raise serializers.ValidationError({"index_number": "Index number is required for students."})
        return attrs



class AuthLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs["new_password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return attrs


class InternshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Internship
        fields = [
            "internship_id",
            "company_name",
            "company_address",
            "internship_position",
            "internship_supervisor",
            "internship_supervisor_email",
            "internship_duration",
            "department",
            "description",
            "start_date",
            "end_date",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["internship_id", "status", "created_at", "updated_at"]


class LogFeedbackSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="review_id", read_only=True)
    supervisor_name = serializers.CharField(source="supervisor.fullname", read_only=True)

    class Meta:
        model = LogFeedback
        fields = ["id", "decision", "comment", "score", "supervisor_name", "created_at", "updated_at"]
        read_only_fields = ["id", "supervisor_name", "created_at", "updated_at"]


class ReportSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="report_id", read_only=True)
    title = serializers.SerializerMethodField()
    type = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    grade = serializers.SerializerMethodField()
    feedback = serializers.CharField(source="supervisor_feedback", read_only=True)

    class Meta:
        model = Report
        fields = ["id", "title", "type", "date", "status", "grade", "feedback", "created_at", "updated_at"]
        read_only_fields = ["id", "title", "type", "date", "status", "grade", "feedback", "created_at", "updated_at"]

    def get_title(self, obj):
        return f"Internship Report — {obj.created_at.strftime('%Y-%m-%d')}"

    def get_type(self, obj):
        return "Report"

    def get_date(self, obj):
        return obj.created_at.date().isoformat()

    def get_status(self, obj):
        return "Reviewed" if obj.status == "graded" else "Pending"

    def get_grade(self, obj):
        if obj.grade is None:
            return "-"
        if obj.grade >= 4.0:
            return "A"
        return str(obj.grade)


class StudentFeedbackSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="review_id", read_only=True)
    reportTitle = serializers.SerializerMethodField()
    reportId = serializers.SerializerMethodField()
    supervisor = serializers.CharField(source="supervisor.fullname", read_only=True)
    supervisorRole = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    feedback = serializers.CharField(source="comment", read_only=True)
    status = serializers.SerializerMethodField()
    section = serializers.SerializerMethodField()

    class Meta:
        model = LogFeedback
        fields = ["id", "reportTitle", "reportId", "supervisor", "supervisorRole", "date", "rating", "feedback", "status", "section"]

    def get_reportTitle(self, obj):
        return f"Week {obj.log.week_number or 1} - Feedback"

    def get_reportId(self, obj):
        return f"#{str(obj.log.log_id)[:8].upper()}"

    def get_supervisorRole(self, obj):
        return "Supervisor"

    def get_date(self, obj):
        return obj.created_at.date().isoformat()

    def get_rating(self, obj):
        if obj.score is not None:
            return max(1, min(5, obj.score))
        return 5 if obj.decision == "approved" else 3

    def get_status(self, obj):
        return "read"

    def get_section(self, obj):
        return "Supervisor Review"


class StudentActivityItemSerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    source = serializers.CharField(read_only=True)
    title = serializers.CharField(read_only=True)
    type = serializers.CharField(read_only=True)
    date = serializers.CharField(read_only=True)
    status = serializers.CharField(read_only=True)
    grade = serializers.CharField(read_only=True, allow_blank=True)
    feedback = serializers.CharField(read_only=True, allow_blank=True)
    company_name = serializers.CharField(read_only=True, allow_blank=True)
    week_number = serializers.IntegerField(read_only=True, required=False)
    details = serializers.CharField(read_only=True, allow_blank=True)
    created_at = serializers.DateTimeField(read_only=True)


class DailyLogSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="log_id", read_only=True)
    date = serializers.DateField(source="log_date", required=False, allow_null=True)
    content = serializers.CharField(source="log_text", required=False, allow_blank=True)
    title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    feedback = LogFeedbackSerializer(read_only=True)
    start_date = serializers.DateField(required=False, allow_null=True)
    end_date = serializers.DateField(required=False, allow_null=True)
    achievements = serializers.CharField(required=False, allow_blank=True)
    daily_entries = serializers.JSONField(required=False, default=list)
    student_name = serializers.CharField(required=False, allow_blank=True)
    student_index_number = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)
    programme = serializers.CharField(required=False, allow_blank=True)
    level = serializers.CharField(required=False, allow_blank=True)
    institution = serializers.CharField(required=False, allow_blank=True)
    company_name = serializers.CharField(required=False, allow_blank=True)
    department_unit = serializers.CharField(required=False, allow_blank=True)
    supervisor_name = serializers.CharField(required=False, allow_blank=True)
    internship_id = serializers.UUIDField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "date",
            "title",
            "content",
            "status",
            "week_number",
            "start_date",
            "end_date",
            "achievements",
            "daily_entries",
            "student_name",
            "student_index_number",
            "department",
            "programme",
            "level",
            "institution",
            "company_name",
            "department_unit",
            "supervisor_name",
            "internship_id",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "feedback", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data.pop("title", None)
        internship_id = validated_data.pop("internship_id", None)
        if not validated_data.get("log_text"):
            validated_data["log_text"] = validated_data.get("achievements", "") or ""
        instance = super().create(validated_data)
        if internship_id:
            internship = Internship.objects.filter(
                internship_id=internship_id,
                student=instance.student,
            ).first()
            if internship:
                instance.internship = internship
                instance.save(update_fields=["internship"])
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        student = instance.student
        internship = instance.internship

        if not data.get("student_name") and student:
            data["student_name"] = f"{student.first_name} {student.last_name}".strip() or student.sch_email
        if not data.get("student_index_number") and student:
            data["student_index_number"] = student.index_number
        if not data.get("company_name") and internship:
            data["company_name"] = internship.company_name
        if not data.get("department") and internship:
            data["department"] = internship.department
        if not data.get("supervisor_name") and internship and internship.internship_supervisor:
            data["supervisor_name"] = internship.internship_supervisor
        return data

    def update(self, instance, validated_data):
        validated_data.pop("title", None)
        validated_data.pop("internship_id", None)
        return super().update(instance, validated_data)


class SupervisorReportSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="log_id", read_only=True)
    title = serializers.SerializerMethodField()
    studentName = serializers.SerializerMethodField()
    studentId = serializers.SerializerMethodField()
    reportWeek = serializers.SerializerMethodField()
    submissionDate = serializers.SerializerMethodField()
    dueDate = serializers.SerializerMethodField()
    status = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    company = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "title",
            "studentName",
            "studentId",
            "reportWeek",
            "submissionDate",
            "dueDate",
            "status",
            "rating",
            "company",
            "feedback",
        ]

    def _submission_date(self, obj):
        return obj.log_date or obj.created_at.date()

    def _due_date(self, obj):
        if obj.end_date:
            return obj.end_date
        submission_date = self._submission_date(obj)
        return submission_date + timezone.timedelta(days=7)

    def get_title(self, obj):
        week_number = obj.week_number or 1
        return f"Week {week_number} - Weekly Log Sheet"

    def get_studentName(self, obj):
        if obj.student_name:
            return obj.student_name
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.sch_email

    def get_studentId(self, obj):
        return obj.student_index_number or obj.student.index_number

    def get_reportWeek(self, obj):
        week_number = obj.week_number or 1
        return f"Week {week_number}"

    def get_submissionDate(self, obj):
        return self._submission_date(obj).isoformat()

    def get_dueDate(self, obj):
        return self._due_date(obj).isoformat()

    def get_status(self, obj):
        if obj.status == "reviewed":
            return "reviewed"
        if obj.status == "needs_revision":
            return "needs_revision"

        is_late = timezone.now().date() > self._due_date(obj)
        return "late" if is_late else "pending"

    def get_rating(self, obj):
        if not hasattr(obj, "feedback") or obj.feedback is None:
            return 0
        if obj.feedback.score is not None:
            return max(1, min(5, obj.feedback.score))
        return 5 if obj.feedback.decision == "approved" else 3

    def get_company(self, obj):
        return obj.company_name or (obj.internship.company_name if obj.internship else "")

    def get_feedback(self, obj):
        if not hasattr(obj, "feedback") or obj.feedback is None:
            return None
        return obj.feedback.comment or None


class SupervisorLogUpdateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approved", "rejected"])
    comment = serializers.CharField(required=False, allow_blank=True, default="")
    score = serializers.IntegerField(required=False, allow_null=True, min_value=1, max_value=5)


class AppraisalSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="appraisal_id", read_only=True)
    student = serializers.UUIDField(source="student.student_id", read_only=True)
    student_id = serializers.UUIDField(write_only=True, required=True)
    studentName = serializers.SerializerMethodField()
    studentId = serializers.SerializerMethodField()
    department = serializers.SerializerMethodField()
    supervisorName = serializers.CharField(source="supervisor_name", required=False, allow_blank=True)
    generalComments = serializers.CharField(source="general_comments", required=False, allow_blank=True)
    date = serializers.DateField(source="appraisal_date", required=False, allow_null=True)
    submittedOn = serializers.DateTimeField(source="submitted_at", read_only=True)
    status = serializers.SerializerMethodField()
    criteria = serializers.SerializerMethodField()

    class Meta:
        model = Appraisal
        fields = [
            "id",
            "student",
            "student_id",
            "studentName",
            "studentId",
            "department",
            "scores",
            "criteria",
            "generalComments",
            "supervisorName",
            "position",
            "signature",
            "date",
            "submittedOn",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "student",
            "studentName",
            "studentId",
            "department",
            "criteria",
            "submittedOn",
            "status",
            "created_at",
            "updated_at",
        ]

    def get_studentName(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}".strip() or obj.student.sch_email

    def get_studentId(self, obj):
        return obj.student.index_number

    def get_department(self, obj):
        return obj.student.department

    def get_status(self, obj):
        return "Appraised"

    def get_criteria(self, obj):
        return [
            {"key": key, "label": label, "score": obj.scores.get(key, "")}
            for key, label in APPRAISAL_SCORE_LABELS.items()
        ]

    def validate_scores(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("Scores must be an object keyed by appraisal criteria.")

        missing_keys = [key for key in APPRAISAL_SCORE_LABELS if str(value.get(key, "")).strip() == ""]
        if missing_keys:
            raise serializers.ValidationError({"missing": missing_keys})

        normalized_scores = {}
        for key in APPRAISAL_SCORE_LABELS:
            score = str(value[key]).strip()
            if score not in {"1", "2", "3", "4", "5"}:
                raise serializers.ValidationError(f"Invalid score '{score}' for {key}.")
            normalized_scores[key] = score
        return normalized_scores

    def validate_student_id(self, value):
        request = self.context.get("request")
        supervisor = getattr(getattr(request, "user", None), "supervisor", None)
        student = StudentProfile.objects.filter(student_id=value).first()

        if not student:
            raise serializers.ValidationError("Student not found.")
        try:
            has_access = student.internships.filter(supervisor=supervisor).exists()
        except (OperationalError, ProgrammingError):
            has_access = student.supervisors.filter(pk=supervisor.pk).exists() if supervisor else False
        if not supervisor or not has_access:
            raise serializers.ValidationError("You can only appraise students assigned to you.")

        existing_appraisal = getattr(student, "appraisal", None)
        if existing_appraisal and self.instance is None:
            raise serializers.ValidationError("This student has already been appraised.")
        if existing_appraisal and self.instance and existing_appraisal.pk != self.instance.pk:
            raise serializers.ValidationError("This student has already been appraised.")

        self.context["appraisal_student"] = student
        return value

    def validate(self, attrs):
        if self.instance is not None and "student_id" in attrs:
            attrs.pop("student_id", None)
        return attrs

    def create(self, validated_data):
        validated_data.pop("student_id", None)
        student = self.context["appraisal_student"]
        supervisor = self.context["request"].user.supervisor
        return Appraisal.objects.create(student=student, supervisor=supervisor, **validated_data)


class SupervisorAssignedStudentSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="student_id", read_only=True)
    name = serializers.SerializerMethodField()
    index = serializers.CharField(source="index_number", read_only=True)
    status = serializers.SerializerMethodField()
    canAppraise = serializers.SerializerMethodField()
    appraisal = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = ["id", "name", "index", "department", "status", "canAppraise", "appraisal"]

    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.sch_email

    def get_status(self, obj):
        return "Appraised" if hasattr(obj, "appraisal") else "Pending Appraisal"

    def get_canAppraise(self, obj):
        supervisor = self.context["request"].user.supervisor
        appraisal = getattr(obj, "appraisal", None)
        return appraisal is None or appraisal.supervisor_id == supervisor.pk

    def get_appraisal(self, obj):
        appraisal = getattr(obj, "appraisal", None)
        if appraisal is None:
            return None
        return AppraisalSerializer(appraisal, context=self.context).data


class InternshipReportDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipReportDraft
        fields = [
            "introduction",
            "abstract",
            "conclusion",
            "department",
            "company_name",
            "supervisor_name",
            "additional_notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["created_at", "updated_at"]


class BulkStatusUpdateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approved", "rejected"])
    comment = serializers.CharField(required=False, allow_blank=True, default="")


class ReportRequestSerializer(serializers.Serializer):
    """
    Accepts either a raw text body or an uploaded .txt / .docx file.
    Additional metadata fields are all optional — the LLM will infer
    sensible defaults from the supplied document text when omitted.
    """

    text = serializers.CharField(
        required=False,
        allow_blank=False,
        help_text="Raw text extracted from the intern's notes / draft report.",
    )
    file = serializers.FileField(
        required=False,
        help_text="Plain-text (.txt) or Word (.docx) document with intern notes.",
    )

    intern_name = serializers.CharField(
        required=False,
        default="",
        max_length=200,
        help_text="Full name of the intern.",
    )
    company_name = serializers.CharField(
        required=False,
        default="",
        max_length=300,
        help_text="Name of the host organisation.",
    )
    internship_duration = serializers.CharField(
        required=False,
        default="",
        max_length=100,
        help_text='Duration, e.g. "June  August 2025 (12 weeks)".',
    )
    department = serializers.CharField(
        required=False,
        default="",
        max_length=200,
        help_text="Department or team the intern was attached to.",
    )
    supervisor_name = serializers.CharField(
        required=False,
        default="",
        max_length=200,
        help_text="Name of the internship supervisor.",
    )
    institution_name = serializers.CharField(
        required=False,
        default="",
        max_length=300,
        help_text="University / polytechnic the intern attends.",
    )
    programme = serializers.CharField(
        required=False,
        default="",
        max_length=200,
        help_text='Academic programme, e.g. "BSc Computer Science".',
    )
    additional_instructions = serializers.CharField(
        required=False,
        default="",
        help_text="Any extra formatting or content instructions for the LLM.",
    )

    def validate(self, attrs):
        if not attrs.get("text") and not attrs.get("file"):
            raise serializers.ValidationError(
                "You must supply either 'text' or a 'file'."
            )
        return attrs
