import os
import requests

def validate_turnstile_token(token, ip_address=None):
    secret = os.getenv('TURNSTILE_SECRET_KEY')
    if not secret:
        
        return True
    
    if not token:
        return False
        
    try:
        data = {
            'secret': secret,
            'response': token
        }
        if ip_address:
            data['remoteip'] = ip_address
            
        res = requests.post(
            'https://challenges.cloudflare.com/turnstile/v0/siteverify',
            data=data,
            timeout=5
        )
        res_data = res.json()
        return res_data.get('success', False)
    except Exception:
        return False


from django.core.mail import send_mail
from django.conf import settings

def send_verification_email(user):
    token = user.verification_token
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    verification_link = f"{frontend_url}/verify-email?token={token}"
    
    subject = "Verify your Kyreqo account"
    message = f"""Hi {user.first_name or 'User'},

Welcome to Kyreqo! Please verify your email address by clicking the link below:

{verification_link}

If you did not create an account, please ignore this email.

Best regards,
The Kyreqo Team"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )


def send_password_reset_email(user):
    token = user.password_reset_token
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:3000')
    reset_link = f"{frontend_url}/reset-password?token={token}"
    
    subject = "Reset your Kyreqo password"
    message = f"""Hi {user.first_name or 'User'},

You requested to reset your password. Please click the link below to set a new password:

{reset_link}

This link will expire in 1 hour.

If you did not request this, please ignore this email.

Best regards,
The Kyreqo Team"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False,
    )

