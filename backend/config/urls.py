from django.contrib import admin
from django.urls import path, include
from .views import root_view, health_view
from django.http import JsonResponse
'''
urlpatterns = [
    path('', root_view, name='api_root'),
    path('health/', health_view, name='health_check'),
    path('admin/', admin.site.urls),
    # API endpoints
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/workspaces/', include('apps.workspaces.urls', namespace='workspaces')),
    path('api/collections/', include('apps.collections.urls', namespace='collections')),
    path('api/requests/', include('apps.api_requests.urls', namespace='api_requests')),
    path('api/environments/', include('apps.environments.urls', namespace='environments')),
    path('api/history/', include('apps.history.urls', namespace='history')),
]

handler404 = 'config.views.custom_404_handler'
'''
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
    path('api/', include('apps.accounts.urls')),  # Add this line
]