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
    tool_name: str = "Your AI Tool",
    tool_slug: Optional[str] = None,
) -> Optional[dict]:
    """Send an email notification about a submission status.

    Triggers:
    - "received": When a new submission is received
    - "approved": When a submission is approved and published live
    - "rejected": When a submission is rejected with editorial feedback
    """
    if not RESEND_API_KEY:
        # If Resend key not set, log and skip (expected in development)
        print(f"[Email notification] Submission {submission_id} ({tool_name}): {status} to {vendor_email}")
        return None

    try:
        site_origin = get_site_origin()
        slug = tool_slug or submission_id
        live_url = f"{site_origin}/tools/{slug}"
        badge_code = f'&lt;a href="{live_url}?utm_source=badge" target="_blank"&gt;&lt;img src="{site_origin}/badges/featured-badge.svg" alt="Featured on AIToolsFinder" /&gt;&lt;/a&gt;'

        # Determine email template based on status
        if status == "received":
            subject = f"We received {tool_name}! Our editorial team is reviewing it"
            html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1722;">
                <h1 style="color: #7022fc; margin-bottom: 16px;">We received {tool_name}!</h1>
                <p style="font-size: 16px; line-height: 1.6;">Thank you for submitting <strong>{tool_name}</strong> to AIToolsFinder.cloud.</p>
                <p style="font-size: 15px; line-height: 1.6; color: #555;">Our editorial team is reviewing your product details, pricing tiers, and capability claims against our independent catalog standards.</p>
                <div style="background: #f7f5fa; border: 1px solid #e0d8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
                    <p style="margin: 0; font-size: 14px;"><strong>Submission Reference:</strong> {submission_id}</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Estimated Review Time:</strong> 1–3 business days (24–48 hours for fast-track)</p>
                </div>
                <p style="font-size: 14px; color: #666;">We will notify you by email as soon as your product profile is live.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 13px; color: #888;">AIToolsFinder.cloud · The Ground-Truth AI Intelligence Directory</p>
            </div>
            """
        elif status == "approved":
            subject = f"Congratulations! {tool_name} is now live on AIToolsFinder.cloud"
            html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1722;">
                <h1 style="color: #7022fc; margin-bottom: 16px;">Congratulations! {tool_name} is Live 🎉</h1>
                <p style="font-size: 16px; line-height: 1.6;">Your tool submission has passed our editorial quality review and is now live on AIToolsFinder.cloud.</p>
                <div style="margin: 24px 0;">
                    <a href="{live_url}" style="background: #7022fc; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 15px; display: inline-block;">
                        View Live Product Profile →
                    </a>
                </div>
                <h3 style="margin-top: 28px; color: #1a1722;">Embed the Official "Featured on AIToolsFinder" Badge</h3>
                <p style="font-size: 14px; line-height: 1.5; color: #555;">Add this badge to your homepage or footer to signal independent verification to your visitors:</p>
                <pre style="background: #f4f3f8; border: 1px solid #ddd; border-radius: 8px; padding: 12px; font-size: 12px; overflow-x: auto;"><code>{badge_code}</code></pre>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 13px; color: #888;">AIToolsFinder.cloud · The Ground-Truth AI Intelligence Directory</p>
            </div>
            """
        elif status == "rejected":
            subject = f"Editorial update regarding {tool_name} on AIToolsFinder.cloud"
            html = f"""
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1a1722;">
                <h1 style="color: #333; margin-bottom: 16px;">Editorial Review Update</h1>
                <p style="font-size: 16px; line-height: 1.6;">Thank you for your submission of <strong>{tool_name}</strong> to AIToolsFinder.cloud.</p>
                <p style="font-size: 15px; line-height: 1.6; color: #555;">Our editorial team was unable to publish this listing at this time. Common reasons include unavailable pricing documentation, non-HTTPS product domains, or incomplete feature specifications.</p>
                <p style="font-size: 14px; color: #666;">If you have updated your product details or believe this was an error, please reply directly to this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
                <p style="font-size: 13px; color: #888;">AIToolsFinder.cloud Editorial Team</p>
            </div>
            """
        else:
            subject = f"Submission Update for {tool_name}"
            html = f"<p>Your submission for {tool_name} (ID: {submission_id}) has been updated.</p>"

        params: resend.Emails.SendParams = {
            "from": "AIToolsFinder.cloud <notifications@aitoolsfinder.cloud>",
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