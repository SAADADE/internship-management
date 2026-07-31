from django.urls import path

from .views import (
    AuthLoginView,
    AuthRegisterView,
    ChangePasswordView,
    GenerateReportView,
    HealthCheckView,
    StudentGenerateReportView,
    StudentInternshipView,
    StudentLogDetailView,
    StudentLogView,
    StudentProfileView,
    StudentReportDraftView,
    SupervisorBulkStatusView,
    SupervisorLogDetailView,
    SupervisorLogsView,
    SupervisorStudentsView,
)

urlpatterns = [
    path("health/", HealthCheckView.as_view(), name="health-check"),
    path("generate-report/", GenerateReportView.as_view(), name="generate-report"),
    path("auth/register/", AuthRegisterView.as_view(), name="auth-register"),
    path("auth/login/", AuthLoginView.as_view(), name="auth-login"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="auth-change-password"),
    path("student/profile/", StudentProfileView.as_view(), name="student-profile"),
    path("student/internships/", StudentInternshipView.as_view(), name="student-internships"),
    path("student/logs/", StudentLogView.as_view(), name="student-logs"),
    path("student/logs/<uuid:log_id>/", StudentLogDetailView.as_view(), name="student-log-detail"),
    path("student/report-draft/", StudentReportDraftView.as_view(), name="student-report-draft"),
    path("student/generate-report/", StudentGenerateReportView.as_view(), name="student-generate-report"),
    path("supervisor/students/", SupervisorStudentsView.as_view(), name="supervisor-students"),
    path("supervisor/logs/", SupervisorLogsView.as_view(), name="supervisor-logs"),
    path("supervisor/logs/<uuid:log_id>/", SupervisorLogDetailView.as_view(), name="supervisor-log-detail"),
    path("supervisor/logs/bulk-status/", SupervisorBulkStatusView.as_view(), name="supervisor-bulk-status"),
]
