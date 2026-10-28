from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_customuser_has_completed_onboarding'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='two_factor_enabled',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='customuser',
            name='two_factor_secret',
            field=models.CharField(blank=True, default='', max_length=64),
        ),
    ]
