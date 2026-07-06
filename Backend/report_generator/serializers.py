from rest_framework import serializers

from .models import DailyLog, InternshipReportDraft, LogFeedback, StudentProfile, Supervisor, SupervisorProfile


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
            "supervisor",
            "supervisor_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "supervisor_name", "created_at", "updated_at"]


class LogFeedbackSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="review_id", read_only=True)
    supervisor_name = serializers.CharField(source="supervisor.fullname", read_only=True)

    class Meta:
        model = LogFeedback
        fields = ["id", "decision", "comment", "supervisor_name", "created_at", "updated_at"]
        read_only_fields = ["id", "supervisor_name", "created_at", "updated_at"]


class DailyLogSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source="log_id", read_only=True)
    date = serializers.DateField(source="log_date", required=False, allow_null=True)
    content = serializers.CharField(source="log_text")
    title = serializers.CharField(required=False, allow_blank=True, write_only=True)
    feedback = LogFeedbackSerializer(read_only=True)

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "date",
            "title",
            "content",
            "status",
            "feedback",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "status", "feedback", "created_at", "updated_at"]

    def create(self, validated_data):
        validated_data.pop("title", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        validated_data.pop("title", None)
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
