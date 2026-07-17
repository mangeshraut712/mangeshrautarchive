"""Canonical public portfolio facts — mirror of src/js/data/portfolio-public-data.js."""

from __future__ import annotations

from typing import Any, Dict

SITE_URL = "https://mangeshraut.pro"

SITE_THEME = {
    "apple_blue": "#0071e3",
    "apple_blue_dark": "#0a84ff",
    "light_surface": "#ffffff",
    "dark_surface": "#000000",
}

SOCIAL_IMAGE = {
    "path": "/assets/images/home.png",
    "url": f"{SITE_URL}/assets/images/home.png",
    "width": 3024,
    "height": 1722,
    "alt": "Mangesh Raut Software Engineer Portfolio",
}

LIGHTHOUSE_DEPLOY_GATES: Dict[str, Dict[str, int]] = {
    "desktop": {"performance": 100, "accessibility": 100, "best_practices": 100, "seo": 100},
    "mobile": {"performance": 100, "accessibility": 100, "best_practices": 100, "seo": 100},
}

LIGHTHOUSE_PAGES_GATES: Dict[str, Dict[str, int]] = {
    "desktop": {"performance": 90, "accessibility": 90, "best_practices": 90, "seo": 90},
    "mobile": {"performance": 85, "accessibility": 90, "best_practices": 90, "seo": 90},
}

TEST_COUNTS = {"vitest": 67, "pytest": 122, "playwright_projects": 15}

WEBMCP_TOOL_COUNT = 10

PWA_POLICY = {
    "installable": True,
    "service_worker_registered": False,
    "offline_mode": "navigation-fallback-only",
    "summary": (
        "Installable via manifest (standalone shortcuts). Service worker registration is "
        "disabled for iOS Safari stability; offline.html is a manual reconnect page, "
        "not a full offline cache."
    ),
}

USES_STACK: Dict[str, list[str]] = {
    "hardware": ["MacBook Pro (Apple Silicon)", "Studio Display", "AirPods Pro"],
    "software": ["macOS", "Raycast", "Arc / Safari", "iTerm"],
    "ai_stack": ["Cursor", "Claude Code", "OpenRouter", "Codex"],
    "engineering": [
        "Vanilla HTML / CSS / ESM",
        "esbuild",
        "FastAPI",
        "Tailwind CSS v4 (generated utilities)",
        "Vercel + GitHub Pages",
        "GitHub Actions",
        "Vitest · pytest · Playwright",
    ],
    "fonts": ["SF Pro", "Inter (fallback)"],
    "theme": ["Solid white/black surfaces", "Apple 2026 design tokens", "Dark / light sync"],
    "productivity": ["Notion", "Linear-style task lists", "GitHub Projects"],
    "reading": ["Technical blogs", "Apple HIG", "AI papers & field notes"],
}


def format_quality_summary() -> str:
    gates = LIGHTHOUSE_DEPLOY_GATES["mobile"]
    return (
        f"{TEST_COUNTS['vitest']} Vitest · {TEST_COUNTS['pytest']} pytest · "
        f"{TEST_COUNTS['playwright_projects']} Playwright projects · "
        f"Lighthouse deploy gate {gates['performance']}/{gates['accessibility']}/"
        f"{gates['best_practices']}/{gates['seo']} (dist homepage)"
    )


def get_portfolio_facts_chunk() -> str:
    """Compact first-party facts for AssistMe site knowledge injection."""
    mobile = LIGHTHOUSE_DEPLOY_GATES["mobile"]
    uses_lines = []
    for category, items in USES_STACK.items():
        label = category.replace("_", " ").title()
        uses_lines.append(f"{label}: {', '.join(items)}")
    return (
        f"Public portfolio facts ({SITE_URL}):\n"
        f"- Quality: {format_quality_summary()}\n"
        f"- Live Pages monitoring floors (mobile perf min): "
        f"{LIGHTHOUSE_PAGES_GATES['mobile']['performance']}+ "
        f"(see npm run qa:lighthouse:ci)\n"
        f"- WebMCP browser tools: {WEBMCP_TOOL_COUNT}\n"
        f"- PWA: {PWA_POLICY['summary']}\n"
        f"- Uses stack:\n  "
        + "\n  ".join(uses_lines)
    )


def get_portfolio_facts_dict() -> Dict[str, Any]:
    return {
        "site_url": SITE_URL,
        "theme": SITE_THEME,
        "social_image": SOCIAL_IMAGE,
        "lighthouse_deploy_gates": LIGHTHOUSE_DEPLOY_GATES,
        "lighthouse_pages_gates": LIGHTHOUSE_PAGES_GATES,
        "test_counts": TEST_COUNTS,
        "webmcp_tool_count": WEBMCP_TOOL_COUNT,
        "pwa_policy": PWA_POLICY,
        "uses_stack": USES_STACK,
        "quality_summary": format_quality_summary(),
    }
