from rest_framework import serializers
from .models import Environment
from apps.workspaces.models import WorkspaceMember

class EnvironmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Environment
        fields = ['id', 'workspace', 'name', 'variables', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_workspace(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            return value

        user = request.user
        is_owner = value.owner == user
        membership = value.memberships.filter(user=user).first()
        is_member = membership is not None

        if not (is_owner or is_member):
            raise serializers.ValidationError("You do not have permission to access this workspace.")

        if not is_owner and membership.role == 'viewer':
            raise serializers.ValidationError("Viewer members cannot create or modify environments.")

        return value

    def validate_variables(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Variables must be a list of key-value pairs.")
        
        for item in value:
            if not isinstance(item, dict):
                raise serializers.ValidationError("Each variable must be an object.")
            if 'key' not in item or 'value' not in item:
                raise serializers.ValidationError("Each variable must contain 'key' and 'value' fields.")
            
        return value
