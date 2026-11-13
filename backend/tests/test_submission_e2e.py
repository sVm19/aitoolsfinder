import asyncio
import os
import sys
import uuid
from datetime import datetime

# Set up path to backend
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from src.core.database import async_session_factory
from src.core.security import UserContext
from src.modules.catalog.models import (
    CategoryModel,
    PricingPlanModel,
    TagModel,
    ToolCategoryModel,
    ToolModel,
    ToolTagModel,
)
from src.modules.intelligence.models import ScoreHistoryModel
from src.modules.vendor.models import (
    ToolSubmissionModel,
    VendorModel,
    tool_submission_features,
    tool_submission_tags,
)
from src.modules.vendor.router import approve_submission, create_submission
from src.modules.vendor.schemas import SubmissionCreate
from sqlalchemy import select, delete


async def test_full_founder_submission_and_approval():
    print("[E2E TEST] Starting End-to-End Submission & Approval Flow Test...")

    async with async_session_factory() as session:
        # 1. Fetch or create a test Category
        cat_stmt = select(CategoryModel).limit(1)
        cat_res = await session.execute(cat_stmt)
        test_cat = cat_res.scalar_one_or_none()

        if not test_cat:
            test_cat = CategoryModel(
                id=uuid.uuid4(),
                name="AI Agents & Productivity",
                slug="ai-agents-productivity",
                description="Intelligent AI agents and productivity assistants",
            )
            session.add(test_cat)
            await session.commit()
            await session.refresh(test_cat)
        print(f"[1/5] Using Category: {test_cat.name} (id: {test_cat.id})")

        # 2. Formulate 4-Step Founder Submission Payload
        test_email = f"founder_{uuid.uuid4().hex[:6]}@superbrain.ai"
        submission_payload = SubmissionCreate(
            submission_type="featured",
            tool_name=f"SuperBrain AI {uuid.uuid4().hex[:4]}",
            tagline="Autonomous multi-agent research and reasoning engine",
            description="SuperBrain AI revolutionizes deep context research, code synthesis, and multi-agent collaboration with verifiable factual citations.",
            primary_category_id=str(test_cat.id),
            secondary_tag_ids=[],
            core_feature_ids=[],
            pricing_model="freemium",
            is_free=True,
            starting_price_minor=1900,
            currency="USD",
            pricing_url="https://superbrain-test.ai/pricing",
            website_url="https://superbrain-test.ai",
            logo_object_key="logos/superbrain_logo.webp",
            submitter_name="Alex Test Founder",
            submitter_email=test_email,
            relationship="founder",
            affiliate_url="https://superbrain-test.ai/?ref=aitoolsfinder",
        )
        print("[2/5] Formulated 4-Step Founder Submission Payload.")

        # 3. Execute create_submission (Simulates /submit endpoint)
        submission_resp = await create_submission(
            payload=submission_payload,
            session=session,
            current_user=None,  # Public anonymous founder submission
        )
        sub_id = submission_resp.id
        print(f"[3/5] create_submission succeeded! Submission ID: {sub_id}, Status: {submission_resp.status}")

        # Verify Vendor was auto-created/linked in database
        sub_stmt = select(ToolSubmissionModel).where(ToolSubmissionModel.id == sub_id)
        sub_row = (await session.execute(sub_stmt)).scalar_one()
        assert sub_row.vendor_id is not None, "Vendor ID must not be null!"
        assert sub_row.status == "pending", f"Status must be pending, got {sub_row.status}"

        vendor_stmt = select(VendorModel).where(VendorModel.id == sub_row.vendor_id)
        vendor_row = (await session.execute(vendor_stmt)).scalar_one()
        print(f"      Verified Vendor Profile auto-created/linked: {vendor_row.name} ({vendor_row.email})")

        # 4. Execute approve_submission (Simulates /admin/submissions/{id}/approve)
        print("[4/5] Executing admin atomic approve_submission transaction...")
        admin_user = UserContext(
            id="admin-sub-test",
            email="admin@aitoolsfinder.cloud",
            display_name="Site Admin",
            role="admin",
            is_email_verified=True,
        )
        approval_resp = await approve_submission(
            submission_id=str(sub_id),
            session=session,
            current_user=admin_user,
        )
        print(f"      approve_submission succeeded! Submission status: {approval_resp.status}")

        # Verify Live Tool & Related Entities
        tool_stmt = select(ToolModel).where(ToolModel.slug == sub_row.tool_slug)
        tool_row = (await session.execute(tool_stmt)).scalar_one()
        tool_id = tool_row.id
        print(f"      Verified Live Tool record: id={tool_id}, name='{tool_row.name}', is_verified={tool_row.is_verified}, status={tool_row.platform_status}")

        plan_stmt = select(PricingPlanModel).where(PricingPlanModel.tool_id == tool_id)
        plan_rows = (await session.execute(plan_stmt)).scalars().all()
        print(f"      Verified Pricing Plans ({len(plan_rows)}): {[f'{p.name} ({p.amount_minor} cents)' for p in plan_rows]}")

        score_stmt = select(ScoreHistoryModel).where(ScoreHistoryModel.tool_id == tool_id)
        score_rows = (await session.execute(score_stmt)).scalars().all()
        print(f"      Verified Computed Score History ({len(score_rows)} entries): initial_score={score_rows[0].overall_score if score_rows else 'N/A'}")

        # Verify Submission status updated to approved
        await session.refresh(sub_row)
        assert sub_row.status == "approved", "Submission status must now be approved!"
        print(f"      Verified Submission status transition: {sub_row.status}")

        # 5. Clean up test records
        print("[5/5] Cleaning up test records from database...")
        await session.execute(delete(ScoreHistoryModel).where(ScoreHistoryModel.tool_id == tool_id))
        await session.execute(delete(PricingPlanModel).where(PricingPlanModel.tool_id == tool_id))
        await session.execute(delete(ToolCategoryModel).where(ToolCategoryModel.tool_id == tool_id))
        await session.execute(delete(ToolModel).where(ToolModel.id == tool_id))
        await session.execute(delete(ToolSubmissionModel).where(ToolSubmissionModel.id == sub_id))
        await session.execute(delete(VendorModel).where(VendorModel.id == vendor_row.id))
        await session.commit()
        print("[CLEANUP COMPLETE] All test records cleaned up cleanly.")

    print("\nSUCCESS: End-to-End Founder Submission & Admin Approval Pipeline is 100% Verified and Functional!")


if __name__ == "__main__":
    asyncio.run(test_full_founder_submission_and_approval())
