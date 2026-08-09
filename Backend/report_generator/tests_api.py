from datetime import date
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Appraisal, Company, Internship, Log, Report, Review, Student, Supervisor


class BackendApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def create_student_user(self, username="student", email="student@example.com", index_number=None):
        user = self.user_model.objects.create_user(
            username=username,
            email=email,
            password="StrongPass123!",
        )
        student = Student.objects.create(
            user=user,
            sch_email=email,
            index_number=index_number or f"IDX-{username.upper()}",
            first_name="Ada",
            last_name="Lovelace",
            faculty="Engineering",
            department="Computer Science",
            programme="BSc Computer Science",
            level="300",
            institution_name="University of Example",
            phone_number="+233200000000",
        )
        return user, student

    def create_supervisor_user(self, username="supervisor", email="supervisor@example.com"):
        user = self.user_model.objects.create_user(
            username=username,
            email=email,
            password="StrongPass123!",
        )
        supervisor = Supervisor.objects.create(
            user=user,
            fullname="Dr. Supervisor",
            email=email,
        )
        return user, supervisor

    def create_admin_user(self, username="admin", email="admin@example.com"):
        return self.user_model.objects.create_user(
            username=username,
            email=email,
            password="StrongPass123!",
            is_staff=True,
            is_superuser=False,
        )

    def test_student_registration_creates_user_and_profile(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "first_name": "Ada",
                "last_name": "Lovelace",
                "email": "ada@example.com",
                "username": "ada",
                "password": "StrongPass123!",
                "role": "student",
                "index_number": "20240002",
                "faculty": "Engineering",
                "department": "Computer Science",
                "programme": "BSc Computer Science",
                "level": "300",
                "institution_name": "University of Example",
                "phone_number": "+233200000001",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(self.user_model.objects.filter(username="ada").exists())
        student = Student.objects.get(sch_email="ada@example.com")
        self.assertEqual(student.level, "300")
        self.assertEqual(response.data["profile"]["level"], "300")

    def test_registration_rejects_admin_role(self):
        response = self.client.post(
            "/api/auth/register/",
            {
                "first_name": "Mallory",
                "last_name": "Evil",
                "email": "mallory@example.com",
                "username": "mallory",
                "password": "StrongPass123!",
                "role": "admin",
                "index_number": "20249999",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertFalse(self.user_model.objects.filter(username="mallory").exists())

    def test_login_returns_user_payload_and_sets_session(self):
        user, _ = self.create_student_user()

        response = self.client.post(
            "/api/auth/login/",
            {"username": "student@example.com", "password": "StrongPass123!"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["role"], "student")
        self.assertEqual(response.data["user"]["email"], "student@example.com")
        self.assertTrue(response.wsgi_request.user.is_authenticated)

    def test_student_profile_patch_updates_fields(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        response = self.client.patch(
            "/api/student/profile/",
            {"first_name": "Grace", "department": "Software Engineering", "level": "400"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        student.refresh_from_db()
        self.assertEqual(student.first_name, "Grace")
        self.assertEqual(student.department, "Software Engineering")
        self.assertEqual(student.level, "400")

    def test_internship_registration_creates_internship_for_authenticated_student(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        response = self.client.post(
            "/api/student/internships/",
            {
                "company_name": "ACME Corp",
                "company_address": "Accra",
                "internship_position": "Software Engineering",
                "internship_supervisor": "Mr. Mensah",
                "internship_supervisor_email": "mensah@example.com",
                "internship_duration": "2026-07-01 to 2026-09-30",
                "department": "IT Department",
                "description": "Summer placement",
                "start_date": "2026-07-01",
                "end_date": "2026-09-30",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Internship.objects.filter(student=student, company_name="ACME Corp").exists())
        saved_internship = Internship.objects.get(student=student, company_name="ACME Corp")
        self.assertEqual(saved_internship.department, "IT Department")
        self.assertEqual(saved_internship.description, "Summer placement")
        self.assertEqual(saved_internship.start_date, date(2026, 7, 1))
        self.assertEqual(saved_internship.end_date, date(2026, 9, 30))

    def test_student_log_creation(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        response = self.client.post(
            "/api/student/logs/",
            {"date": "2026-07-30", "content": "Implemented new API endpoints.", "title": "Week 1"},
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Log.objects.filter(student=student).exists())

    def test_student_dashboard_summary_returns_database_metrics(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        Internship.objects.create(
            student=student,
            company_name="ACME Corp",
            internship_position="Software Engineering",
            status="active",
        )
        Log.objects.create(student=student, log_text="Week 1 update", status="submitted", week_number=1, log_date="2026-07-30")
        Log.objects.create(student=student, log_text="Week 2 update", status="reviewed", week_number=2, log_date="2026-08-06")
        Log.objects.create(student=student, log_text="Week 3 update", status="needs_revision", week_number=3, log_date="2026-08-13")
        Report.objects.create(student=student, status="ready")
        Review.objects.create(log=Log.objects.get(week_number=2), decision="approved", comment="Good work")

        response = self.client.get("/api/student/dashboard/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["stats"]["internship_status"], "Active")
        self.assertEqual(response.data["stats"]["reports_submitted"], 1)
        self.assertEqual(response.data["stats"]["pending_reviews"], 2)
        self.assertEqual(response.data["stats"]["feedback_received"], 1)
        self.assertGreaterEqual(len(response.data["activity"]), 1)
        self.assertGreaterEqual(len(response.data["deadlines"]), 1)

    def test_weekly_log_submission_persists_frontend_payload(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        response = self.client.post(
            "/api/student/logs/",
            {
                "studentName": "Ada Lovelace",
                "studentId": "20240001",
                "department": "Computer Science",
                "programme": "BSc Computer Science",
                "level": "300",
                "institution": "University of Example",
                "companyName": "ACME Corp",
                "departmentUnit": "IT Department",
                "supervisorName": "Mr. Mensah",
                "weekNumber": "3",
                "startDate": "2026-08-01",
                "endDate": "2026-08-07",
                "achievements": "Completed the API integration tasks.",
                "mondayTasks": "Built the integration endpoints.",
                "mondaySkills": "Learned Django REST framework.",
                "mondayChallenges": "Had to debug auth wiring.",
                "mondaySolutions": "Reviewed the request flow.",
                "tuesdayTasks": "Drafted test coverage.",
                "tuesdaySkills": "Improved test writing.",
                "tuesdayChallenges": "",
                "tuesdaySolutions": "",
                "wednesdayTasks": "Updated deployment notes.",
                "wednesdaySkills": "Learned CI basics.",
                "wednesdayChallenges": "",
                "wednesdaySolutions": "",
                "thursdayTasks": "Reviewed the report flow.",
                "thursdaySkills": "Understood docx generation.",
                "thursdayChallenges": "",
                "thursdaySolutions": "",
                "fridayTasks": "Polished the dashboard hooks.",
                "fridaySkills": "Learned frontend API integration.",
                "fridayChallenges": "",
                "fridaySolutions": "",
                "confirmation": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        saved_log = Log.objects.get(student=student)
        self.assertEqual(saved_log.week_number, 3)
        self.assertEqual(saved_log.achievements, "Completed the API integration tasks.")
        self.assertEqual(saved_log.start_date, date(2026, 8, 1))
        self.assertEqual(saved_log.end_date, date(2026, 8, 7))
        self.assertEqual(len(saved_log.daily_entries), 5)
        self.assertEqual(saved_log.daily_entries[0]["tasks"], "Built the integration endpoints.")

    def test_student_reports_endpoint_returns_logs_and_reports(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        Log.objects.create(
            student=student,
            log_text="Week 1 update",
            status="submitted",
            week_number=1,
            log_date="2026-07-30",
            company_name="ACME Corp",
        )
        Report.objects.create(student=student, status="graded", grade=4.0, supervisor_feedback="Excellent work")
        Report.objects.create(student=student, status="ready", grade=None, supervisor_feedback="")

        response = self.client.get("/api/student/reports/")

        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(len(response.data), 3)
        self.assertTrue(any(item["source"] == "log" and item["company_name"] == "ACME Corp" for item in response.data))
        self.assertTrue(any(item["source"] == "report" for item in response.data))

    def test_student_feedback_endpoint_returns_only_feedback_from_connected_supervisor(self):
        user, student = self.create_student_user()
        supervisor = Supervisor.objects.create(fullname="Dr. Theresa", email="theresa@example.com")
        student.supervisors.add(supervisor)
        self.client.force_authenticate(user)

        log = Log.objects.create(student=student, log_text="Week 1 update", status="submitted", week_number=1, log_date="2026-07-30")
        Review.objects.create(log=log, supervisor=supervisor, decision="approved", comment="Great work")

        other_supervisor = Supervisor.objects.create(fullname="Dr. Ama", email="ama@example.com")
        other_log = Log.objects.create(student=student, log_text="Week 2 update", status="submitted", week_number=2, log_date="2026-08-06")
        Review.objects.create(log=other_log, supervisor=other_supervisor, decision="rejected", comment="Needs more detail")

        response = self.client.get("/api/student/feedbacks/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["supervisor"], "Dr. Theresa")
        self.assertEqual(response.data[0]["feedback"], "Great work")

    def test_internship_registration_links_student_to_existing_supervisor_by_email(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)
        supervisor = Supervisor.objects.create(fullname="Mr. Mensah", email="mensah@example.com")

        response = self.client.post(
            "/api/student/internships/",
            {
                "company_name": "ACME Corp",
                "company_address": "Accra",
                "internship_position": "Software Engineering",
                "internship_supervisor": "Mr. Mensah",
                "internship_supervisor_email": "mensah@example.com",
                "internship_duration": "2026-07-01 to 2026-09-30",
                "department": "IT Department",
                "description": "Summer placement",
                "start_date": "2026-07-01",
                "end_date": "2026-09-30",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(student.supervisors.filter(pk=supervisor.pk).exists())

    def test_supervisor_registration_links_matching_students_from_existing_internships(self):
        student_user = self.user_model.objects.create_user(username="student-link", password="StrongPass123!")
        student = Student.objects.create(
            user=student_user,
            sch_email="student-link@example.com",
            index_number="20240003",
            first_name="Kwame",
            last_name="Nkrumah",
        )
        Internship.objects.create(
            student=student,
            company_name="ACME Corp",
            internship_position="Software Engineering",
            internship_supervisor="Mr. Mensah",
            internship_supervisor_email="mensah@example.com",
        )

        response = self.client.post(
            "/api/auth/register/",
            {
                "first_name": "Kofi",
                "last_name": "Mensah",
                "email": "mensah@example.com",
                "username": "mensah",
                "password": "StrongPass123!",
                "role": "supervisor",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        supervisor = Supervisor.objects.get(email="mensah@example.com")
        self.assertTrue(student.supervisors.filter(pk=supervisor.pk).exists())

    def test_weekly_log_submission_links_selected_internship_and_saves_snapshot_fields(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)
        internship = Internship.objects.create(
            student=student,
            company_name="ACME Corp",
            internship_position="Software Engineering",
            internship_supervisor="Mr. Mensah",
            status="active",
        )

        response = self.client.post(
            "/api/student/logs/",
            {
                "studentName": "Ada Lovelace",
                "studentId": "20240001",
                "department": "Computer Science",
                "programme": "BSc Computer Science",
                "level": "300",
                "institution": "University of Example",
                "companyName": "ACME Corp",
                "departmentUnit": "IT Department",
                "supervisorName": "Mr. Mensah",
                "weekNumber": "3",
                "startDate": "2026-08-01",
                "endDate": "2026-08-07",
                "achievements": "Completed the API integration tasks.",
                "mondayTasks": "Built the integration endpoints.",
                "mondaySkills": "Learned Django REST framework.",
                "mondayChallenges": "",
                "mondaySolutions": "",
                "tuesdayTasks": "",
                "tuesdaySkills": "",
                "tuesdayChallenges": "",
                "tuesdaySolutions": "",
                "wednesdayTasks": "",
                "wednesdaySkills": "",
                "wednesdayChallenges": "",
                "wednesdaySolutions": "",
                "thursdayTasks": "",
                "thursdaySkills": "",
                "thursdayChallenges": "",
                "thursdaySolutions": "",
                "fridayTasks": "",
                "fridaySkills": "",
                "fridayChallenges": "",
                "fridaySolutions": "",
                "confirmation": True,
                "internshipId": str(internship.internship_id),
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        saved_log = Log.objects.get(student=student)
        self.assertEqual(saved_log.internship, internship)
        self.assertEqual(saved_log.student_name, "Ada Lovelace")
        self.assertEqual(saved_log.student_index_number, "20240001")
        self.assertEqual(saved_log.company_name, "ACME Corp")
        self.assertEqual(saved_log.supervisor_name, "Mr. Mensah")

    def test_report_draft_and_generate_report_work(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)
        Log.objects.create(
            student=student,
            log_text="Approved work",
            status="reviewed",
            log_date="2026-07-30",
            week_number=2,
            company_name="ACME Corp",
            department_unit="Engineering",
            supervisor_name="Mr. Mensah",
            achievements="Completed assigned tasks",
            daily_entries=[
                {"day": "Monday", "tasks": "Configured systems", "skills": "System setup", "challenges": "None", "solutions": "N/A"}
            ],
        )

        draft_response = self.client.post(
            "/api/student/report-draft/",
            {
                "introduction": "Introduction text",
                "abstract": "Abstract text",
                "conclusion": "Conclusion text",
                "department": "Software Engineering",
                "company_name": "ACME Corp",
                "supervisor_name": "Mr. Mensah",
                "additional_notes": "All good",
            },
            format="json",
        )
        self.assertEqual(draft_response.status_code, 201)

        with patch("report_generator.views.generate_report_structure", return_value={"title": "Demo report"}) as mock_generate, patch(
            "report_generator.views.build_docx", return_value=b"docx-bytes"
        ) as mock_build:
            response = self.client.post("/api/student/generate-report/", {}, format="json")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        mock_generate.assert_called_once()
        mock_build.assert_called_once()
        generate_kwargs = mock_generate.call_args.kwargs
        self.assertEqual(generate_kwargs["draft_sections"]["introduction"], "Introduction text")
        self.assertEqual(generate_kwargs["draft_sections"]["abstract"], "Abstract text")
        self.assertEqual(generate_kwargs["draft_sections"]["conclusion"], "Conclusion text")
        self.assertEqual(len(generate_kwargs["student_logs"]), 1)
        self.assertEqual(generate_kwargs["student_logs"][0]["company_name"], "ACME Corp")
        self.assertEqual(generate_kwargs["student_logs"][0]["daily_entries"][0]["day"], "Monday")

    def test_student_companies_endpoint_returns_companies(self):
        user, _ = self.create_student_user()
        self.client.force_authenticate(user)
        alpha_company = Company.objects.create(name="Alpha Logistics Ltd", location="Kumasi")
        Company.objects.create(name="Archived Co", location="Accra")

        response = self.client.get("/api/student/companies/")

        self.assertEqual(response.status_code, 200)
        returned_names = [item["name"] for item in response.data]
        self.assertIn(alpha_company.name, returned_names)
        self.assertIn("Archived Co", returned_names)

    def test_non_admin_cannot_manage_companies(self):
        student_user, _ = self.create_student_user()
        self.client.force_authenticate(student_user)

        create_response = self.client.post("/api/admin/companies/", {"name": "Denied Co"}, format="json")
        self.assertEqual(create_response.status_code, 403)

    def test_admin_can_create_update_and_delete_company(self):
        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)

        create_response = self.client.post(
            "/api/admin/companies/",
            {"name": "NextWave Manufacturing", "location": "Kumasi"},
            format="json",
        )
        self.assertEqual(create_response.status_code, 201)
        company_id = create_response.data["id"]

        update_response = self.client.patch(
            f"/api/admin/companies/{company_id}/",
            {"location": "Accra"},
            format="json",
        )
        self.assertEqual(update_response.status_code, 200)
        self.assertEqual(update_response.data["location"], "Accra")

        delete_response = self.client.delete(f"/api/admin/companies/{company_id}/")
        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Company.objects.filter(company_id=company_id).exists())

    def test_admin_company_name_is_case_insensitive_unique(self):
        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)
        Company.objects.create(name="Acme Resources", created_by=admin_user)

        response = self.client.post(
            "/api/admin/companies/",
            {"name": "acme resources", "location": "Kumasi"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("name", response.data)

    def test_admin_dashboard_endpoint_requires_staff_and_returns_stats(self):
        student_user, student = self.create_student_user()
        Internship.objects.create(student=student, company_name="ACME", internship_position="Intern", status="active")
        Report.objects.create(student=student, status="ready")

        self.client.force_authenticate(student_user)
        denied = self.client.get("/api/admin/dashboard/")
        self.assertEqual(denied.status_code, 403)

        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)
        response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["stats"]["total_students"], 1)
        self.assertEqual(response.data["stats"]["total_reports"], 1)
        self.assertEqual(response.data["stats"]["active_internships"], 1)

    def test_admin_students_and_detail_endpoints(self):
        user, student = self.create_student_user()
        supervisor = Supervisor.objects.create(fullname="Dr. AdminTest", email="admintest@example.com")
        student.supervisors.add(supervisor)
        Internship.objects.create(
            student=student,
            company_name="Cloud Services Ltd",
            internship_position="Software Intern",
            status="active",
            start_date="2026-07-01",
            end_date="2026-09-30",
        )
        report = Report.objects.create(student=student, status="graded", grade=4.0, report_file="reports/student_test/sample_report.docx")
        Log.objects.create(student=student, log_text="Completed integration tasks", achievements="Completed integration tasks")

        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)

        list_response = self.client.get("/api/admin/students/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)

        student_id = list_response.data[0]["id"]
        detail_response = self.client.get(f"/api/admin/students/{student_id}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["company"], "Cloud Services Ltd")
        self.assertIn("Completed integration tasks", detail_response.data["achievements"][0])
        self.assertTrue(detail_response.data["reportFileSubmitted"])
        self.assertIn(str(report.report_id), detail_response.data["reportDownloadUrl"])

    def test_admin_reports_and_detail_endpoints(self):
        user, student = self.create_student_user()
        report = Report.objects.create(student=student, status="ready", supervisor_feedback="Initial feedback")
        supervisor_user, supervisor = self.create_supervisor_user()
        appraisal = Appraisal.objects.create(
            student=student,
            supervisor=supervisor,
            scores={
                "punctuality": "4",
                "attitude": "4",
                "superiors": "4",
                "colleagues": "4",
                "cooperation": "4",
                "safety": "4",
                "resourcefulness": "4",
                "initiative": "4",
                "leadership": "4",
            },
        )

        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)

        index_response = self.client.get("/api/admin/reports/")
        self.assertEqual(index_response.status_code, 200)
        self.assertEqual(len(index_response.data["finalReports"]), 1)
        self.assertEqual(len(index_response.data["appraisalForms"]), 1)

        detail_response = self.client.get(f"/api/admin/reports/{report.report_id}/")
        self.assertEqual(detail_response.status_code, 200)
        self.assertEqual(detail_response.data["status"], "ready")

        patch_response = self.client.patch(
            f"/api/admin/reports/{report.report_id}/",
            {"decision": "Approved", "comment": "Excellent", "grade": "4.00"},
            format="json",
        )
        self.assertEqual(patch_response.status_code, 200)
        self.assertEqual(patch_response.data["status"], "graded")

        appraisal_response = self.client.get(f"/api/admin/appraisals/{appraisal.appraisal_id}/")
        self.assertEqual(appraisal_response.status_code, 200)
        self.assertEqual(appraisal_response.data["studentId"], student.index_number)

    def test_student_can_upload_report_file_and_admin_can_download(self):
        user, student = self.create_student_user()
        self.client.force_authenticate(user)

        uploaded_file = SimpleUploadedFile(
            "internship_report.docx",
            b"fake-docx-content",
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

        upload_response = self.client.post(
            "/api/student/reports/upload/",
            {"file": uploaded_file},
            format="multipart",
        )

        self.assertEqual(upload_response.status_code, 201)
        report_id = upload_response.data["id"]

        admin_user = self.create_admin_user()
        self.client.force_authenticate(admin_user)

        dashboard_response = self.client.get("/api/admin/dashboard/")
        self.assertEqual(dashboard_response.status_code, 200)
        self.assertTrue(any("uploaded a final report file" in item["detail"] for item in dashboard_response.data["activity"]))

        student_detail_response = self.client.get(f"/api/admin/students/{student.student_id}/")
        self.assertEqual(student_detail_response.status_code, 200)
        self.assertTrue(student_detail_response.data["reportFileSubmitted"])
        self.assertIn(report_id, student_detail_response.data["reportDownloadUrl"])

        download_response = self.client.get(f"/api/admin/reports/{report_id}/download/")
        self.assertEqual(download_response.status_code, 200)
        self.assertIn("attachment;", download_response["Content-Disposition"])

    def test_student_report_upload_rejects_invalid_extension(self):
        user, _ = self.create_student_user()
        self.client.force_authenticate(user)

        uploaded_file = SimpleUploadedFile(
            "not_allowed.txt",
            b"plain-text-content",
            content_type="text/plain",
        )

        response = self.client.post(
            "/api/student/reports/upload/",
            {"file": uploaded_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported file type", response.data["detail"])

    def test_supervisor_appraisal_endpoints_only_expose_assigned_students_and_allow_crud(self):
        supervisor_user, supervisor = self.create_supervisor_user()
        _, assigned_student = self.create_student_user(username="assigned-student", email="assigned@example.com")
        _, other_student = self.create_student_user(username="other-student", email="other@example.com")
        Internship.objects.create(
            student=assigned_student,
            company_name="Assigned Corp",
            internship_position="Software Engineering Intern",
            internship_supervisor="Dr. Supervisor",
            internship_supervisor_email=supervisor.email,
            supervisor=supervisor,
        )

        self.client.force_authenticate(supervisor_user)

        students_response = self.client.get("/api/supervisor/appraisal-students/")

        self.assertEqual(students_response.status_code, 200)
        self.assertEqual(len(students_response.data), 1)
        self.assertEqual(students_response.data[0]["index"], assigned_student.index_number)
        self.assertEqual(students_response.data[0]["status"], "Pending Appraisal")

        create_response = self.client.post(
            "/api/supervisor/appraisals/",
            {
                "student_id": str(assigned_student.student_id),
                "scores": {
                    "punctuality": "5",
                    "attitude": "4",
                    "superiors": "4",
                    "colleagues": "5",
                    "cooperation": "4",
                    "safety": "5",
                    "resourcefulness": "4",
                    "initiative": "4",
                    "leadership": "3",
                },
                "generalComments": "Consistently delivers quality work.",
                "supervisorName": "Dr. Supervisor",
                "position": "Industry Supervisor",
                "signature": "signed-data",
                "date": "2026-08-06",
            },
            format="json",
        )

        self.assertEqual(create_response.status_code, 201)
        appraisal = Appraisal.objects.get(student=assigned_student)
        self.assertEqual(appraisal.supervisor, supervisor)
        self.assertEqual(appraisal.general_comments, "Consistently delivers quality work.")

        duplicate_response = self.client.post(
            "/api/supervisor/appraisals/",
            {
                "student_id": str(assigned_student.student_id),
                "scores": {
                    "punctuality": "5",
                    "attitude": "4",
                    "superiors": "4",
                    "colleagues": "5",
                    "cooperation": "4",
                    "safety": "5",
                    "resourcefulness": "4",
                    "initiative": "4",
                    "leadership": "3",
                },
            },
            format="json",
        )

        self.assertEqual(duplicate_response.status_code, 400)
        self.assertEqual(Appraisal.objects.filter(student=assigned_student).count(), 1)

        unassigned_response = self.client.post(
            "/api/supervisor/appraisals/",
            {
                "student_id": str(other_student.student_id),
                "scores": {
                    "punctuality": "5",
                    "attitude": "4",
                    "superiors": "4",
                    "colleagues": "5",
                    "cooperation": "4",
                    "safety": "5",
                    "resourcefulness": "4",
                    "initiative": "4",
                    "leadership": "3",
                },
            },
            format="json",
        )

        self.assertEqual(unassigned_response.status_code, 400)

        list_response = self.client.get("/api/supervisor/appraisals/")

        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.data), 1)
        self.assertEqual(list_response.data[0]["studentId"], assigned_student.index_number)

        patch_response = self.client.patch(
            f"/api/supervisor/appraisals/{appraisal.appraisal_id}/",
            {
                "generalComments": "Updated assessment.",
                "position": "Lead Supervisor",
            },
            format="json",
        )

        self.assertEqual(patch_response.status_code, 200)
        appraisal.refresh_from_db()
        self.assertEqual(appraisal.general_comments, "Updated assessment.")
        self.assertEqual(appraisal.position, "Lead Supervisor")

        delete_response = self.client.delete(f"/api/supervisor/appraisals/{appraisal.appraisal_id}/")

        self.assertEqual(delete_response.status_code, 204)
        self.assertFalse(Appraisal.objects.filter(student=assigned_student).exists())

    def test_supervisor_reports_only_include_logs_for_supervisor_internships(self):
        supervisor_user, supervisor = self.create_supervisor_user(username="supervisor-scope", email="scope@example.com")
        _, student = self.create_student_user(username="student-scope", email="student-scope@example.com")
        _, other_supervisor = self.create_supervisor_user(username="other-scope", email="other-scope@example.com")

        internship_owned = Internship.objects.create(
            student=student,
            company_name="Owned Corp",
            internship_position="Intern",
            internship_supervisor_email=supervisor.email,
            supervisor=supervisor,
        )
        internship_other = Internship.objects.create(
            student=student,
            company_name="Other Corp",
            internship_position="Intern",
            internship_supervisor_email=other_supervisor.email,
            supervisor=other_supervisor,
        )

        owned_log = Log.objects.create(
            student=student,
            internship=internship_owned,
            log_text="Owned internship log",
            status="submitted",
            week_number=1,
            log_date="2026-08-01",
            company_name="Owned Corp",
        )
        Log.objects.create(
            student=student,
            internship=internship_other,
            log_text="Other internship log",
            status="submitted",
            week_number=2,
            log_date="2026-08-08",
            company_name="Other Corp",
        )

        self.client.force_authenticate(supervisor_user)
        response = self.client.get("/api/supervisor/reports/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(str(response.data[0]["id"]), str(owned_log.log_id))
        self.assertEqual(response.data[0]["company"], "Owned Corp")
