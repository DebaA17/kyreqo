from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer, AddMemberSerializer

User = get_user_model()


class IsWorkspaceOwner(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user


from apps.accounts.permissions import IsEmailVerified


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmailVerified]

    def get_queryset(self):
        user = self.request.user
        return Workspace.objects.filter(
            models.Q(owner=user) | models.Q(memberships__user=user)
        ).distinct()

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsEmailVerified(), IsWorkspaceOwner()]
        return [permissions.IsAuthenticated(), IsEmailVerified()]

    
    @action(detail=True, methods=['get', 'post'], url_path='members')
    def members(self, request, pk=None):
        workspace = self.get_object()
        is_owner = workspace.owner == request.user
        is_member = workspace.memberships.filter(user=request.user).exists()

        if not (is_owner or is_member):
            return Response(
                {"detail": "You do not have permission to access this workspace."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'GET':
            memberships = workspace.memberships.all()
            serializer = WorkspaceMemberSerializer(memberships, many=True)
            return Response(serializer.data)

        if request.method == 'POST':
            is_admin = workspace.memberships.filter(user=request.user, role='admin').exists()
            if not (is_owner or is_admin):
                return Response(
                    {"detail": "Only workspace owners or admins can add members."},
                    status=status.HTTP_403_FORBIDDEN
                )

            serializer = AddMemberSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            email = serializer.validated_data['email']
            role = serializer.validated_data['role']
            user_to_add = User.objects.get(email=email)

            if user_to_add == workspace.owner:
                return Response(
                    {"detail": "The owner is already a permanent member of the workspace."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            membership, created = WorkspaceMember.objects.get_or_create(
                workspace=workspace,
                user=user_to_add,
                defaults={'role': role}
            )

            if not created:
                return Response(
                    {"detail": "User is already a member of this workspace."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response(WorkspaceMemberSerializer(membership).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch', 'delete'], url_path=r'members/(?P<member_id>\d+)')
    def member_detail(self, request, pk=None, member_id=None):
        workspace = self.get_object()
        membership = get_object_or_404(WorkspaceMember, workspace=workspace, id=member_id)

        is_owner = workspace.owner == request.user
        is_admin = workspace.memberships.filter(user=request.user, role='admin').exists()

        if not (is_owner or is_admin):
            return Response(
                {"detail": "Only workspace owners or admins can modify memberships."},
                status=status.HTTP_403_FORBIDDEN
            )

        if request.method == 'DELETE':
            membership.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)

        if request.method == 'PATCH':
            role = request.data.get('role')
            if role not in dict(WorkspaceMember.ROLE_CHOICES):
                return Response(
                    {"detail": "Invalid role specified."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            membership.role = role
            membership.save()
            return Response(WorkspaceMemberSerializer(membership).data)
