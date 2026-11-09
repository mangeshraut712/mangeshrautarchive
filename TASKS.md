# Maintenance roadmap

Reviewed November 9, 2026. Completed work and dated verification live in [PROGRESS.md](PROGRESS.md) and [QA records](docs/qa/). The [previous roadmap](docs/history/2026-11-09-tasks.md) is preserved for context.

## Ongoing work

- Measure normal-load homepage and Contact performance on mobile and desktop with raw Lighthouse/PageSpeed reports. Preserve the design and analytics; do not substitute the reduced CI audit mode for user-facing performance evidence.
- Verify device-dependent dictation and read-aloud on physical Safari/iOS hardware. Automated WebKit layout coverage does not establish microphone or OS speech availability.
- Keep provider availability, free-tier limits, live integrations, and model-routing documentation aligned with observed behavior. Cloud TTS and funded provider paths need separate live verification.
- Refresh GitHub and other public data through their generators. Review automation branches before merging; never restore an older snapshot over a newer one.
- Revisit article sources and image provenance when upstream publications change. Preserve original publication dates and record editorial review dates separately.

## For each release

1. Implement a focused change and document its real behavior.
2. Update the changelog, contributor attribution, and affected operating guides.
3. Run the release checks in [CONTRIBUTING.md](CONTRIBUTING.md); inspect responsive UI changes in light and dark modes.
4. Verify Actions, Pages commit parity, and relevant security findings after the push.
5. Remove only reviewed, merged branches and task-owned temporary processes. Preserve other contributors’ worktrees and local changes.
