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
    child_collections = serializers.SerializerMethodField()

    class Meta:
        model = Collection
        fields = [
            'id', 'workspace', 'parent_collection', 'name', 'description',
            'requests', 'child_collections', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_child_collections(self, obj):
        # Recursively serialize child collections
        children = obj.child_collections.all()
        return CollectionSerializer(children, many=True, context=self.context).data

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

    def validate(self, attrs):
        parent = attrs.get('parent_collection')
        workspace = attrs.get('workspace')

        # Retrieve workspace from instance if not provided in PATCH request
        if not workspace and self.instance:
            workspace = self.instance.workspace

        if parent:
            # Check parent collection is in the same workspace
            if parent.workspace != workspace:
                raise serializers.ValidationError({
                    "parent_collection": "Parent collection must belong to the same workspace."
                })
            
            # Avoid self-referential cycles
            if self.instance and parent.id == self.instance.id:
                raise serializers.ValidationError({
                    "parent_collection": "A collection cannot be its own parent."
                })
        return attrs
