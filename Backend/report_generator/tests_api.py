from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Internship, Log, Student


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
                "internship_duration": "July 2026",
            },
            format="json",
        )

        self.assertEqual(response.status_code, 201)
        self.assertTrue(Internship.objects.filter(student=student, company_name="ACME Corp").exists())

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
