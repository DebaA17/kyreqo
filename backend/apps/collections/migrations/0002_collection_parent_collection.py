

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('collections', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='collection',
            name='parent_collection',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='child_collections', to='collections.collection'),
        ),
    ]
