from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountsAPITests(APITestCase):

    def setUp(self):
        self.register_url = reverse('accounts:register')
        self.login_url = reverse('accounts:login')
        self.me_url = reverse('accounts:me')
        self.refresh_url = reverse('accounts:token_refresh')
        
        self.user_data = {
            "email": "test@example.com",
            "password": "StrongPassword123!",  # nosec B105
            "password_confirm": "StrongPassword123!",  # nosec B105,
            "first_name": "Test",
            "last_name": "User"
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], self.user_data['email'])
        self.assertNotIn('password', response.data)
        
        # Verify user actually created in database
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

    def test_user_registration_password_mismatch(self):
        data = self.user_data.copy()
        data['password_confirm'] = 'DifferentPassword123!'  # nosec B105
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data or {})

    def test_user_login_success(self):
        # First register a user
        User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Attempt login
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_user_me_endpoint_authenticated(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Authenticate user directly
        self.client.force_authenticate(user=user)
        
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], user.email)

    def test_user_me_endpoint_unauthenticated(self):
        response = self.client.get(self.me_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_token_refresh(self):
        User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Login to get refresh token
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        # Refresh token
        response = self.client.post(self.refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_attempts_logging(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # 1. Successful login logging
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify a successful log was created
        from .models import LoginAttempt
        self.assertEqual(LoginAttempt.objects.count(), 1)
        log = LoginAttempt.objects.first()
        self.assertEqual(log.email, self.user_data['email'])
        self.assertEqual(log.user, user)
        self.assertTrue(log.is_successful)

        # 2. Failed login logging
        login_data_bad = {
            "email": self.user_data['email'],
            "password": "WrongPassword!"  # nosec B105
        }
        response = self.client.post(self.login_url, login_data_bad, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        # Verify a failed log was created
        self.assertEqual(LoginAttempt.objects.count(), 2)
        log_failed = LoginAttempt.objects.order_by('-timestamp').first()
        self.assertEqual(log_failed.email, self.user_data['email'])
        self.assertFalse(log_failed.is_successful)

    def test_admin_endpoints_permissions(self):
        # Create normal user & admin user
        normal_user = User.objects.create_user(
            email="normal@example.com",
            password="password123"  # nosec B106
        )
        admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="password123"  # nosec B106
        )

        admin_users_url = reverse('accounts:admin_users')
        admin_logs_url = reverse('accounts:admin_login_logs')

        # 1. Normal user is forbidden
        self.client.force_authenticate(user=normal_user)
        response = self.client.get(admin_users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.get(admin_logs_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Admin user is allowed
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(admin_users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)  # Normal + Admin

        response = self.client.get(admin_logs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

