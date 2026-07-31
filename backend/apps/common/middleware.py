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
