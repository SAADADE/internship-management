from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import DailyLog, Internship, InternshipReportDraft, LogFeedback, Report, StudentProfile, Supervisor, SupervisorProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="student_id", read_only=True)
    sch_email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    supervisor_name = serializers.CharField(source="supervisor.fullname", read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "user",
            "teams_id",
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
            "supervisor",
            "supervisor_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "supervisor_name", "created_at", "updated_at"]


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
        if attrs.get("role") == "student" and not attrs.get("index_number"):
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
        fields = ["id", "decision", "comment", "supervisor_name", "created_at", "updated_at"]
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
            internship = Internship.objects.filter(internship_id=internship_id).first()
            if internship:
                instance.internship = internship
                instance.save(update_fields=["internship"])
        return instance

    def update(self, instance, validated_data):
        validated_data.pop("title", None)
        validated_data.pop("internship_id", None)
        return super().update(instance, validated_data)


class SupervisorLogUpdateSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["approved", "rejected"])
    comment = serializers.CharField(required=False, allow_blank=True, default="")


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
