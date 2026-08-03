from rest_framework import viewsets, permissions
from django.db import models
from .models import Environment
from .serializers import EnvironmentSerializer
from .permissions import IsWorkspaceMemberForEnvironment
from apps.accounts.permissions import IsEmailVerified

class EnvironmentViewSet(viewsets.ModelViewSet):
    serializer_class = EnvironmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsEmailVerified, IsWorkspaceMemberForEnvironment]

    def get_queryset(self):
        user = self.request.user
        queryset = Environment.objects.filter(
            models.Q(workspace__owner=user) | models.Q(workspace__memberships__user=user)
        ).distinct()

        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset
