from django.contrib.auth import get_user_model
from django.urls import reverse
from unittest.mock import patch
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase

from .models import AnalysisRecord


User = get_user_model()


class AuthenticationApiTests(APITestCase):
    def test_private_api_requires_authentication(self):
        response = self.client.get(reverse("history"))
        self.assertEqual(response.status_code, 401)

    def test_registration_creates_account_and_token(self):
        response = self.client.post(reverse("register"), {
            "name": "Code Radar User",
            "email": "Person@Example.com",
            "password": "Strong-passphrase-29!",
        }, format="json")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["user"]["email"], "person@example.com")
        user = User.objects.get(email="person@example.com")
        self.assertTrue(user.check_password("Strong-passphrase-29!"))
        self.assertEqual(response.data["token"], Token.objects.get(user=user).key)

    def test_registration_rejects_duplicate_email_and_weak_password(self):
        User.objects.create_user("person", "person@example.com", "Strong-passphrase-29!")
        duplicate = self.client.post(reverse("register"), {
            "name": "Someone Else", "email": "PERSON@example.com", "password": "Strong-passphrase-30!",
        }, format="json")
        weak_password = self.client.post(reverse("register"), {
            "name": "Another Person", "email": "another@example.com", "password": "123",
        }, format="json")

        self.assertEqual(duplicate.status_code, 400)
        self.assertIn("already exists", duplicate.data["error"])
        self.assertEqual(weak_password.status_code, 400)
        self.assertIn("error", weak_password.data)

    def test_login_uses_email_and_rejects_wrong_password(self):
        User.objects.create_user("person", "person@example.com", "Strong-passphrase-29!")
        bad_login = self.client.post(reverse("login"), {
            "email": "person@example.com", "password": "incorrect",
        }, format="json")
        good_login = self.client.post(reverse("login"), {
            "email": "PERSON@example.com", "password": "Strong-passphrase-29!",
        }, format="json")

        self.assertEqual(bad_login.status_code, 401)
        self.assertEqual(good_login.status_code, 200)
        self.assertIn("token", good_login.data)

    def test_logout_revokes_token(self):
        user = User.objects.create_user("person", "person@example.com", "Strong-passphrase-29!")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(reverse("logout"))

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Token.objects.filter(user=user).exists())

    def test_profile_update_and_password_change(self):
        user = User.objects.create_user("person", "person@example.com", "Strong-passphrase-29!")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        profile = self.client.patch(reverse("update_profile"), {
            "name": "Updated Name", "email": "updated@example.com",
        }, format="json")
        password = self.client.post(reverse("change_password"), {
            "current_password": "Strong-passphrase-29!", "new_password": "Different-strong-passphrase-38!",
        }, format="json")

        user.refresh_from_db()
        self.assertEqual(profile.status_code, 200)
        self.assertEqual(user.first_name, "Updated Name")
        self.assertEqual(user.email, "updated@example.com")
        self.assertEqual(password.status_code, 200)
        self.assertTrue(user.check_password("Different-strong-passphrase-38!"))
        self.assertNotEqual(password.data["token"], token.key)

    def test_analysis_history_is_private_to_each_user(self):
        owner = User.objects.create_user("owner", "owner@example.com", "Strong-passphrase-29!")
        other = User.objects.create_user("other", "other@example.com", "Strong-passphrase-29!")
        owned_record = AnalysisRecord.objects.create(user=owner, code_snippet="owned", score="Low")
        AnalysisRecord.objects.create(user=other, code_snippet="private", score="High")
        owner_token = Token.objects.create(user=owner)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {owner_token.key}")

        response = self.client.get(reverse("history"))

        self.assertEqual(response.status_code, 200)
        self.assertEqual([entry["id"] for entry in response.data], [owned_record.pk])
        self.client.delete(reverse("clear_history"))
        self.assertFalse(AnalysisRecord.objects.filter(user=owner).exists())
        self.assertTrue(AnalysisRecord.objects.filter(user=other).exists())

    @patch("analyzer.views.compute_complexity", return_value={"score": "Low", "avg_complexity": 1})
    def test_analysis_is_saved_under_authenticated_user(self, _compute_complexity):
        user = User.objects.create_user("person", "person@example.com", "Strong-passphrase-29!")
        token = Token.objects.create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")

        response = self.client.post(reverse("analyze"), {
            "code": "def greet():\n    return 'hello'",
        }, format="json")

        self.assertEqual(response.status_code, 200)
        record = AnalysisRecord.objects.get()
        self.assertEqual(record.user, user)
