

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collections', '0002_collection_parent_collection'),
    ]

    operations = [
        migrations.AlterField(
            model_name='collectionrequest',
            name='method',
            field=models.CharField(choices=[('GET', 'GET'), ('POST', 'POST'), ('PUT', 'PUT'), ('PATCH', 'PATCH'), ('DELETE', 'DELETE'), ('OPTIONS', 'OPTIONS'), ('HEAD', 'HEAD'), ('QUERY', 'QUERY')], default='GET', max_length=10),
        ),
    ]
