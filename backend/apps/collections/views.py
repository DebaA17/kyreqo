from rest_framework import viewsets, permissions
from django.db import models
from .models import Collection
from .serializers import CollectionSerializer
from .permissions import IsWorkspaceMemberForCollection

class CollectionViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionSerializer
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMemberForCollection]

    def get_queryset(self):
        user = self.request.user
        queryset = Collection.objects.filter(
            models.Q(workspace__owner=user) | models.Q(workspace__memberships__user=user)
        ).distinct()
        
        
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)
            
        
        if 'parent_collection' in self.request.query_params:
            parent_collection = self.request.query_params.get('parent_collection')
            if parent_collection in ('null', 'None', ''):
                queryset = queryset.filter(parent_collection__isnull=True)
            else:
                queryset = queryset.filter(parent_collection_id=parent_collection)

        return queryset
