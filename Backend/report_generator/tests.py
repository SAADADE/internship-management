from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Internship, Log, Student, Supervisor


class InternshipWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_model = get_user_model()

    def test_student_can_create_profile_and_logs(self):
        student_user = self.user_model.objects.create_user(username="student1", password="secret123")
        self.client.force_authenticate(student_user)

        profile_response = self.client.post(
            "/api/student/profile/",
            {
                "sch_email": "student@example.com",
                "index_number": "IDX-001",
                "first_name": "Ada",
                "last_name": "Lovelace",
            },
            format="json",
        )

        self.assertEqual(profile_response.status_code, 201)
        self.assertTrue(Student.objects.filter(user=student_user).exists())

        log_response = self.client.post(
            "/api/student/logs/",
            {
                "date": "2026-06-20",
                "title": "First day",
                "content": "Implemented a feature.",
            },
            format="json",
        )

        self.assertEqual(log_response.status_code, 201)
        self.assertEqual(Log.objects.count(), 1)

        list_response = self.client.get("/api/student/logs/")
        self.assertEqual(list_response.status_code, 200)
        self.assertEqual(len(list_response.json()), 1)

    def test_supervisor_can_view_assigned_students_and_update_log_status(self):
        student_user = self.user_model.objects.create_user(username="student2", password="secret123")
        supervisor_user = self.user_model.objects.create_user(username="supervisor1", password="secret123")

        student = Student.objects.create(
            user=student_user,
            sch_email="student2@example.com",
            index_number="IDX-002",
            first_name="Grace",
            last_name="Hopper",
        )
        supervisor = Supervisor.objects.create(user=supervisor_user, fullname="Dr. Adams", email="supervisor@example.com")
        internship = Internship.objects.create(
            student=student,
            company_name="ACME Corp",
            internship_position="Software Engineering Intern",
            supervisor=supervisor,
        )

        log = Log.objects.create(student=student, internship=internship, log_text="Reviewed code.", log_date="2026-06-21")

        self.client.force_authenticate(supervisor_user)
        students_response = self.client.get("/api/supervisor/students/")
        self.assertEqual(students_response.status_code, 200)
        self.assertEqual(len(students_response.json()), 1)

        update_response = self.client.patch(
            f"/api/supervisor/logs/{log.log_id}/",
            {"decision": "approved", "comment": "Good work."},
            format="json",
        )

        self.assertEqual(update_response.status_code, 200)
        log.refresh_from_db()
        self.assertEqual(log.status, "reviewed")

    def test_supervisor_cannot_access_logs_from_other_internships_for_same_student(self):
        student_user = self.user_model.objects.create_user(username="student3", password="secret123")
        supervisor_a_user = self.user_model.objects.create_user(username="supervisor-a", password="secret123")
        supervisor_b_user = self.user_model.objects.create_user(username="supervisor-b", password="secret123")

        student = Student.objects.create(
            user=student_user,
            sch_email="student3@example.com",
            index_number="IDX-003",
            first_name="Kofi",
            last_name="Mensah",
        )
        supervisor_a = Supervisor.objects.create(user=supervisor_a_user, fullname="Supervisor A", email="a@example.com")
        supervisor_b = Supervisor.objects.create(user=supervisor_b_user, fullname="Supervisor B", email="b@example.com")

        internship_a = Internship.objects.create(
            student=student,
            company_name="Company A",
            internship_position="Intern",
            supervisor=supervisor_a,
        )
        internship_b = Internship.objects.create(
            student=student,
            company_name="Company B",
            internship_position="Intern",
            supervisor=supervisor_b,
        )

        log_a = Log.objects.create(student=student, internship=internship_a, log_text="Work at company A", log_date="2026-06-22")
        log_b = Log.objects.create(student=student, internship=internship_b, log_text="Work at company B", log_date="2026-06-23")

        self.client.force_authenticate(supervisor_a_user)

        logs_response = self.client.get("/api/supervisor/logs/")
        self.assertEqual(logs_response.status_code, 200)
        self.assertEqual(len(logs_response.json()), 1)
        self.assertEqual(str(logs_response.json()[0]["id"]), str(log_a.log_id))

        denied_response = self.client.get(f"/api/supervisor/logs/{log_b.log_id}/")
        self.assertEqual(denied_response.status_code, 404)
