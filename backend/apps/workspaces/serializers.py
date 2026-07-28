from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMember

User = get_user_model()

class UserMinimalSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'avatar')


class WorkspaceMemberSerializer(serializers.ModelSerializer):
    user = UserMinimalSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = WorkspaceMember
        fields = ('id', 'workspace', 'user', 'user_email', 'role', 'joined_at')
        read_only_fields = ('workspace', 'joined_at')


class AddMemberSerializer(serializers.Serializer):
    email = serializers.EmailField()
    role = serializers.ChoiceField(choices=WorkspaceMember.ROLE_CHOICES, default='editor')

    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
        except User.DoesNotExist:
            raise serializers.ValidationError("User with this email address does not exist.")
        return value


class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserMinimalSerializer(read_only=True)
    members_count = serializers.IntegerField(source='memberships.count', read_only=True)

    class Meta:
        model = Workspace
        fields = ('id', 'name', 'description', 'owner', 'members_count', 'created_at', 'updated_at')
        read_only_fields = ('owner', 'created_at', 'updated_at')
