"""Resend email service for Phase 7: Submission notifications and email triggers."""

import os
from typing import Optional
from datetime import datetime

import resend


# Initialize Resend API key from environment
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY


def get_supabase_url() -> str:
    """Get the Supabase URL for generating links in emails."""
    return os.getenv("SUPABASE_URL", "https://aitoolsfinder.cloud")


def get_site_origin() -> str:
    """Get the site origin for generating links."""
    return os.getenv("APP_ORIGIN", "https://aitoolsfinder.cloud")


async def send_submission_email(
    submission_id: str,
    vendor_email: str,
    status: str,
) -> Optional[dict]:
    """Send an email notification about a submission status.

    Triggers:
    - "received": When a new submission is received
    - "approved": When a submission is approved and published
    - "rejected": When a submission is rejected
    """
    if not RESEND_API_KEY:
        # If Resend key not set, log and skip (expected in development)
        print(f"[Email skipped - Resend key not set] Submission {submission_id}: {status} to {vendor_email}")
        return None

    try:
        site_origin = get_site_origin()

        # Determine email template based on status
        if status == "received":
            subject = "Your AI Tool Submission Has Been Received"
            html = f"""
            <h1>Your AI Tool Submission Has Been Received</h1>
            <p>Thank you for submitting your tool to AIToolsFinder.cloud.</p>
            <p>Your submission (ID: {submission_id}) is now in the admin review queue.</p>
            <p>You can check the status of your submission at: <a href="{site_origin}/submissions">{site_origin}/submissions</a></p>
            <p>We'll review your submission and notify you of the decision within 3-5 business days.</p>
            <hr />
            <p>Best regards,<br/>AIToolsFinder.cloud Team</p>
            """
        elif status == "approved":
            subject = "Your AI Tool Has Been Approved!"
            html = f"""
            <h1>Your AI Tool Has Been Approved!</h1>
            <p>Congratulations! Your tool submission has been approved and is now live on AIToolsFinder.cloud.</p>
            <p>View your published tool: <a href="{site_origin}/tools/{submission_id}">{site_origin}/tools/{submission_id}</a></p>
            <p>Your tool will now be visible to our growing community of users seeking AI tools.</p>
            <hr />
            <p>Best regards,<br/>AIToolsFinder.cloud Team</p>
            """
        elif status == "rejected":
            subject = "Submission Update - AIToolsFinder.cloud"
            html = f"""
            <h1>Submission Update</h1>
            <p>We've reviewed your submission (ID: {submission_id}), but we're unable to approve it at this time.</p>
            <p>We appreciate your effort in submitting your tool to our platform.</p>
            <p>If you have questions or would like to make revisions, please reply to this email.</p>
            <hr />
            <p>Best regards,<br/>AIToolsFinder.cloud Team</p>
            """
        else:
            subject = "Submission Update"
            html = f"<p>Your submission (ID: {submission_id}) has been updated.</p>"

        params: resend.Emails.SendParams = {
            "from": "AIToolsFinder.cloud <no-reply@aitoolsfinder.cloud>",
            "to": [vendor_email],
            "subject": subject,
            "html": html,
        }

        # Send the email
        result = resend.Emails.send(params)
        return result

    except Exception as e:
        print(f"[Email error] Submission {submission_id}: {str(e)}")
        return None