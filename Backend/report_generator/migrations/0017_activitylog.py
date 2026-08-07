from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0016_companyrequest"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="ActivityLog",
            fields=[
                ("activity_id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("activity_type", models.CharField(max_length=80)),
                ("title", models.CharField(max_length=255)),
                ("message", models.TextField(blank=True)),
                ("metadata", models.JSONField(blank=True, default=dict)),
                ("is_read", models.BooleanField(default=False)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "actor",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="triggered_activities", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "recipient",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="activity_notifications", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
