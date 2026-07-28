from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from .models import Workspace, WorkspaceMember

User = get_user_model()


class WorkspaceTests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="testpassword123",  # nosec B106
            first_name="Owner",
            last_name="User"
        )
        self.member = User.objects.create_user(
            email="member@example.com",
            password="testpassword123",  # nosec B106
            first_name="Member",
            last_name="User"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="testpassword123",  # nosec B106
            first_name="Other",
            last_name="User"
        )

        # Create a workspace
        self.workspace = Workspace.objects.create(
            name="Test Workspace",
            description="A test workspace",
            owner=self.owner
        )

    def test_workspace_creation(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse("workspaces:workspace-list")
        data = {
            "name": "New Workspace",
            "description": "New description"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "New Workspace")
        self.assertEqual(response.data["owner"]["email"], self.owner.email)

    def test_workspace_list_permissions(self):
        # Unauthenticated users cannot view workspaces
        url = reverse("workspaces:workspace-list")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # Owner can see their workspace
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Member (not added yet) cannot see it
        self.client.force_authenticate(user=self.member)
        response = self.client.get(url)
        self.assertEqual(len(response.data), 0)

        # Add member to workspace
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.member,
            role="editor"
        )
        response = self.client.get(url)
        self.assertEqual(len(response.data), 1)

    def test_workspace_owner_edit_delete(self):
        self.client.force_authenticate(user=self.owner)
        url = reverse("workspaces:workspace-detail", args=[self.workspace.id])
        
        # Owner can edit
        response = self.client.patch(url, {"name": "Updated Name"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.workspace.refresh_from_db()
        self.assertEqual(self.workspace.name, "Updated Name")

        # Owner can delete
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Workspace.objects.count(), 0)

    def test_workspace_non_owner_edit_delete_forbidden(self):
        # Add editor member
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.member,
            role="editor"
        )

        self.client.force_authenticate(user=self.member)
        url = reverse("workspaces:workspace-detail", args=[self.workspace.id])
        
        # Member cannot edit
        response = self.client.patch(url, {"name": "Hack Name"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Member cannot delete
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_member_management_flow(self):
        # View members
        self.client.force_authenticate(user=self.owner)
        url = reverse("workspaces:workspace-members", args=[self.workspace.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

        # Add a member
        data = {
            "email": self.member.email,
            "role": "editor"
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["user_email"], self.member.email)
        self.assertEqual(response.data["role"], "editor")
        member_id = response.data["id"]

        # Adding same member again fails
        dup_response = self.client.post(url, data)
        self.assertEqual(dup_response.status_code, status.HTTP_400_BAD_REQUEST)

        # Update member role
        detail_url = reverse("workspaces:workspace-member-detail", args=[self.workspace.id, member_id])
        response = self.client.patch(detail_url, {"role": "admin"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["role"], "admin")

        # Remove member
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(WorkspaceMember.objects.count(), 0)
