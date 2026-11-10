# Product Taxonomy

## Purpose
This document defines how the supplied category and tag lists are used during initial catalog setup.

## Source files
- `categories(1).txt` supplied by the project owner
- `Tags(1).txt` supplied by the project owner

## Import policy
- Preserve source display names.
- Trim leading/trailing whitespace.
- Generate lowercase URL slugs with hyphens.
- Detect duplicates case-insensitively.
- Do not silently merge similar terms.
- Record ambiguous terms for manual review.
- Do not assume every tag is a top-level category.
- Categories and tags are separate entities and can overlap conceptually.
- Seed scripts must be repeatable (upsert by stable slug).

## Category list from supplied file
- Productivity
- Marketing
- Design
- Developer Tools
- AI
- Business
- Education
- Mac App
- Social
- Finance
- Video
- E-Commerce
- Lifestyle
- Career
- Audio
- Sales
- Writing
- Directory
- Image
- API
- Customer Support
- Analytics
- Legal
- Health
- Research
- SEO
- Automation
- HR
- Security
- App
- Developer Tool
- Meditation
- PropTech
- Real Estate
- Human Resources
- Marketplace
- Newsletter
- No Code
- Visualization

## Tag list
The full initial tag list is maintained in the supplied `Tags(1).txt` file. Import that file through `scripts/import_tags.py`; do not manually recreate or shorten it. Preserve all source entries, including multi-word labels and capitalization, while normalizing slugs.

## Review notes
The source lists contain potentially overlapping terms (for example, Developer Tools / Developer Tool, HR / Human Resources, E-Commerce / eCommerce, App / iOS App / Mac App). Keep source values intact in the raw import, then decide canonical relationships through an explicit taxonomy review.
