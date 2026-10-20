# omniroute-service

OmniRoute AI Gateway deployment for Semanty and Easy GPU.

## Open access

This deployment opens the dashboard without a password or OAuth login and accepts
inference requests without an OmniRoute client API key. Its public URL also makes
the dashboard available to anyone who has that URL.

At startup, `OMNIROUTE_OPEN_ACCESS=true` applies the upstream
`settings.requireLogin=false`, `settings.setupComplete=true`, and
`feature_flags.REQUIRE_API_KEY=false` settings. This is applied on each boot so a
fresh Render filesystem does not bring the login prompt back. Existing provider
connections, credentials, and unrelated settings are preserved.

To require gateway authentication again, set `OMNIROUTE_OPEN_ACCESS=false`,
configure an administrator password, and redeploy.

These settings control access to OmniRoute itself. Models from providers that
require an account still need a connected account; removing gateway login does
not grant upstream model access. Anonymous providers may be used without an
upstream login or API key, subject to their availability and limits.

The official OmniRoute launcher retains responsibility for ports, memory limits,
and shutdown signals. Easy GPU keeps its separate administrator login for PC
command access.

Run the startup configuration checks with:

```sh
node --test tests/configure-access.test.mjs
```
