"""AWS Cognito Authentication service for email OTP and passwordless flow."""

import base64
import hashlib
import hmac
import json
import logging
import urllib.error
import urllib.request
import uuid
from typing import Any, Dict

from src.core.config import settings

logger = logging.getLogger(__name__)


def calculate_secret_hash(username: str) -> str:
    """Calculate the HMAC-SHA256 SECRET_HASH required by AWS Cognito."""
    if not settings.COGNITO_CLIENT_SECRET or not settings.COGNITO_APP_CLIENT_ID:
        raise ValueError(
            "COGNITO_CLIENT_SECRET and COGNITO_APP_CLIENT_ID must be configured"
        )

    msg = username + settings.COGNITO_APP_CLIENT_ID
    dig = hmac.new(
        settings.COGNITO_CLIENT_SECRET.encode("utf-8"),
        msg.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).digest()
    return base64.b64encode(dig).decode()


def _call_cognito_api(target: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call an AWS Cognito Identity Provider API action using urllib."""
    region = settings.COGNITO_REGION or "ap-southeast-2"
    url = f"https://cognito-idp.{region}.amazonaws.com/"
    headers = {
        "X-Amz-Target": f"AWSCognitoIdentityProviderService.{target}",
        "Content-Type": "application/x-amz-json-1.1",
    }

    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers=headers,
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=12.0) as response:
            body = response.read().decode("utf-8")
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        err_body = exc.read().decode("utf-8")
        try:
            err_json = json.loads(err_body)
            err_type = err_json.get("__type", "UnknownError")
            err_msg = err_json.get("message", "Cognito request failed")
        except Exception:
            err_type = "HttpError"
            err_msg = err_body or str(exc)

        logger.error(f"[Cognito API Error] {target}: {err_type} - {err_msg}")
        raise CognitoError(err_type, err_msg) from exc
    except Exception as exc:
        logger.error(f"[Cognito Network Error] {target}: {exc}")
        raise CognitoError(
            "NetworkError", f"Failed to connect to Cognito: {exc}"
        ) from exc


class CognitoError(Exception):
    def __init__(self, error_type: str, message: str):
        self.error_type = error_type
        self.message = message
        super().__init__(f"{error_type}: {message}")


def send_cognito_code(email: str) -> Dict[str, Any]:
    """Send an authentication verification code to user's email via AWS Cognito.

    If user does not exist, registers them via SignUp (triggers verification email).
    If user already exists, triggers ForgotPassword (triggers verification email).
    """
    clean_email = email.strip().lower()
    secret_hash = calculate_secret_hash(clean_email)
    client_id = settings.COGNITO_APP_CLIENT_ID

    # 1. Attempt SignUp first (for first-time users)
    # Use a secure strong auto-generated password so the user never has to set or remember one
    temp_password = f"P@{uuid.uuid4().hex[:14]}Aa1!"
    signup_payload = {
        "ClientId": client_id,
        "SecretHash": secret_hash,
        "Username": clean_email,
        "Password": temp_password,
        "UserAttributes": [{"Name": "email", "Value": clean_email}],
    }

    try:
        res = _call_cognito_api("SignUp", signup_payload)
        delivery = res.get("CodeDeliveryDetails", {})
        destination = delivery.get("Destination", clean_email)
        return {
            "success": True,
            "is_new_user": True,
            "destination": destination,
            "message": f"Verification code sent to {destination}",
        }
    except CognitoError as err:
        if err.error_type == "UsernameExistsException":
            logger.info(
                f"User {clean_email} already exists in Cognito, triggering ForgotPassword code"
            )
        else:
            logger.warning(f"SignUp failed with {err.error_type}: {err.message}")

    # 2. Existing user -> trigger ForgotPassword code
    forgot_payload = {
        "ClientId": client_id,
        "SecretHash": secret_hash,
        "Username": clean_email,
    }

    try:
        res = _call_cognito_api("ForgotPassword", forgot_payload)
        delivery = res.get("CodeDeliveryDetails", {})
        destination = delivery.get("Destination", clean_email)
        return {
            "success": True,
            "is_new_user": False,
            "destination": destination,
            "message": f"Verification code sent to {destination}",
        }
    except CognitoError as err:
        if err.error_type == "UserNotFoundException":
            raise CognitoError(
                "UserNotFound",
                "Account could not be found or registered. Please verify your email.",
            )
        if err.error_type == "LimitExceededException":
            raise CognitoError(
                "RateLimitExceeded",
                "Too many attempts. Please wait a few minutes before requesting another code.",
            )
        raise


def verify_cognito_code(email: str, code: str) -> Dict[str, Any]:
    """Verify the 6-digit confirmation code with AWS Cognito."""
    clean_email = email.strip().lower()
    clean_code = code.strip().replace(" ", "")
    secret_hash = calculate_secret_hash(clean_email)
    client_id = settings.COGNITO_APP_CLIENT_ID

    # 1. Try ConfirmSignUp (if newly registered)
    try:
        _call_cognito_api(
            "ConfirmSignUp",
            {
                "ClientId": client_id,
                "SecretHash": secret_hash,
                "Username": clean_email,
                "ConfirmationCode": clean_code,
            },
        )
        return {"success": True, "email": clean_email, "mode": "signup_confirmed"}
    except CognitoError as err:
        # If user is already confirmed or was an existing user, try ConfirmForgotPassword
        if err.error_type in (
            "NotAuthorizedException",
            "UserNotFoundException",
            "InvalidParameterException",
        ):
            logger.info(
                f"ConfirmSignUp skipped ({err.error_type}), trying ConfirmForgotPassword"
            )
        elif err.error_type == "CodeMismatchException":
            raise CognitoError(
                "CodeMismatch",
                "Invalid verification code. Please check your email and try again.",
            )
        elif err.error_type == "ExpiredCodeException":
            raise CognitoError(
                "ExpiredCode",
                "Verification code has expired. Please request a new code.",
            )
        else:
            logger.warning(f"ConfirmSignUp failed: {err.error_type} - {err.message}")

    # 2. Try ConfirmForgotPassword
    # Reset internal password to new secure token
    new_password = f"P@{uuid.uuid4().hex[:14]}Bb2!"
    try:
        _call_cognito_api(
            "ConfirmForgotPassword",
            {
                "ClientId": client_id,
                "SecretHash": secret_hash,
                "Username": clean_email,
                "ConfirmationCode": clean_code,
                "Password": new_password,
            },
        )
        return {
            "success": True,
            "email": clean_email,
            "mode": "forgot_password_confirmed",
        }
    except CognitoError as err:
        if err.error_type == "CodeMismatchException":
            raise CognitoError(
                "CodeMismatch",
                "Invalid verification code. Please check your email and try again.",
            )
        if err.error_type == "ExpiredCodeException":
            raise CognitoError(
                "ExpiredCode",
                "Verification code has expired. Please request a new code.",
            )
        if err.error_type == "LimitExceededException":
            raise CognitoError(
                "RateLimitExceeded",
                "Too many attempts. Please request a new code in a few minutes.",
            )
        raise
