"""Vendor submissions module for Phase 7: Monetization."""

from .router import router
from .schemas import (
    SubmissionCreate,
    SubmissionApprove,
    SubmissionReject,
    SubmissionRead,
    SubmissionListItem,
    AffiliateLinkCreate,
    AffiliateLinkRead,
    OutboundClickCreate,
    OutboundClickRead,
    PaymentEventCreate,
    PaymentEventRead,
    SubscriptionRead,
)
from .models import (
    VendorModel,
    ToolSubmissionModel,
    AffiliateLinkModel,
    OutboundClickModel,
    PaymentEventModel,
    SubscriptionModel,
    tool_submission_tags,
    tool_submission_features,
)
from src.modules.notifications.service import send_submission_email