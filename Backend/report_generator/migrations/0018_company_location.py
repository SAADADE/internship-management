from django.db import migrations, models


def set_existing_company_locations(apps, schema_editor):
    Company = apps.get_model("report_generator", "Company")
    Company.objects.filter(location__isnull=True).update(location="Kumasi")
    Company.objects.filter(location="").update(location="Kumasi")


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0017_activitylog"),
    ]

    operations = [
        migrations.AddField(
            model_name="company",
            name="location",
            field=models.CharField(default="Kumasi", max_length=255),
        ),
        migrations.RunPython(set_existing_company_locations, migrations.RunPython.noop),
    ]
