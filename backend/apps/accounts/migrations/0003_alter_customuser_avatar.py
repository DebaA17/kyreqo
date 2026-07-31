

import apps.accounts.models
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_loginattempt'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customuser',
            name='avatar',
            field=models.URLField(blank=True, max_length=500, null=True, validators=[apps.accounts.models.validate_avatar_url]),
        ),
    ]
