from rest_framework import serializers
from .models import Collection, CollectionRequest
from apps.workspaces.models import WorkspaceMember

class CollectionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = CollectionRequest
        fields = [
            'id', 'collection', 'name', 'description', 'url',
            'method', 'headers', 'body', 'query_params',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_collection(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            return value

        user = request.user
        workspace = value.workspace
        is_owner = workspace.owner == user
        
        # Get user role in the workspace
        membership = workspace.memberships.filter(user=user).first()
        is_member = membership is not None

        if not (is_owner or is_member):
            raise serializers.ValidationError("You do not have permission to access this collection's workspace.")

        # Ensure role permits modifications
        if not is_owner and membership.role == 'viewer':
            raise serializers.ValidationError("Viewer members cannot create or modify requests.")

        return value


class CollectionSerializer(serializers.ModelSerializer):
    requests = CollectionRequestSerializer(many=True, read_only=True)

    class Meta:
        model = Collection
        fields = [
            'id', 'workspace', 'name', 'description', 'requests',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_workspace(self, value):
        request = self.context.get('request')
        if not request or not request.user:
            return value

        user = request.user
        is_owner = value.owner == user
        
        # Get user role in the workspace
        membership = value.memberships.filter(user=user).first()
        is_member = membership is not None

        if not (is_owner or is_member):
            raise serializers.ValidationError("You do not have permission to access this workspace.")

        # Ensure role permits modifications
        if not is_owner and membership.role == 'viewer':
            raise serializers.ValidationError("Viewer members cannot create or modify collections.")

        return value
