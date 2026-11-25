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


def _base_cognito_payload(username: str) -> Dict[str, Any]:
    """Build base Cognito payload with ClientId and optional SecretHash."""
    if not settings.COGNITO_APP_CLIENT_ID:
        raise CognitoError(
            "ConfigurationError", "COGNITO_APP_CLIENT_ID must be configured"
        )

    payload: Dict[str, Any] = {
        "ClientId": settings.COGNITO_APP_CLIENT_ID,
        "Username": username,
    }
    if settings.COGNITO_CLIENT_SECRET:
        payload["SecretHash"] = calculate_secret_hash(username)
    return payload


def _call_cognito_api(target: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """Call an AWS Cognito Identity Provider API action using urllib."""
    region = settings.COGNITO_REGION or "us-east-1"
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
            raw_type = str(err_json.get("__type", "UnknownError"))
            err_type = raw_type.split("#")[-1]
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
    If user already exists and is confirmed, triggers ForgotPassword.
    If user already exists but is unconfirmed, falls back to ResendConfirmationCode.
    """
    clean_email = email.strip().lower()
    base_payload = _base_cognito_payload(clean_email)

    # 1. Attempt SignUp first (for first-time users)
    # Use a secure strong auto-generated password so the user never has to set or remember one
    temp_password = f"P@{uuid.uuid4().hex[:14]}Aa1!"
    signup_payload = {
        **base_payload,
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
    try:
        res = _call_cognito_api("ForgotPassword", dict(base_payload))
        delivery = res.get("CodeDeliveryDetails", {})
        destination = delivery.get("Destination", clean_email)
        return {
            "success": True,
            "is_new_user": False,
            "destination": destination,
            "message": f"Verification code sent to {destination}",
        }
    except CognitoError as err:
        if err.error_type == "InvalidParameterException":
            # Existing unconfirmed user has no verified email yet -> resend confirmation code
            logger.info(
                f"ForgotPassword failed with InvalidParameterException for {clean_email}, trying ResendConfirmationCode"
            )
            res = _call_cognito_api("ResendConfirmationCode", dict(base_payload))
            delivery = res.get("CodeDeliveryDetails", {})
            destination = delivery.get("Destination", clean_email)
            return {
                "success": True,
                "is_new_user": True,
                "destination": destination,
                "message": f"Verification code sent to {destination}",
            }
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
    base_payload = _base_cognito_payload(clean_email)

    signup_err: CognitoError | None = None

    # 1. Try ConfirmSignUp (if newly registered / unconfirmed)
    try:
        _call_cognito_api(
            "ConfirmSignUp",
            {
                **base_payload,
                "ConfirmationCode": clean_code,
            },
        )
        return {"success": True, "email": clean_email, "mode": "signup_confirmed"}
    except CognitoError as err:
        if err.error_type == "LimitExceededException":
            raise CognitoError(
                "RateLimitExceeded",
                "Too many attempts. Please request a new code in a few minutes.",
            )
        signup_err = err
        logger.info(
            f"ConfirmSignUp did not complete ({err.error_type}), trying ConfirmForgotPassword"
        )

    # 2. Try ConfirmForgotPassword (existing confirmed user)
    # Reset internal password to new secure token
    new_password = f"P@{uuid.uuid4().hex[:14]}Bb2!"
    try:
        _call_cognito_api(
            "ConfirmForgotPassword",
            {
                **base_payload,
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
        if err.error_type == "CodeMismatchException" or (
            signup_err and signup_err.error_type == "CodeMismatchException"
        ):
            raise CognitoError(
                "CodeMismatch",
                "Invalid verification code. Please check your email and try again.",
            )
        if err.error_type == "ExpiredCodeException" or (
            signup_err and signup_err.error_type == "ExpiredCodeException"
        ):
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
