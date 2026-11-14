"""Email notification service supporting both Hostinger SMTP and Resend."""

import asyncio
import logging
import smtplib
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import resend
from src.core.config import settings

logger = logging.getLogger(__name__)


def get_site_origin() -> str:
    """Get the site origin for generating links."""
    return "https://aitoolsfinder.cloud"


def _send_smtp_sync(to_email: str, subject: str, html_content: str) -> dict:
    """Send an email synchronously using standard SMTP."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AIToolsFinder <{settings.EMAIL_FROM}>"
    msg["To"] = to_email

    part = MIMEText(html_content, "html")
    msg.attach(part)

    host = settings.SMTP_HOST or "smtp.hostinger.com"
    port = settings.SMTP_PORT or 465

    if settings.SMTP_USE_SSL:
        with smtplib.SMTP_SSL(host, port, timeout=10.0) as server:
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(host, port, timeout=10.0) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.EMAIL_FROM, [to_email], msg.as_string())

    return {"status": "sent", "provider": "smtp"}


async def send_email(to_email: str, subject: str, html: str) -> Optional[dict]:
    """Send an email via Hostinger SMTP or Resend depending on configuration."""
    if settings.SMTP_HOST and settings.SMTP_USER:
        try:
            return await asyncio.to_thread(_send_smtp_sync, to_email, subject, html)
        except Exception as exc:
            logger.error(f"[Email error SMTP] Failed sending to {to_email}: {exc}")
            return None

    if settings.RESEND_API_KEY:
        try:
            resend.api_key = settings.RESEND_API_KEY
            params: resend.Emails.SendParams = {
                "from": f"AIToolsFinder.cloud <{settings.EMAIL_FROM}>",
                "to": [to_email],
                "subject": subject,
                "html": html,
            }
            return resend.Emails.send(params)
        except Exception as exc:
            logger.error(f"[Email error Resend] Failed sending to {to_email}: {exc}")
            return None

    # Development fallback
    logger.info(f"[Email simulation] To: {to_email} | Subject: {subject}")
    return None


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
    site_origin = get_site_origin()
    slug = tool_slug or submission_id
    live_url = f"{site_origin}/tools/{slug}"
    badge_code = f'&lt;a href="{live_url}?utm_source=badge" target="_blank"&gt;&lt;img src="{site_origin}/badges/featured-badge.svg" alt="Featured on AIToolsFinder" /&gt;&lt;/a&gt;'

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

    return await send_email(vendor_email, subject, html)
