# Phase 8 — Offline image uploads

[Global tracker](main.md) · **Status: In review (implemented 2026-09-30)** · **Estimate: 3 points** · **Depends on: 6** · **Ships in: the offline-first release (branch `feature/offline-v2`; decision D3)**

## Goal

A reader can attach or generate a character image while offline and save. The image is kept on the device, uploaded first when the connection returns, and then linked to the keyword, alias or version. Today an attached or generated image makes the whole save fail offline (U6).

**Closes:** U6.

## Tasks

### 8.1 Backend

- [x] `POST /api/user/files/upload` requires a multipart field `id` (UUID). Only the extension calls this route; the dashboard uses `/api/admin/files/upload`.
  - A file row with that `id` and the same `userId` returns it without uploading again (a replay).
  - A row with that `id` for another user answers 409 `ID_CONFLICT`.
  - Otherwise the row is created with that `id`.
- [x] `saveUploadedFile` stores `userId: authedUser.id` on new rows (the column exists and is optional; old rows stay `null`).
- [x] Tests: a replay does not call the storage provider (mock `uploadImage`); `ID_CONFLICT`; a missing `id` answers 422.

### 8.2 Extension store

- [x] Rows in the `files` table (created in phase 3): `{ id, mutationId, blob, name, type, size, createdAt }`. `unlimitedStorage` is already granted.
- [x] `enqueue` accepts an optional image `File`:
  1. It writes a `file` mutation (entity `file`, op `create`) and the blob in the same transaction.
  2. It sets `imageId = fileId` in the entity mutation's patch.
  3. It adds `fileId` to `dependsOn`.
- [x] Limits checked at enqueue:
  - 10 MB per image, rejected with a localized message;
  - a warning when queued images exceed 200 MB in total.
- [x] Coalescing: replacing the image of an entity whose earlier `file` mutation is unsent drops the older blob.

### 8.3 Transport and outcomes

- [x] The `file` create sends `FormData` (`file`, `type: "Image"` and `id`), with a 60 s timeout.
- [x] On success:
  - remove the blob and the mutation;
  - the file keeps its client ID, so dependants need no rewriting.
- [x] A discard of the file mutation, or of its only dependant, removes the blob.
- [x] On worker startup, sweep blobs whose mutation no longer exists.

### 8.4 Views and UI

- [x] The popup view shows pending images through object URLs created in the popup (revoked on unmount), with a "Waiting to upload" badge.
- [x] Page tooltips skip images that are not uploaded yet. Blob URLs from the extension origin cannot be loaded by the page, and inlining data URLs would bloat messages.
- [x] Forms allow image selection and **Generate image** while offline, and saving never waits for an upload. Generating still needs the desktop client and its own connection, but the result is queued like any file.

## Tests

| # | Test | Expected |
| --- | --- | --- |
| 1 | Offline keyword create with an image, then a run | Upload first, then `POST /keywords` with the uploaded ID; blob removed |
| 2 | Upload response lost, then replay | Backend returns the same file; the provider was called once |
| 4 | Image replaced twice before syncing | Only the last blob is uploaded |
| 5 | Discard the keyword mutation | File mutation and blob removed |
| 6 | 12 MB image | Refused at enqueue; nothing written |
| 7 | Orphan blob at startup | Removed |

Manual: attach an image offline, close the browser, reopen online. The image uploads and appears on the keyword; the popup showed the pending image meanwhile.

## Exit criteria

- [x] Tests pass in both submodules; typecheck passes in all five; `make orval` regenerated the client for the new upload field.
- [x] No blob stays in `files` after its mutation resolves (checked by test 5 and the sweep).

## Docs

- `docs/extension.md`: images can be added offline and upload when the connection returns; tooltips show them after the upload.
- `docs/backend.md`: the required upload `id` field.

## Implementation notes (2026-09-30)

- A deduplicated upload (imgbb returned a URL another file row already has) comes back with that row's ID; the outcome rewrites `imageId` in the users' mutations to it (`adoptUploadedFile` in `sync/outcome.ts`).
- The popup shows the picked image while the form is open (existing object-URL preview); after saving, cards show a "Waiting to upload" badge instead of the image until it syncs.
- Discarding an upload strips `imageId` from the changes that used it; discarding the only change that used an upload drops it.
- The 200 MB warning is a toast after the save (`offline.queuedImagesLarge`).

## Verification log

| Date | Check | Result | Evidence |
| --- | --- | --- | --- |
| 2026-09-30 | Backend: replay without a second provider call, `ID_CONFLICT`, missing `id` 422 | Pass | `apps/backend/test/sync-files.test.ts` |
| 2026-09-30 | Extension tests 1–7 (upload first, lost response, replaced image, discard, 12 MB refusal, orphan sweep) | Pass | `test/offline/sync/images.test.ts` |
| 2026-09-30 | Manual: attach offline, restart, reconnect | Not run | — |

### Review correction (2026-09-30)

Concurrent sends of the same client file ID are now serialized before the storage provider call, and a stored replay skips upload. A provider success followed by a backend crash before the database commit can still orphan a remote file; this requires provider-side idempotency or reconciliation to eliminate entirely.
