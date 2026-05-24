---
name: browser-extension-offline-mode
description: Implements local-first offline mode for browser extensions with IndexedDB entity cache, chrome.storage sync queue, background sync worker, and offline-aware UI hooks. Use when adding offline support, sync, download-for-offline, pending-change indicators, or when the user mentions offline mode, local-first, or sync integrity for extension data.
---

# Browser Extension Offline Mode

## Architecture (hybrid storage)

| Layer | Technology | Holds |
|-------|------------|-------|
| Entity cache | IndexedDB (Dexie) | Downloaded records + related lookup data |
| Sync metadata | `chrome.storage.local` | Pending ops queue, downloaded IDs, `lastSyncAt` |
| Coordinator | Background service worker | Sync engine, badge, online events, DB access for content scripts |

```text
Popup/UI ──► offline hooks ──► IndexedDB (read/write)
                │                    ▲
                └── sync queue ──────┘ (when offline or API fails)
Background ──► sync engine ──► API
Content script ──► messaging ──► Background ──► IndexedDB fallback
```

## Implementation checklist

Copy and track when adding offline support:

```text
- [ ] Dexie schema: table(s) for entity + indexes (e.g. parentId)
- [ ] types.ts: SyncOperation, SyncState, temp ID helpers
- [ ] sync-storage.ts: queue CRUD, downloaded-ID registry
- [ ] download.ts: fetch-all + write bundle transaction
- [ ] sync-engine.ts: push queue, pull server (conflict policy), fullSync
- [ ] hooks.ts: offline queries + write-local-first mutations
- [ ] background: messaging handlers, online/alarms listeners, badge
- [ ] content script: API failure → offline fallback via background
- [ ] UI: download toggle, pending badges, sync button, offline banner
- [ ] manifest: storage, alarms, unlimitedStorage
- [ ] i18n strings for offline UX
```

## Core patterns

### 1. Dexie database

- One DB name per extension (e.g. `myext-offline`).
- Store full API list-item shapes (including nested relations needed by UI).
- Index foreign keys used in queries (`novelId`, etc.).
- Use transactions for bundle writes (replace child rows on re-download).

### 2. Sync queue (`chrome.storage.local`)

```typescript
type SyncOperation = {
  id: string;
  entity: string;           // extend union per entity type
  action: 'create' | 'update' | 'delete';
  entityId: string;         // temp-* for offline creates
  scopeId: string;          // parent scope (e.g. novelId)
  payload: Record<string, unknown>;
  createdAt: number;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
};
```

- Queue only when offline **or** immediate API call fails.
- On create sync success: swap `temp-*` ID in IndexedDB and queue.

### 3. Write-local-first mutation

For each CRUD action on a **downloaded** scope:

1. If scope not downloaded → call API directly (existing behavior).
2. Write to IndexedDB immediately (optimistic UI).
3. If online → try API; on success update IndexedDB with server row; on failure → queue.
4. If offline → queue operation.
5. Invalidate offline React Query keys + pending-count keys.

### 4. Conflict resolution (pick one, document in code)

| Policy | Behavior |
|--------|----------|
| **Server wins** (Story Lens default) | After push, `pullServerData(scopeId)` overwrites IndexedDB |
| Last-write-wins | Compare `updatedAt` timestamps |
| Manual | Surface conflict UI (not implemented in reference) |

### 5. Download scope

`downloadScope(parentId)` must fetch:

- Parent record
- All child entities for that scope
- Lookup/reference data required by forms (categories, enums, etc.)

Paginate with large `pageSize` or loop until all pages loaded.

### 6. Content script access

Content scripts must **not** open IndexedDB directly if your stack routes storage through background.

Add messaging protocol entries:

- `getOfflineData(scopeKey)` → background reads IndexedDB
- `triggerFullSync()` → background runs sync engine

In data loader: try API first; on network failure call offline fallback.

### 7. Background sync worker

- `self.addEventListener('online')` → `fullSync()`
- `chrome.alarms` periodic sync (e.g. 5 min)
- `chrome.storage.onChanged` → update badge
- Badge: pending count when online; `!` when offline

### 8. UI indicators

- Download/remove icon per downloadable scope
- Inline "pending sync" badge on rows with queued ops
- Navbar sync button + offline banner
- Checkmark in select/dropdown for downloaded scopes

## Adding a new field to an offline entity

When a schema/API field is added:

1. **Ask the user** whether the field should participate in offline mode.
2. If yes:
   - Add field to Dexie row type (uses generated API types when possible).
   - Include field in `downloadScope` fetch (already covered if storing full API objects).
   - Include field in mutation `payload` written to queue.
   - Update form/list UI to display and edit the field offline.
   - If field references another entity, ensure that entity is in download bundle or queue resolution handles it.
3. If no: document as online-only; gate UI or show read-only when offline.

## Manifest permissions

```typescript
permissions: ['storage', 'alarms', 'unlimitedStorage']
```

Add `tabs` if not already present for content/popup coordination.

## Dependencies

- **Dexie** for IndexedDB (`bun add dexie`)
- **TanStack Query** for offline cache invalidation in popup
- **@webext-core/messaging** for typed cross-context messages

## Verification

After changes:

```bash
bun run typecheck   # from extension app
```

Manual test matrix:

1. Download scope while online
2. Go offline → list/read/edit/create/delete → UI updates instantly
3. Reconnect → auto sync; server-wins pull refreshes local data
4. Content script applies data from IndexedDB when API unreachable
5. Badge and pending badges reflect queue state

## Story Lens reference

This repo implements the full pattern. See [reference.md](reference.md) for file map and conventions.
