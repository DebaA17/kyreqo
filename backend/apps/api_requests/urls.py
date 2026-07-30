from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

app_name = 'api_requests'

router = DefaultRouter()
router.register('', views.CollectionRequestViewSet, basename='request')

urlpatterns = [
    path('proxy/', views.ProxyRequestView.as_view(), name='proxy_request'),
    path('', include(router.urls)),
]
