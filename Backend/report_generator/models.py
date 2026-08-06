import uuid

from django.conf import settings
from django.db import models


class Student(models.Model):
    student_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="student",
        null=True,
        blank=True,
    )
    sch_email = models.EmailField(unique=True)
    index_number = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    faculty = models.CharField(max_length=150, blank=True)
    department = models.CharField(max_length=150, blank=True)
    programme = models.CharField(max_length=150, blank=True)
    level = models.CharField(max_length=10, blank=True)
    institution_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    supervisors = models.ManyToManyField(
        "Supervisor",
        related_name="students",
        blank=True,
    )
    password_hash = models.TextField(default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def email(self):
        return self.sch_email

    @property
    def company(self):
        internship = self.internships.order_by("created_at").first()
        return internship.company_name if internship else ""

    @property
    def position(self):
        internship = self.internships.order_by("created_at").first()
        return internship.internship_position if internship else ""

    @property
    def university(self):
        return ""

    def link_supervisor_by_email(self, email):
        normalized_email = (email or "").strip()
        if not normalized_email:
            return None

        supervisor = Supervisor.objects.filter(email__iexact=normalized_email).first()
        if supervisor:
            self.supervisors.add(supervisor)
        return supervisor

    def __str__(self):
        return f"{self.first_name} {self.last_name}".strip() or self.sch_email


StudentProfile = Student


class Supervisor(models.Model):
    supervisor_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="supervisor",
        null=True,
        blank=True,
    )
    fullname = models.CharField(max_length=150)
    password_hash = models.TextField(default="")
    email = models.EmailField(unique=True, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def link_students_by_email(self):
        normalized_email = (self.email or "").strip()
        if not normalized_email:
            return 0

        students = Student.objects.filter(
            internships__internship_supervisor_email__iexact=normalized_email
        ).distinct()
        for student in students:
            student.supervisors.add(self)
        return students.count()

    def __str__(self):
        return self.fullname or self.user.username or "Supervisor"


SupervisorProfile = Supervisor


class Internship(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("active", "Active"),
        ("completed", "Completed"),
        ("rejected", "Rejected"),
    ]

    internship_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company_name = models.CharField(max_length=200)
    company_address = models.TextField(blank=True)
    internship_position = models.CharField(max_length=150)
    internship_supervisor = models.CharField(max_length=150, blank=True)
    internship_supervisor_email = models.EmailField(blank=True)
    internship_duration = models.CharField(max_length=100, blank=True)
    department = models.CharField(max_length=150, blank=True)
    description = models.TextField(blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="internships")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.company_name} - {self.student}"


class Log(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("submitted", "Submitted"),
        ("reviewed", "Reviewed"),
        ("needs_revision", "Needs Revision"),
    ]

    log_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="logs")
    internship = models.ForeignKey(Internship, on_delete=models.SET_NULL, related_name="logs", null=True, blank=True)
    student_name = models.CharField(max_length=255, blank=True)
    student_index_number = models.CharField(max_length=50, blank=True)
    department = models.CharField(max_length=150, blank=True)
    programme = models.CharField(max_length=150, blank=True)
    level = models.CharField(max_length=20, blank=True)
    institution = models.CharField(max_length=255, blank=True)
    company_name = models.CharField(max_length=200, blank=True)
    department_unit = models.CharField(max_length=150, blank=True)
    supervisor_name = models.CharField(max_length=150, blank=True)
    log_text = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    week_number = models.PositiveSmallIntegerField(null=True, blank=True)
    log_date = models.DateField(null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    achievements = models.TextField(blank=True)
    daily_entries = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} - {self.log_date or self.created_at.date()}"


DailyLog = Log


class Report(models.Model):
    STATUS_CHOICES = [
        ("generating", "Generating"),
        ("ready", "Ready"),
        ("graded", "Graded"),
    ]

    report_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name="reports")
    report_file = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="generating")
    grade = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    supervisor_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Report for {self.student}"


class Review(models.Model):
    DECISION_CHOICES = [
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    review_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    report = models.ForeignKey(Report, on_delete=models.CASCADE, related_name="reviews", null=True, blank=True)
    log = models.OneToOneField(Log, on_delete=models.CASCADE, related_name="feedback", null=True, blank=True)
    review_text = models.TextField(blank=True)
    supervisor = models.ForeignKey(
        Supervisor,
        on_delete=models.PROTECT,
        related_name="reviews",
        null=True,
        blank=True,
    )
    decision = models.CharField(max_length=20, choices=DECISION_CHOICES, blank=True)
    comment = models.TextField(blank=True)
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        if self.log is not None:
            next_status = "reviewed" if self.decision == "approved" else "needs_revision"
            if self.log.status != next_status:
                self.log.status = next_status
                self.log.save(update_fields=["status", "updated_at"])

    def __str__(self):
        return f"{self.log} - {self.decision or 'review'}"


LogFeedback = Review


class Appraisal(models.Model):
    appraisal_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="appraisal")
    supervisor = models.ForeignKey(
        Supervisor,
        on_delete=models.PROTECT,
        related_name="appraisals",
    )
    scores = models.JSONField(default=dict, blank=True)
    general_comments = models.TextField(blank=True)
    supervisor_name = models.CharField(max_length=150, blank=True)
    position = models.CharField(max_length=150, blank=True)
    signature = models.TextField(blank=True)
    appraisal_date = models.DateField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Appraisal for {self.student}"


class InternshipReportDraft(models.Model):
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name="report_draft")
    introduction = models.TextField(blank=True)
    abstract = models.TextField(blank=True)
    conclusion = models.TextField(blank=True)
    department = models.CharField(max_length=255, blank=True)
    company_name = models.CharField(max_length=255, blank=True)
    supervisor_name = models.CharField(max_length=255, blank=True)
    additional_notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.student} - Report Draft"
