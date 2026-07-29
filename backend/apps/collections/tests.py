from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from apps.workspaces.models import Workspace, WorkspaceMember
from .models import Collection, CollectionRequest

User = get_user_model()

class CollectionTests(APITestCase):
    def setUp(self):
        # Create users
        self.owner = User.objects.create_user(
            email="owner@example.com",
            password="testpassword123",  # nosec B106
            first_name="Owner",
            last_name="User"
        )
        self.editor = User.objects.create_user(
            email="editor@example.com",
            password="testpassword123",  # nosec B106
            first_name="Editor",
            last_name="User"
        )
        self.viewer = User.objects.create_user(
            email="viewer@example.com",
            password="testpassword123",  # nosec B106
            first_name="Viewer",
            last_name="User"
        )
        self.other_user = User.objects.create_user(
            email="other@example.com",
            password="testpassword123",  # nosec B106
            first_name="Other",
            last_name="User"
        )

        # Create workspace
        self.workspace = Workspace.objects.create(
            name="Workspace One",
            description="Test workspace one",
            owner=self.owner
        )

        # Create workspace members
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

        # Create collections
        self.collection = Collection.objects.create(
            name="Auth Services",
            description="Auth related requests",
            workspace=self.workspace
        )

    def test_collection_create_permissions(self):
        url = reverse("collections:collection-list")
        data = {
            "name": "User Services",
            "workspace": self.workspace.id
        }

        # 1. Unauthenticated fails
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

        # 2. Workspace Owner succeeds
        self.client.force_authenticate(user=self.owner)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["name"], "User Services")

        # 3. Workspace Editor succeeds
        self.client.force_authenticate(user=self.editor)
        data["name"] = "Post Services"
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 4. Workspace Viewer fails (returns validation error)
        self.client.force_authenticate(user=self.viewer)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 5. Non-member fails
        self.client.force_authenticate(user=self.other_user)
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_collection_read_permissions(self):
        url = reverse("collections:collection-list")

        # Owner can read
        self.client.force_authenticate(user=self.owner)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Viewer can read
        self.client.force_authenticate(user=self.viewer)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # Non-member cannot see collections
        self.client.force_authenticate(user=self.other_user)
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)

    def test_collection_write_permissions(self):
        url = reverse("collections:collection-detail", args=[self.collection.id])

        # 1. Editor can edit
        self.client.force_authenticate(user=self.editor)
        response = self.client.patch(url, {"name": "Auth API"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.collection.refresh_from_db()
        self.assertEqual(self.collection.name, "Auth API")

        # 2. Viewer cannot edit
        self.client.force_authenticate(user=self.viewer)
        response = self.client.patch(url, {"name": "Hacked API"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Non-member cannot delete
        self.client.force_authenticate(user=self.other_user)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # 4. Owner can delete
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Collection.objects.count(), 0)

    def test_request_persistence_flow(self):
        create_url = reverse("api_requests:request-list")
        data = {
            "collection": self.collection.id,
            "name": "Get User Profile",
            "url": "https://api.example.com/me",
            "method": "GET",
            "headers": {"Authorization": "Bearer token"},
            "query_params": {"fields": "id,name"}
        }

        # 1. Editor can save a request
        self.client.force_authenticate(user=self.editor)
        response = self.client.post(create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        request_id = response.data["id"]
        self.assertEqual(response.data["name"], "Get User Profile")
        self.assertEqual(response.data["headers"]["Authorization"], "Bearer token")

        # 2. Viewer cannot save requests
        self.client.force_authenticate(user=self.viewer)
        response = self.client.post(create_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. List requests in collection
        self.client.force_authenticate(user=self.viewer)
        list_url = f"{create_url}?collection={self.collection.id}"
        response = self.client.get(list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        # 4. Modify request details (Editor)
        detail_url = reverse("api_requests:request-detail", args=[request_id])
        self.client.force_authenticate(user=self.editor)
        response = self.client.patch(detail_url, {"name": "Get Authenticated Profile", "method": "POST"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Get Authenticated Profile")
        self.assertEqual(response.data["method"], "POST")

        # 5. Viewer cannot modify requests
        self.client.force_authenticate(user=self.viewer)
        response = self.client.patch(detail_url, {"name": "Hack Profile"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 6. Owner can delete requests
        self.client.force_authenticate(user=self.owner)
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(CollectionRequest.objects.count(), 0)

    def test_nested_collections_and_validation(self):
        url = reverse("collections:collection-list")
        self.client.force_authenticate(user=self.owner)

        # 1. Create a valid child collection
        data = {
            "name": "Nested Auth Subfolder",
            "workspace": self.workspace.id,
            "parent_collection": self.collection.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        child_id = response.data["id"]
        self.assertEqual(response.data["parent_collection"], self.collection.id)

        # 2. Verify recursive child representation in serializer
        retrieve_url = reverse("collections:collection-detail", args=[self.collection.id])
        response = self.client.get(retrieve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["child_collections"]), 1)
        self.assertEqual(response.data["child_collections"][0]["name"], "Nested Auth Subfolder")

        # 3. Create workspace 2 and try to link parent across workspaces
        workspace2 = Workspace.objects.create(
            name="Workspace Two",
            owner=self.owner
        )
        data2 = {
            "name": "Cross-Workspace Folder",
            "workspace": workspace2.id,
            "parent_collection": self.collection.id  # Mismatched workspace!
        }
        response = self.client.post(url, data2, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parent_collection", response.data)

        # 4. Self-referential update validation
        child_detail_url = reverse("collections:collection-detail", args=[child_id])
        response = self.client.patch(child_detail_url, {"parent_collection": child_id}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("parent_collection", response.data)
