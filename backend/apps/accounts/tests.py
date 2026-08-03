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
            "password": "StrongPassword123!",  
            "password_confirm": "StrongPassword123!",  
            "first_name": "Test",
            "last_name": "User"
        }

    def test_user_registration_success(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['email'], self.user_data['email'])
        self.assertNotIn('password', response.data)
        
        
        self.assertTrue(User.objects.filter(email=self.user_data['email']).exists())

    def test_user_registration_password_mismatch(self):
        data = self.user_data.copy()
        data['password_confirm'] = 'DifferentPassword123!'  
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data or {})

    def test_user_login_success(self):
        
        User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        
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
        
        
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        refresh_token = login_response.data['refresh']
        
        
        response = self.client.post(self.refresh_url, {"refresh": refresh_token}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_attempts_logging(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        
        login_data = {
            "email": self.user_data['email'],
            "password": self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        from .models import LoginAttempt
        self.assertEqual(LoginAttempt.objects.count(), 1)
        log = LoginAttempt.objects.first()
        self.assertEqual(log.email, self.user_data['email'])
        self.assertEqual(log.user, user)
        self.assertTrue(log.is_successful)

        
        login_data_bad = {
            "email": self.user_data['email'],
            "password": "WrongPassword!"  
        }
        response = self.client.post(self.login_url, login_data_bad, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        
        self.assertEqual(LoginAttempt.objects.count(), 2)
        log_failed = LoginAttempt.objects.order_by('-timestamp').first()
        self.assertEqual(log_failed.email, self.user_data['email'])
        self.assertFalse(log_failed.is_successful)

    def test_admin_endpoints_permissions(self):
        
        normal_user = User.objects.create_user(
            email="normal@example.com",
            password="password123"  
        )
        admin_user = User.objects.create_superuser(
            email="admin@example.com",
            password="password123"  
        )

        admin_users_url = reverse('accounts:admin_users')
        admin_logs_url = reverse('accounts:admin_login_logs')

        
        self.client.force_authenticate(user=normal_user)
        response = self.client.get(admin_users_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.get(admin_logs_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Authenticated as admin
        self.client.force_authenticate(user=admin_user)
        response = self.client.get(admin_users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)  # owner, member, and admin_user

        response = self.client.get(admin_logs_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_user_registration_generates_token_and_unverified(self):
        response = self.client.post(self.register_url, self.user_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email=self.user_data['email'])
        self.assertFalse(user.email_verified)
        self.assertIsNotNone(user.verification_otp)
        self.assertEqual(len(user.verification_otp), 6)

    def test_verify_email_success(self):
        # Register user
        self.client.post(self.register_url, self.user_data, format='json')
        user = User.objects.get(email=self.user_data['email'])
        otp = user.verification_otp

        verify_url = reverse('accounts:verify_email')
        response = self.client.post(verify_url, {"email": user.email, "otp": otp}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.email_verified)
        self.assertIsNone(user.verification_otp)

    def test_resend_verification_success(self):
        # Register user
        self.client.post(self.register_url, self.user_data, format='json')
        user = User.objects.get(email=self.user_data['email'])
        original_otp = user.verification_otp

        resend_url = reverse('accounts:resend_verification')
        response = self.client.post(resend_url, {"email": user.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertNotEqual(user.verification_otp, original_otp)
        self.assertEqual(len(user.verification_otp), 6)

    def test_forgot_password_success(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        forgot_url = reverse('accounts:reset_password')
        response = self.client.post(forgot_url, {"email": user.email}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertIsNotNone(user.password_reset_token)
        self.assertIsNotNone(user.password_reset_token_created_at)

    def test_reset_password_confirm_success(self):
        user = User.objects.create_user(
            email=self.user_data['email'],
            password=self.user_data['password']
        )
        
        # Trigger forgot password
        forgot_url = reverse('accounts:reset_password')
        self.client.post(forgot_url, {"email": user.email}, format='json')
        user.refresh_from_db()
        token = user.password_reset_token

        confirm_url = reverse('accounts:reset_password_confirm')
        new_password = "NewStrongPassword123!"
        response = self.client.post(confirm_url, {
            "token": token,
            "password": new_password,
            "password_confirm": new_password
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Try logging in with new password
        login_data = {
            "email": user.email,
            "password": new_password
        }
        login_response = self.client.post(self.login_url, login_data, format='json')
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
