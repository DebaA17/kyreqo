from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError

def custom_404_handler(request, exception=None):
    """
    Custom 404 error handler that returns a clean JSON response instead of HTML.
    Only triggered when DEBUG = False.
    """
    return JsonResponse(
        {
            "error": "Not Found",
            "message": f"The requested resource '{request.path}' was not found on this server."
        },
        status=404
    )


def root_view(request):
    """
    Welcoming API root overview detailing that the Kyreqo API is live.
    """
    return JsonResponse(
        {
            "status": "online",
            "message": "Welcome to the Kyreqo API Platform Gateway.",
            "description": "Kyreqo is a secure, sandboxed API development and testing engine built using Django REST Framework and React.",
            "version": "1.0.0",
            "documentation": "/api/docs/"
        },
        status=200
    )


def health_view(request):
    """
    System health check returning database status.
    """
    db_conn = connections['default']
    try:
        db_conn.cursor()
        db_status = "connected"
    except OperationalError:
        db_status = "disconnected"

    return JsonResponse(
        {
            "status": "healthy",
            "database": db_status,
            "engine": "Kyreqo Gateway Service"
        },
        status=200
    )
