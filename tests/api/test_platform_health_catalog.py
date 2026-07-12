"""Portfolio catalog definitions for the system monitor."""

from api.platform_health import PORTFOLIO_API_CATALOG, PORTFOLIO_PAGE_CATALOG


def test_portfolio_page_catalog_covers_core_surfaces():
    paths = {entry["path"] for entry in PORTFOLIO_PAGE_CATALOG}
    assert "/" in paths
    assert "/systems" in paths
    assert "/monitor" in paths
    assert "/travel" in paths
    assert "/uses" in paths
    assert "/manifest.json" in paths
    assert "/build-config.json" in paths


def test_portfolio_api_catalog_covers_critical_routes():
    paths = {entry["path"] for entry in PORTFOLIO_API_CATALOG}
    assert "/api/health" in paths
    assert "/api/monitor/status" in paths
    assert "/api/chat/health" in paths
    assert "/api/monitor/portfolio-catalog" in paths
    assert any(p.startswith("/api/github") for p in paths)
    assert any("music" in p for p in paths)
