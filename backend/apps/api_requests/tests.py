from unittest.mock import patch, MagicMock

import requests
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase

PROXY_URL = "/api/requests/proxy/"
SSRF_ERROR = (
    "SSRF Protection: Access to loopback, private, or invalid networks is prohibited."
)
PUBLIC_IP = "93.184.216.34"
DNS_PATCH = "apps.api_requests.views.socket.gethostbyname"
REQUEST_PATCH = "apps.api_requests.views.requests.request"


def fake_response(status_code=200, headers=None, json_data=None, text=""):
    resp = MagicMock()
    resp.status_code = status_code
    resp.headers = headers or {}
    if json_data is None:
        resp.json.side_effect = ValueError("no json")
    else:
        resp.json.return_value = json_data
    resp.text = text
    return resp


@override_settings(DEBUG=False)
class SSRFProtectionTests(APITestCase):
    """The proxy must block loopback, private, link-local and invalid targets."""

    def _assert_blocked(self, url):
        with patch(REQUEST_PATCH) as mock_request:
            response = self.client.post(
                PROXY_URL, {"url": url, "method": "GET"}, format="json"
            )
        self.assertEqual(
            response.status_code, status.HTTP_403_FORBIDDEN, msg=f"Not blocked: {url}"
        )
        self.assertEqual(response.data["error"], SSRF_ERROR)
        mock_request.assert_not_called()

    def test_blocks_ipv4_loopback(self):
        self._assert_blocked("http://127.0.0.1/")

    def test_blocks_localhost_hostname(self):
        self._assert_blocked("http://localhost/")

    def test_blocks_aws_metadata_endpoint(self):
        self._assert_blocked("http://169.254.169.254/latest/meta-data/")

    def test_blocks_10_0_0_0_range(self):
        self._assert_blocked("http://10.0.0.1/")

    def test_blocks_172_16_0_0_range(self):
        self._assert_blocked("http://172.16.0.1/")

    def test_blocks_192_168_0_0_range(self):
        self._assert_blocked("http://192.168.1.1/")

    def test_blocks_ipv6_loopback(self):
        # gethostbyname is IPv4-only, so resolution raises and the URL is rejected.
        self._assert_blocked("http://[::1]/")

    def test_blocks_file_scheme(self):
        self._assert_blocked("file:///etc/passwd")

    def test_blocks_ftp_scheme(self):
        self._assert_blocked("ftp://example.com/file")

    def test_blocks_hostname_resolving_to_private_ip(self):
        with patch(DNS_PATCH, return_value="10.1.2.3"):
            self._assert_blocked("http://internal.example.com/")

    def test_blocks_unresolvable_hostname(self):
        with patch(DNS_PATCH, side_effect=OSError("no such host")):
            self._assert_blocked("http://does-not-exist.invalid/")

    def test_missing_url_returns_400(self):
        response = self.client.post(PROXY_URL, {"method": "GET"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "The 'url' parameter is required.")

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_public_ip_is_allowed(self, mock_request, _dns):
        mock_request.return_value = fake_response(json_data={"ok": True})
        response = self.client.post(
            PROXY_URL, {"url": "http://example.com/", "method": "GET"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        mock_request.assert_called_once()


@override_settings(DEBUG=False)
class ProxyForwardingTests(APITestCase):
    """The proxy forwards requests and handles failures gracefully."""

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_forwards_get(self, mock_request, _dns):
        mock_request.return_value = fake_response(
            headers={"X-Test": "1"}, json_data={"ok": True}
        )
        response = self.client.post(
            PROXY_URL, {"url": "http://example.com/", "method": "get"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], 200)
        self.assertEqual(response.data["data"], {"ok": True})
        self.assertEqual(response.data["headers"], {"X-Test": "1"})
        _, kwargs = mock_request.call_args
        self.assertEqual(kwargs["method"], "GET")
        self.assertEqual(kwargs["url"], "http://example.com/")
        self.assertFalse(kwargs["allow_redirects"])

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_forwards_post_with_body(self, mock_request, _dns):
        mock_request.return_value = fake_response(status_code=201, json_data={"id": 1})
        response = self.client.post(
            PROXY_URL,
            {
                "url": "http://example.com/items",
                "method": "POST",
                "body": '{"name":"x"}',
                "headers": {"Content-Type": "application/json"},
            },
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], 201)
        _, kwargs = mock_request.call_args
        self.assertEqual(kwargs["method"], "POST")
        self.assertEqual(kwargs["data"], b'{"name":"x"}')

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_forwards_other_methods(self, mock_request, _dns):
        mock_request.return_value = fake_response(json_data={})
        for method in ("PUT", "PATCH", "DELETE"):
            response = self.client.post(
                PROXY_URL,
                {"url": "http://example.com/x", "method": method},
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(mock_request.call_args.kwargs["method"], method)

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_non_json_response_returns_text(self, mock_request, _dns):
        mock_request.return_value = fake_response(text="hello")
        response = self.client.post(
            PROXY_URL, {"url": "http://example.com/", "method": "GET"}, format="json"
        )
        self.assertEqual(response.data["data"], "hello")

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(
        REQUEST_PATCH,
        side_effect=requests.exceptions.ConnectionError("unreachable"),
    )
    def test_unreachable_endpoint_returns_502(self, _request, _dns):
        response = self.client.post(
            PROXY_URL, {"url": "http://example.com/", "method": "GET"}, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_502_BAD_GATEWAY)
        self.assertIn("Failed to execute target request", response.data["error"])

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH, side_effect=requests.exceptions.Timeout())
    def test_timeout_returns_504(self, _request, _dns):
        response = self.client.post(
            PROXY_URL,
            {"url": "http://example.com/", "method": "GET", "timeout": 500},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_504_GATEWAY_TIMEOUT)
        self.assertIn("timed out after 500 ms", response.data["error"])

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_timeout_is_clamped(self, mock_request, _dns):
        mock_request.return_value = fake_response(json_data={})
        self.client.post(
            PROXY_URL,
            {"url": "http://example.com/", "method": "GET", "timeout": 999999},
            format="json",
        )
        self.assertEqual(mock_request.call_args.kwargs["timeout"], 60.0)

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_strips_unsafe_headers_and_sets_user_agent(self, mock_request, _dns):
        mock_request.return_value = fake_response(json_data={})
        self.client.post(
            PROXY_URL,
            {
                "url": "http://example.com/",
                "method": "GET",
                "headers": {
                    "Host": "evil.com",
                    "Connection": "keep-alive",
                    "Content-Length": "999",
                    "X-Keep": "yes",
                },
            },
            format="json",
        )
        sent = {k.lower(): v for k, v in mock_request.call_args.kwargs["headers"].items()}
        for stripped in ("host", "connection", "content-length"):
            self.assertNotIn(stripped, sent)
        self.assertEqual(sent["x-keep"], "yes")
        self.assertTrue(sent["user-agent"].startswith("Kyreqo-Agent"))

    @patch(DNS_PATCH, return_value=PUBLIC_IP)
    @patch(REQUEST_PATCH)
    def test_custom_user_agent_is_preserved(self, mock_request, _dns):
        mock_request.return_value = fake_response(json_data={})
        self.client.post(
            PROXY_URL,
            {
                "url": "http://example.com/",
                "method": "GET",
                "headers": {"User-Agent": "MyAgent/2.0"},
            },
            format="json",
        )
        sent = {k.lower(): v for k, v in mock_request.call_args.kwargs["headers"].items()}
        self.assertEqual(sent["user-agent"], "MyAgent/2.0")