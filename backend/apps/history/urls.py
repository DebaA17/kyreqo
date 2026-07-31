from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HistoryViewSet

router = DefaultRouter()
router.register(r'', HistoryViewSet, basename='history')

app_name = 'history'

urlpatterns = [
    path('', include(router.urls)),
]
