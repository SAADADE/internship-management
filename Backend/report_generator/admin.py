from django.contrib import admin

from .models import ActivityLog, Appraisal, Company, CompanyRequest, Internship, InternshipReportDraft, Log, Report, Review, Student, Supervisor


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "created_by", "created_at")
    list_filter = ("location", "created_at")
    search_fields = ("name", "created_by__username", "created_by__email")


@admin.register(CompanyRequest)
class CompanyRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "location", "status", "requested_by", "reviewed_by", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("name", "requested_by__sch_email", "reviewed_by__username")


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("sch_email", "index_number", "first_name", "last_name", "department", "programme", "supervisor_list", "created_at")
    search_fields = ("sch_email", "index_number", "first_name", "last_name", "department", "programme")

    def supervisor_list(self, obj):
        return ", ".join(obj.supervisors.values_list("fullname", flat=True))

    supervisor_list.short_description = "Supervisors"


@admin.register(Supervisor)
class SupervisorAdmin(admin.ModelAdmin):
    list_display = ("fullname", "email", "created_at")
    search_fields = ("fullname", "email")


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = ("student", "company_name", "internship_position", "status", "created_at")
    list_filter = ("status",)
    search_fields = ("company_name", "internship_position", "student__sch_email")


@admin.register(Log)
class LogAdmin(admin.ModelAdmin):
    list_display = ("student", "log_date", "status", "created_at")
    list_filter = ("status", "log_date")
    search_fields = ("student__sch_email", "log_text")


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("log", "supervisor", "decision", "created_at")
    list_filter = ("decision", "created_at")
    search_fields = ("log__student__sch_email", "comment", "supervisor__fullname")


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ("student", "status", "grade", "created_at")
    list_filter = ("status",)
    search_fields = ("student__sch_email", "supervisor_feedback")


@admin.register(InternshipReportDraft)
class InternshipReportDraftAdmin(admin.ModelAdmin):
    list_display = ("student", "created_at")
    search_fields = ("student__sch_email", "introduction", "abstract", "conclusion")


@admin.register(Appraisal)
class AppraisalAdmin(admin.ModelAdmin):
    list_display = ("student", "supervisor", "appraisal_date", "submitted_at")
    list_filter = ("appraisal_date", "submitted_at")
    search_fields = ("student__sch_email", "supervisor__fullname", "supervisor_name")


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("recipient", "actor", "activity_type", "is_read", "created_at")
    list_filter = ("activity_type", "is_read", "created_at")
    search_fields = ("recipient__username", "actor__username", "title", "message")
