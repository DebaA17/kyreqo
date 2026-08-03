from rest_framework import permissions

class IsEmailVerified(permissions.BasePermission):
    """
    Allows access only to users who have verified their email addresses.
    """
    message = "Your email address must be verified to perform this action."

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return getattr(request.user, 'email_verified', False)
