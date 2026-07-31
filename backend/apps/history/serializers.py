from rest_framework import serializers
from .models import RequestHistory

class RequestHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RequestHistory
        fields = [
            'id',
            'workspace',
            'user',
            'url',
            'method',
            'headers',
            'body',
            'response_status',
            'response_time',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
