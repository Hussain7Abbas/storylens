---
{
  id: act-ht4jes,
  title: Reconcile legacy implementation trackers with committed repository state,
  targetRelease,
  taskColumn: backlog,
  type: docs,
  stage: implement,
  status: ready,
  doneBy: agent,
  createdBy: Hussain Abbas <hussain.jazing.21@gmail.com>,
  createdAt: 2026-10-18T14:14:41.442Z,
  links:
    [
      commit:258075dc5a3a1853833b8e274b9c94960a42045f,
      commit:f892c209c6c08f49a67e2d7939661c7bf0519994,
      commit:1192a82b279470870e7d16f71cb550e7cf53742e,
      commit:452e1390a44b47179d7228f7ffc9bba2442a125b,
      commit:1f62c54ed8d970a4148b4f408a31c373b5da1a79
    ],
  updatedAt: 2026-10-18T14:26:07.754Z
}
---
Observed: docs/intro.md still describes Cloud/lens implementation as uncommitted and the offline refactor as unreleased; pricing-plan/main.md still says phases 1–8 and 12 are uncommitted, targets 3.4.0 and references review-handoff-lenses-phases-1-7.md, which f892c209 deleted. website-plan/main.md still says launch awaits a contact address, while 1192a82b records the approved contact and live website, and 452e1390 records domain verification. Current umbrella release-pointer commits reach 3.9.0. These are inconsistencies in planning/documentation status, not proof that every owner release check was completed.

Proposed scope: reconcile status summaries and broken handoff links in docs/intro.md, pricing-plan/main.md, offline-first-refactor-plan/main.md and website-plan/main.md; review linked phase files and docs/changelog/README.md for matching historical/current-state labels. Preserve historical decisions and dated verification evidence. Use Git/tag/submodule evidence to distinguish committed or merged implementation from deployment, store publication, legal approval, native-language review and manual acceptance. Keep unsupported owner checks open or explicitly unverified, and retain their existing canonical checklists instead of duplicating them as new implementation tasks. Do not alter confirmed profile answers or infer approval.

Acceptance for a future approved task: status claims cite the relevant repository revision/date; links resolve or are clearly identified as historical; committed work is no longer called an uncommitted working tree; current-state summaries agree with authoritative app/docs behavior while unknown live state remains unknown. This is a proposal only; do not queue or execute it during Sync.
