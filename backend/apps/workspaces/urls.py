from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkspaceViewSet

app_name = 'workspaces'

router = DefaultRouter()
router.register('', WorkspaceViewSet, basename='workspace')

urlpatterns = [
    path('', include(router.urls)),
]
