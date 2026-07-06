from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from .models import Log, Student, Supervisor


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
        student.supervisor = supervisor
        student.save(update_fields=["supervisor"])

        log = Log.objects.create(student=student, log_text="Reviewed code.", log_date="2026-06-21")

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
