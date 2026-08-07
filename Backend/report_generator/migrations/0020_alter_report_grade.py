from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("report_generator", "0019_remove_company_is_active"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="grade",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True),
        ),
    ]
