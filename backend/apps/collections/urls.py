from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionViewSet

app_name = 'collections'

router = DefaultRouter()
router.register('', CollectionViewSet, basename='collection')

urlpatterns = [
    path('', include(router.urls)),
]
