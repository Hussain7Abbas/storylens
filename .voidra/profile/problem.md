---
{
  block: problem,
  title: Problem and outcome,
  answers:
    [
      {
          id: goal,
          question: What should this project make possible?,
          answer: "Help English- and Arabic-speaking web-novel readers understand and
            personalize chapters through keyword highlighting, aliases and
            chapter-specific character versions, replacements, chapter
            detection, summaries and character artwork. Support lens-funded
            Story Lens Cloud or a free desktop companion using the reader's own
            AI CLI accounts, with a shared API, account website and
            administration dashboard.",
          status: confirmed,
          source: docs/intro.md:3; README.md:8; README.md:15,
          updatedAt: 2026-10-18T14:05:41.783Z,
          confirmedBy: You
        },
      {
          id: workflow,
          question: "How is this work done today, and where does it break down?",
          answer: "The observed workflow is to read a novel on a third-party site, manage
            its keywords and replacements in the extension, and apply reading
            features through content scripts. Downloaded novel data and pending
            edits live locally and synchronize through the backend. Readers
            explicitly choose Cloud or Desktop separately for text and images;
            Cloud requires a registered account and lenses, while Desktop
            requires a running, paired companion and signed-in provider CLI.
            Missing offline storage falls back to online-only mode. The
            repository does not establish the pre-product manual workflow or
            measured pain points.",
          status: confirmed,
          source: docs/extension.md:7; docs/extension.md:9;
            apps/extension/src/lib/offline/db.ts:19;
            apps/extension/src/lib/offline/db.ts:70,
          updatedAt: 2026-10-18T14:05:43.218Z,
          confirmedBy: You
        }
    ]
}
---
