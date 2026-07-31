import traceback
from django.http import HttpResponse
from django.conf import settings

class SecurityHeadersMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        response['Content-Security-Policy'] = (
            "default-src 'self'; "
            "connect-src 'self' *; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com; "
            "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https://* https://cdn.jsdelivr.net; "
            "font-src 'self' https://fonts.gstatic.com;"
        )
        response['Permissions-Policy'] = "geolocation=(), microphone=(), camera=()"
        return response


class AdminTracebackMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_exception(self, request, exception):
        # Check if the user is authenticated and is a staff member
        if hasattr(request, 'user') and request.user and getattr(request.user, 'is_staff', False):
            tb = traceback.format_exc()
            html = f"<h1>500 Server Error - Traceback</h1><pre>{tb}</pre>"
            return HttpResponse(html, status=500, content_type="text/html")
        return None
