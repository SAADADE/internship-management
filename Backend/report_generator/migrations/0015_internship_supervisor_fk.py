from django.db import migrations, models



def backfill_internship_supervisor(apps, schema_editor):
    Internship = apps.get_model("report_generator", "Internship")
    Supervisor = apps.get_model("report_generator", "Supervisor")

    internships = Internship.objects.exclude(internship_supervisor_email="")
    for internship in internships.iterator():
        email = (internship.internship_supervisor_email or "").strip()
        if not email:
            continue
        supervisor = Supervisor.objects.filter(email__iexact=email).first()
        if supervisor:
            internship.supervisor = supervisor
            internship.save(update_fields=["supervisor"])



def clear_internship_supervisor(apps, schema_editor):
    Internship = apps.get_model("report_generator", "Internship")
    Internship.objects.update(supervisor=None)


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0014_company"),
    ]

    operations = [
        migrations.AddField(
            model_name="internship",
            name="supervisor",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name="internships",
                to="report_generator.supervisor",
            ),
        ),
        migrations.RunPython(backfill_internship_supervisor, clear_internship_supervisor),
    ]
