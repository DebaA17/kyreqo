from django.db import models
from django.conf import settings
from apps.workspaces.models import Workspace

class RequestHistory(models.Model):
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

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name='history'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='history'
    )
    url = models.TextField()
    method = models.CharField(
        max_length=10,
        choices=METHOD_CHOICES,
        default='GET'
    )
    headers = models.JSONField(default=dict, blank=True)
    body = models.TextField(blank=True, null=True)
    response_status = models.IntegerField()
    response_time = models.IntegerField()  # In milliseconds
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.method} {self.url} ({self.workspace.name})"
