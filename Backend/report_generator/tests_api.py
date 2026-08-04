from datetime import date
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Internship, Log, Report, Review, Student, Supervisor


class BackendApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def create_student_user(self, username="student", email="student@example.com"):
        user = self.user_model.objects.create_user(
            username=username,
            email=email,
            password="StrongPass123!",
        )
        student = Student.objects.create(
            user=user,
            sch_email=email,
            index_number="20240001",
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
        student.supervisor = supervisor
        student.save(update_fields=["supervisor"])
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
        Log.objects.create(student=student, log_text="Approved work", status="reviewed", log_date="2026-07-30")

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
