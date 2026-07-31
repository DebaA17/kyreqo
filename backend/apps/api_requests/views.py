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
        
        
        ip_str = socket.gethostbyname(host)
        ip = ipaddress.ip_address(ip_str)
        
        
        if settings.DEBUG:
            return True

        
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
        import time
        start_time = time.time()

        target_url = request.data.get('url')
        method = request.data.get('method', 'GET').upper()
        headers = request.data.get('headers', {})
        body = request.data.get('body')
        workspace_id = request.data.get('workspace')

        if not target_url:
            return Response(
                {"error": "The 'url' parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not is_safe_url(target_url):
            return Response(
                {"error": "SSRF Protection: Access to loopback, private, or invalid networks is prohibited."},
                status=status.HTTP_403_FORBIDDEN
            )

        filtered_headers = {
            k: v for k, v in headers.items()
            if k.lower() not in ('host', 'content-length', 'connection')
        }

        try:
            res = requests.request(
                method=method,
                url=target_url,
                headers=filtered_headers,
                data=body.encode('utf-8') if isinstance(body, str) else body,
                timeout=10
            )

            duration_ms = int((time.time() - start_time) * 1000)
            response_status = res.status_code

            try:
                response_data = res.json()
            except ValueError:
                response_data = res.text

            self._log_request_history(request, workspace_id, target_url, method, headers, body, response_status, duration_ms)

            return Response({
                "status": res.status_code,
                "headers": dict(res.headers),
                "data": response_data
            }, status=status.HTTP_200_OK)

        except requests.exceptions.Timeout:
            duration_ms = int((time.time() - start_time) * 1000)
            self._log_request_history(request, workspace_id, target_url, method, headers, body, status.HTTP_504_GATEWAY_TIMEOUT, duration_ms)
            return Response(
                {"error": "The request timed out after 10 seconds."},
                status=status.HTTP_504_GATEWAY_TIMEOUT
            )
        except requests.exceptions.RequestException as e:
            duration_ms = int((time.time() - start_time) * 1000)
            self._log_request_history(request, workspace_id, target_url, method, headers, body, status.HTTP_502_BAD_GATEWAY, duration_ms)
            return Response(
                {"error": f"Failed to execute target request: {str(e)}"},
                status=status.HTTP_502_BAD_GATEWAY
            )

    def _log_request_history(self, request, workspace_id, url, method, headers, body, response_status, response_time):
        if request.user and request.user.is_authenticated and workspace_id:
            try:
                from apps.workspaces.models import Workspace
                from .models import RequestHistory
                workspace = Workspace.objects.filter(
                    models.Q(owner=request.user) |
                    models.Q(memberships__user=request.user)
                ).distinct().filter(id=workspace_id).first()

                if workspace:
                    RequestHistory.objects.create(
                        workspace=workspace,
                        user=request.user,
                        url=url,
                        method=method,
                        headers=headers,
                        body=body if isinstance(body, str) else str(body) if body is not None else None,
                        response_status=response_status,
                        response_time=response_time
                    )
            except Exception:  # nosec B110
                pass


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
