from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0010_remove_student_teams_id_student_supervisor_email"),
    ]

    operations = [
        migrations.AddField(
            model_name="review",
            name="score",
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
    ]
