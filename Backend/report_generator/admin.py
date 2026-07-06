from django.contrib import admin

from .models import Internship, InternshipReportDraft, Log, Report, Review, Student, Supervisor


@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ("sch_email", "index_number", "first_name", "last_name", "supervisor", "created_at")
    search_fields = ("sch_email", "index_number", "first_name", "last_name")


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
