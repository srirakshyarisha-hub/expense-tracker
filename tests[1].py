from datetime import date, timedelta

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Expense


class ExpenseCRUDTests(APITestCase):
    def setUp(self):
        self.list_url = reverse('expense-list-create')
        self.valid_payload = {
            "title": "Test Expense",
            "amount": "250.00",
            "category": "Food",
            "expense_date": str(date.today()),
            "payment_method": "Cash",
            "description": "Unit test expense",
        }

    def test_create_expense(self):
        response = self.client.post(self.list_url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Expense.objects.count(), 1)

    def test_create_expense_missing_title(self):
        payload = self.valid_payload.copy()
        payload["title"] = ""
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_negative_amount(self):
        payload = self.valid_payload.copy()
        payload["amount"] = "-50.00"
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_future_date(self):
        payload = self.valid_payload.copy()
        payload["expense_date"] = str(date.today() + timedelta(days=5))
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_expense_invalid_category(self):
        payload = self.valid_payload.copy()
        payload["category"] = "NotACategory"
        response = self.client.post(self.list_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_list_expenses(self):
        self.client.post(self.list_url, self.valid_payload, format='json')
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["count"], 1)

    def test_retrieve_update_delete(self):
        create_resp = self.client.post(self.list_url, self.valid_payload, format='json')
        expense_id = create_resp.data["data"]["id"]
        detail_url = reverse('expense-detail', args=[expense_id])

        # Retrieve
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Update
        response = self.client.patch(detail_url, {"amount": "999.99"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["amount"], "999.99")

        # Delete
        response = self.client.delete(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Expense.objects.count(), 0)

    def test_dashboard_stats(self):
        self.client.post(self.list_url, self.valid_payload, format='json')
        response = self.client.get(reverse('dashboard-stats'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["total_expenses"], 1)
