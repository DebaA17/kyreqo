from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, MeView, CustomTokenObtainPairView, AdminUserListView, AdminLoginLogListView, complete_onboarding

app_name = 'accounts'

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='me'),
    path('admin/users/', AdminUserListView.as_view(), name='admin_users'),
    path('admin/login-logs/', AdminLoginLogListView.as_view(), name='admin_login_logs'),
    path('complete-onboarding/', complete_onboarding, name='complete_onboarding'),
]
