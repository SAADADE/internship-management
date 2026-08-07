from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0018_company_location"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="company",
            name="is_active",
        ),
    ]
