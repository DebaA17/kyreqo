from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from rest_framework.permissions import AllowAny
from .views import root_view, health_view

urlpatterns = [
    path('', root_view, name='api_root'),
    path('health/', health_view, name='health_check'),
    path('admin/', admin.site.urls),
    
    
    path('api/schema/', SpectacularAPIView.as_view(permission_classes=[AllowAny]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', permission_classes=[AllowAny]), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema', permission_classes=[AllowAny]), name='redoc'),

    
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/workspaces/', include('apps.workspaces.urls', namespace='workspaces')),
    path('api/collections/', include('apps.collections.urls', namespace='collections')),
    path('api/requests/', include('apps.api_requests.urls', namespace='api_requests')),
    path('api/environments/', include('apps.environments.urls', namespace='environments')),
    path('api/history/', include('apps.history.urls', namespace='history')),
]

handler404 = 'config.views.custom_404_handler'

