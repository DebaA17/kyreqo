from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from apps.workspaces.models import Workspace
from .models import RequestHistory
from .serializers import RequestHistorySerializer

from rest_framework.pagination import PageNumberPagination

class HistoryPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 100

class IsWorkspaceMemberForHistory(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        workspace = obj.workspace
        is_owner = workspace.owner == request.user
        is_member = workspace.memberships.filter(user=request.user).exists()
        return is_owner or is_member

from apps.accounts.permissions import IsEmailVerified

class HistoryViewSet(viewsets.ModelViewSet):
    serializer_class = RequestHistorySerializer
    permission_classes = [permissions.IsAuthenticated, IsEmailVerified, IsWorkspaceMemberForHistory]
    pagination_class = HistoryPagination

    def get_queryset(self):
        user = self.request.user
        queryset = RequestHistory.objects.filter(
            models.Q(workspace__owner=user) |
            models.Q(workspace__memberships__user=user)
        ).distinct()

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['post'], url_path='clear')
    def clear_history(self, request):
        workspace_id = request.data.get('workspace')
        if not workspace_id:
            return Response(
                {"error": "The 'workspace' parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user
        workspace_exists = Workspace.objects.filter(
            models.Q(owner=user) |
            models.Q(memberships__user=user)
        ).distinct().filter(id=workspace_id).exists()

        if not workspace_exists:
            return Response(
                {"error": "Workspace not found or permission denied."},
                status=status.HTTP_403_FORBIDDEN
            )

        RequestHistory.objects.filter(workspace_id=workspace_id).delete()
        return Response({"message": "History cleared successfully."}, status=status.HTTP_200_OK)
