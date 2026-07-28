from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({
        "status": "online",
        "message": "Welcome to the Kyreqo API Platform Gateway.",
        "description": "Kyreqo is a secure, sandboxed API development and testing engine built using Django REST Framework and React.",
        "version": "1.0.0",
        "documentation": "/api/docs/"
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    path('api/', include('apps.accounts.urls')),  # All auth URLs
]