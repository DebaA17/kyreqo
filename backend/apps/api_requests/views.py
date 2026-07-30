import socket
import urllib.parse
import ipaddress
import requests
from django.db import models
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from apps.collections.models import CollectionRequest
from apps.collections.serializers import CollectionRequestSerializer
from apps.collections.permissions import IsWorkspaceMemberForRequest

from django.conf import settings

def is_safe_url(url_str):
    """
    Validates that a URL does not point to a loopback, private, or reserved IP address
    to safeguard against Server-Side Request Forgery (SSRF).
    Allows loopback/private IPs in DEBUG mode for local development/testing.
    """
    try:
        parsed_url = urllib.parse.urlparse(url_str)
        if parsed_url.scheme not in ('http', 'https'):
            return False
        
        host = parsed_url.hostname
        if not host:
            return False
        
        # Resolve hostname to IP address
        ip_str = socket.gethostbyname(host)
        ip = ipaddress.ip_address(ip_str)
        
        # Allow private / loopback IPs in debug mode
        if settings.DEBUG:
            return True

        # Check against private / loopback / link-local addresses
        if (ip.is_private or 
            ip.is_loopback or 
            ip.is_link_local or 
            ip.is_multicast or 
            ip.is_reserved):
            return False
            
        return True
    except Exception:
        return False


class ProxyRequestView(APIView):
    """
    Proxy endpoint that routes API requests securely from frontend to third-party endpoints.
    Allows guest testing (AllowAny).
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        target_url = request.data.get('url')
        method = request.data.get('method', 'GET').upper()
        headers = request.data.get('headers', {})
        body = request.data.get('body')

        if not target_url:
            return Response(
                {"error": "The 'url' parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 1. SSRF Protection Check
        if not is_safe_url(target_url):
            return Response(
                {"error": "SSRF Protection: Access to loopback, private, or invalid networks is prohibited."},
                status=status.HTTP_403_FORBIDDEN
            )

        # 2. Prepare request options
        # Filter out system headers that might interfere with requests
        filtered_headers = {
            k: v for k, v in headers.items()
            if k.lower() not in ('host', 'content-length', 'connection')
        }

        try:
            # 3. Execute request via python requests
            res = requests.request(
                method=method,
                url=target_url,
                headers=filtered_headers,
                data=body.encode('utf-8') if isinstance(body, str) else body,
                timeout=10
            )

            # Try parsing response as JSON, fallback to plain text
            try:
                response_data = res.json()
            except ValueError:
                response_data = res.text

            return Response({
                "status": res.status_code,
                "headers": dict(res.headers),
                "data": response_data
            }, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            return Response(
                {"error": "The request timed out after 10 seconds."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            return Response(
                {"error": f"Failed to execute target request: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )


class CollectionRequestViewSet(viewsets.ModelViewSet):
    serializer_class = CollectionRequestSerializer
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMemberForRequest]

    def get_queryset(self):
        user = self.request.user
        queryset = CollectionRequest.objects.filter(
            models.Q(collection__workspace__owner=user) | 
            models.Q(collection__workspace__memberships__user=user)
        ).distinct()

        collection_id = self.request.query_params.get('collection')
        if collection_id:
            queryset = queryset.filter(collection_id=collection_id)

        return queryset
