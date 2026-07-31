from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from apps.workspaces.models import Workspace
from apps.history.models import RequestHistory

User = get_user_model()

class RequestHistoryTests(APITestCase):
    def setUp(self):
        self.user1 = User.objects.create_user(email="user1@example.com", password="password123")
        self.user2 = User.objects.create_user(email="user2@example.com", password="password123")
        
        self.workspace = Workspace.objects.create(name="Workspace 1", owner=self.user1)
        
        self.client.force_authenticate(user=self.user1)

    def test_create_and_list_history(self):
        history_entry = RequestHistory.objects.create(
            workspace=self.workspace,
            user=self.user1,
            url="https://api.example.com/data",
            method="GET",
            headers={"Accept": "application/json"},
            body=None,
            response_status=200,
            response_time=150
        )
        
        url = reverse('history:history-list')
        response = self.client.get(url, {'workspace': self.workspace.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['url'], "https://api.example.com/data")

    def test_delete_history_entry(self):
        history_entry = RequestHistory.objects.create(
            workspace=self.workspace,
            user=self.user1,
            url="https://api.example.com/data",
            method="GET",
            response_status=200,
            response_time=150
        )
        
        url = reverse('history:history-detail', kwargs={'pk': history_entry.id})
        response = self.client.delete(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(RequestHistory.objects.count(), 0)

    def test_clear_workspace_history(self):
        RequestHistory.objects.create(
            workspace=self.workspace,
            user=self.user1,
            url="https://api.example.com/1",
            method="GET",
            response_status=200,
            response_time=100
        )
        RequestHistory.objects.create(
            workspace=self.workspace,
            user=self.user1,
            url="https://api.example.com/2",
            method="POST",
            response_status=201,
            response_time=200
        )
        
        url = reverse('history:history-clear-history')
        response = self.client.post(url, {'workspace': self.workspace.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(RequestHistory.objects.count(), 0)

    def test_non_member_cannot_access(self):
        self.client.force_authenticate(user=self.user2)
        
        url = reverse('history:history-list')
        response = self.client.get(url, {'workspace': self.workspace.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 0)

        url = reverse('history:history-clear-history')
        response = self.client.post(url, {'workspace': self.workspace.id})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
