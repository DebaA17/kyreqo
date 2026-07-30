from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnvironmentViewSet

app_name = 'environments'

router = DefaultRouter()
router.register('', EnvironmentViewSet, basename='environment')

urlpatterns = [
    path('', include(router.urls)),
]
