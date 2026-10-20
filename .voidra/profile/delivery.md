---
{
  block: delivery,
  title: Runtime and delivery,
  answers:
    [
      {
          id: platform,
          question: Where will the project run?,
          answer: "Chrome/Firefox browser extension; macOS, Windows and Linux desktop
            companion; hosted Bun API with PostgreSQL; static website and admin
            web dashboard.",
          status: confirmed,
          source: docs/extension.md:7; docs/client.md:5; docs/backend.md:5;
            docs/website.md:5; docs/dashboard.md:5,
          updatedAt: 2026-10-18T14:05:35.361Z,
          confirmedBy: You
        },
      {
          id: distribution,
          question: How will the first version be deployed or distributed?,
          answer: "The existing delivery model uses WXT extension builds/ZIPs with Chrome
            Web Store publication and Firefox build targets. Electron Builder
            produces macOS x64/arm64 DMGs, Windows x64 NSIS installers and Linux
            x64 AppImage/deb packages, distributed through GitHub release
            workflows; packaged desktop use still requires a provider CLI and
            sign-in. The backend runs under PM2 with Make-controlled deployment
            and Prisma migrations; backend deployment waits for the matching
            published extension version and then triggers dashboard deployment.
            Website and dashboard build static files served by separate Nginx
            deployments. Root xeploy coordinates app releases, and releases run
            only when explicitly requested.",
          status: confirmed,
          source: apps/extension/package.json:9; docs/client.md:23; docs/client.md:53;
            docs/backend.md:87; docs/website.md:61; docs/website.md:63;
            docs/dashboard.md:5; AGENTS.md:48,
          updatedAt: 2026-10-18T14:05:37.010Z,
          confirmedBy: You
        }
    ]
}
---
