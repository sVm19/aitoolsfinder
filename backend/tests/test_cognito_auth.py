"""Unit tests for AWS Cognito magic-code send and verification flows."""

from unittest.mock import patch
import pytest

from src.core.config import settings
from src.modules.identity.cognito_service import (
    CognitoError,
    send_cognito_code,
    verify_cognito_code,
)


@pytest.fixture(autouse=True)
def cognito_settings(monkeypatch):
    monkeypatch.setattr(settings, "COGNITO_APP_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "COGNITO_CLIENT_SECRET", "test-client-secret")
    monkeypatch.setattr(settings, "COGNITO_REGION", "us-east-1")


def test_verify_cognito_code_confirm_signup_success():
    with patch("src.modules.identity.cognito_service._call_cognito_api") as mock_api:
        mock_api.return_value = {}
        result = verify_cognito_code("User@Example.com", " 123 456 ")

    assert result == {
        "success": True,
        "email": "user@example.com",
        "mode": "signup_confirmed",
    }
    mock_api.assert_called_once()
    assert mock_api.call_args[0][0] == "ConfirmSignUp"
    assert mock_api.call_args[0][1]["ConfirmationCode"] == "123456"


def test_verify_cognito_code_falls_back_on_not_authorized():
    def fake_api(target, payload):
        if target == "ConfirmSignUp":
            raise CognitoError("NotAuthorizedException", "User is already confirmed")
        if target == "ConfirmForgotPassword":
            return {}
        raise AssertionError(f"Unexpected target: {target}")

    with patch(
        "src.modules.identity.cognito_service._call_cognito_api", side_effect=fake_api
    ):
        result = verify_cognito_code("user@example.com", "654321")

    assert result["mode"] == "forgot_password_confirmed"


def test_verify_cognito_code_falls_back_on_signup_code_mismatch():
    def fake_api(target, payload):
        if target == "ConfirmSignUp":
            raise CognitoError("CodeMismatchException", "Invalid code for signup")
        if target == "ConfirmForgotPassword":
            return {}
        raise AssertionError(f"Unexpected target: {target}")

    with patch(
        "src.modules.identity.cognito_service._call_cognito_api", side_effect=fake_api
    ):
        result = verify_cognito_code("user@example.com", "654321")

    assert result["mode"] == "forgot_password_confirmed"


def test_verify_cognito_code_falls_back_on_signup_expired_code():
    def fake_api(target, payload):
        if target == "ConfirmSignUp":
            raise CognitoError(
                "ExpiredCodeException",
                "Invalid code provided, please request a code again.",
            )
        if target == "ConfirmForgotPassword":
            return {}
        raise AssertionError(f"Unexpected target: {target}")

    with patch(
        "src.modules.identity.cognito_service._call_cognito_api", side_effect=fake_api
    ):
        result = verify_cognito_code("user@example.com", "654321")

    assert result["mode"] == "forgot_password_confirmed"


def test_verify_cognito_code_preserves_code_mismatch_when_both_fail():
    def fake_api(target, payload):
        if target == "ConfirmSignUp":
            raise CognitoError("CodeMismatchException", "Invalid code")
        if target == "ConfirmForgotPassword":
            raise CognitoError("InvalidParameterException", "Cannot reset password")
        raise AssertionError(f"Unexpected target: {target}")

    with patch(
        "src.modules.identity.cognito_service._call_cognito_api", side_effect=fake_api
    ):
        with pytest.raises(CognitoError) as exc_info:
            verify_cognito_code("user@example.com", "000000")

    assert exc_info.value.error_type == "CodeMismatch"


def test_send_cognito_code_resends_for_unconfirmed_existing_user():
    def fake_api(target, payload):
        if target == "SignUp":
            raise CognitoError("UsernameExistsException", "User already exists")
        if target == "ForgotPassword":
            raise CognitoError(
                "InvalidParameterException",
                "Cannot reset password for the user as there is no registered/verified email",
            )
        if target == "ResendConfirmationCode":
            return {"CodeDeliveryDetails": {"Destination": "u***@example.com"}}
        raise AssertionError(f"Unexpected target: {target}")

    with patch(
        "src.modules.identity.cognito_service._call_cognito_api", side_effect=fake_api
    ):
        result = send_cognito_code("user@example.com")

    assert result["success"] is True
    assert result["is_new_user"] is True
    assert result["destination"] == "u***@example.com"


def test_verify_cognito_code_without_client_secret(monkeypatch):
    monkeypatch.setattr(settings, "COGNITO_CLIENT_SECRET", None)
    with patch("src.modules.identity.cognito_service._call_cognito_api") as mock_api:
        mock_api.return_value = {}
        result = verify_cognito_code("user@example.com", "123456")

    assert result["success"] is True
    assert "SecretHash" not in mock_api.call_args[0][1]


async def test_verify_magic_code_endpoint(client):
    with patch(
        "src.modules.identity.router.verify_cognito_code",
        return_value={
            "success": True,
            "email": "alice@example.com",
            "mode": "signup_confirmed",
        },
    ):
        res = await client.post(
            "/api/v1/auth/magic-code/verify",
            json={"email": "alice@example.com", "code": "123456"},
        )

    assert res.status_code == 200
    body = res.json()
    assert body["success"] is True
    assert body["token"]
    assert body["user"]["email"] == "alice@example.com"
    assert body["user"]["is_email_verified"] is True
