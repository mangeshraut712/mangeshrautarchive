"""PAT must only authenticate requests for the portfolio owner."""

from api.integrations.github_connector import GitHubConnector


def test_headers_for_username_attach_pat_only_for_owner(monkeypatch):
    monkeypatch.setenv("GITHUB_PAT", "secret-pat")
    monkeypatch.delenv("GITHUB_TOKEN", raising=False)
    connector = GitHubConnector()
    owner_headers = connector._headers_for_username("mangeshraut712")
    other_headers = connector._headers_for_username("octocat")
    assert owner_headers.get("Authorization") == "token secret-pat"
    assert "Authorization" not in other_headers
