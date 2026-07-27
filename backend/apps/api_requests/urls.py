from django.urls import path
from . import views

app_name = 'api_requests'

urlpatterns = [
    path('proxy/', views.ProxyRequestView.as_view(), name='proxy_request'),
]
