from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.core.exceptions import ValidationError
from urllib.parse import urlparse

def validate_avatar_url(value):
    if not value:
        return
    if len(value) > 500:
        raise ValidationError("Avatar URL cannot exceed 500 characters.")
    try:
        parsed = urlparse(value)
        if parsed.scheme not in ['http', 'https']:
            raise ValidationError("Avatar URL must use http or https protocol.")
        hostname = parsed.hostname.lower() if parsed.hostname else ''
        if hostname in ['localhost', '127.0.0.1', '0.0.0.0', '::1']:  # nosec B104
            raise ValidationError("Local hostnames are not allowed.")
    except Exception:
        raise ValidationError("Invalid URL format.")

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        extra_fields.setdefault('is_active', True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    avatar = models.URLField(max_length=500, blank=True, null=True, validators=[validate_avatar_url])

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        return self.email


class LoginAttempt(models.Model):
    email = models.EmailField()
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='login_attempts'
    )
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(null=True, blank=True)
    is_successful = models.BooleanField(default=False)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        status_str = "Success" if self.is_successful else "Failure"
        return f"{self.email} - {status_str} at {self.timestamp}"

