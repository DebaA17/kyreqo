from django.db import models
from apps.workspaces.models import Workspace

class Collection(models.Model):
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='collections'
    )
    parent_collection = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        related_name='child_collections',
        blank=True,
        null=True
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        unique_together = ('workspace', 'name')

    def __str__(self):
        return f"{self.name} ({self.workspace.name})"


class CollectionRequest(models.Model):
    METHOD_CHOICES = (
        ('GET', 'GET'),
        ('POST', 'POST'),
        ('PUT', 'PUT'),
        ('PATCH', 'PATCH'),
        ('DELETE', 'DELETE'),
        ('OPTIONS', 'OPTIONS'),
        ('HEAD', 'HEAD'),
        ('QUERY', 'QUERY'),
    )

    collection = models.ForeignKey(
        Collection,
        on_delete=models.CASCADE,
        related_name='requests'
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    url = models.TextField(blank=True, default='')
    method = models.CharField(
        max_length=10,
        choices=METHOD_CHOICES,
        default='GET'
    )
    headers = models.JSONField(default=dict, blank=True)
    body = models.TextField(blank=True, default='')
    query_params = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.method} {self.name} ({self.collection.name})"
