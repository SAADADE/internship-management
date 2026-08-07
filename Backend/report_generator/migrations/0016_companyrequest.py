from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0015_internship_supervisor_fk"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="CompanyRequest",
            fields=[
                ("request_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("note", models.TextField(blank=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("approved", "Approved"), ("rejected", "Rejected")], default="pending", max_length=20)),
                ("reviewed_at", models.DateTimeField(blank=True, null=True)),
                ("admin_note", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "requested_by",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="company_requests", to="report_generator.student"),
                ),
                (
                    "reviewed_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reviewed_company_requests", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
