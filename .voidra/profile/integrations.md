---
{
  block: integrations,
  title: External systems,
  answers:
    [
      {
          id: systems,
          question: "Which external systems must it connect to, and how is access
            controlled?",
          answer:
            [
              "Reader clients and dashboard call the Story Lens API through
                separate user/admin portals with session and route-permission
                checks; website sessions use an origin-restricted HttpOnly
                cookie, other clients use bearer tokens.",
              Cloud AI uses backend-managed OpenRouter access and
                feature-specific pricing/limits; novel research uses the
                configured search integration. Models and feature prices are
                administered in the dashboard rather than selected by a model
                environment variable.,
              "Desktop invokes locally installed Claude Code, Codex and Gemini
                CLIs using their existing sign-ins; callers pair with a random
                bearer token on a loopback HTTP service with Host and Origin
                checks. Desktop image generation uses Codex.",
              Better Auth integrates optional Google OAuth; Resend handles
                transactional verification and billing email using server
                configuration.,
              ImgBB stores uploaded images through server-side configured API
                access.,
              Chrome Web Store and GitHub workflows coordinate extension
                publication and backend/dashboard deployment; native desktop
                artifacts are attached to GitHub Releases.,
              Optional Google Analytics 4 is consent-gated; website analytics
                are off by default.
            ],
          status: confirmed,
          source: docs/backend.md:11; docs/backend.md:87; docs/backend.md:93;
            docs/backend.md:120; docs/dashboard.md:17;
            apps/client/src/server.ts:20;
            apps/backend/src/lib/email/index.ts:11;
            apps/backend/src/lib/storage/helpers.ts:12; docs/client.md:53;
            docs/website.md:57,
          updatedAt: 2026-10-18T14:05:40.306Z,
          confirmedBy: You
        }
    ]
}
---
