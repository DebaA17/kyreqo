from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.workspaces.models import Workspace, WorkspaceMember
from .models import Environment

User = get_user_model()

class EnvironmentTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="testpassword123",  
            first_name="Owner",
            last_name="User"
        )
        self.editor = User.objects.create_user(
            email="editor@example.com",
            password="testpassword123",  
            first_name="Editor",
            last_name="User"
        )
        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            password="testpassword123",  
            first_name="Viewer",
            last_name="User"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="testpassword123",  
            first_name="Other",
            last_name="User"
        )

        self.workspace = Workspace.objects.create(
            name="Workspace One",
            description="Test workspace one",
            owner=self.owner
        )

        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.editor,
            role="editor"
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.viewer,
            role="viewer"
        )

        self.environment = Environment.objects.create(
            workspace=self.workspace,
            name="Dev Env",
            variables=[
                {"key": "base_url", "value": "https://dev.api.com", "enabled": True},
                {"key": "token", "value": "dev-token-xyz", "enabled": True}
            ]
        )

        self.list_create_url = reverse('environments:environment-list')
        self.detail_url = reverse('environments:environment-detail', args=[self.environment.id])

    def test_list_environments_success(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(self.list_create_url, {'workspace': self.workspace.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], "Dev Env")

    def test_list_environments_filtered_non_member(self):
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(self.list_create_url, {'workspace': self.workspace.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_create_environment_owner(self):
        self.client.force_authenticate(user=self.owner)
        data = {
            "workspace": self.workspace.id,
            "name": "Prod Env",
            "variables": [{"key": "base_url", "value": "https://prod.api.com", "enabled": True}]
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Prod Env")

    def test_create_environment_editor(self):
        self.client.force_authenticate(user=self.editor)
        data = {
            "workspace": self.workspace.id,
            "name": "Staging Env",
            "variables": []
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_create_environment_viewer_blocked(self):
        self.client.force_authenticate(user=self.viewer)
        data = {
            "workspace": self.workspace.id,
            "name": "Staging Env",
            "variables": []
        }
        response = self.client.post(self.list_create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_environment_editor(self):
        self.client.force_authenticate(user=self.editor)
        data = {"name": "Updated Dev Env"}
        response = self.client.patch(self.detail_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Updated Dev Env")

    def test_delete_environment_viewer_blocked(self):
        self.client.force_authenticate(user=self.viewer)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_delete_environment_owner(self):
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
