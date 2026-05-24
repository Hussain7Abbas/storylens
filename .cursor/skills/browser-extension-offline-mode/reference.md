# Story Lens Offline Mode — Reference

Reference implementation in this monorepo.

## File map

| File | Role |
|------|------|
| `apps/extension/src/lib/offline/types.ts` | Sync types, temp IDs, storage key |
| `apps/extension/src/lib/offline/db.ts` | Dexie schema + CRUD helpers |
| `apps/extension/src/lib/offline/sync-storage.ts` | `chrome.storage.local` queue |
| `apps/extension/src/lib/offline/download.ts` | Download/remove novel bundles |
| `apps/extension/src/lib/offline/sync-engine.ts` | Push, pull, fullSync (server-wins) |
| `apps/extension/src/lib/offline/hooks.ts` | Popup offline hooks + mutations |
| `apps/extension/src/lib/offline/badge.ts` | Extension action badge |
| `apps/extension/src/lib/offline/online-status.ts` | `navigator.onLine` helpers |
| `apps/extension/src/entrypoints/background/index.ts` | Sync worker, alarms, messaging |
| `apps/extension/src/entrypoints/background/messaging.ts` | Protocol: `getOfflineNovelData`, `triggerFullSync` |
| `apps/extension/src/utils/load-novel-content-data.ts` | API with IndexedDB fallback |
| `apps/extension/src/entrypoints/popup.home/home.tsx` | Download button + offline banner |
| `apps/extension/src/entrypoints/popup.home/tabs/coloring/*` | Offline keyword list/forms |
| `apps/extension/src/entrypoints/popup.home/tabs/replacing/*` | Offline replacement list/forms |
| `apps/extension/src/components/navbar/navbar.tsx` | Manual sync + offline indicator |
| `apps/extension/wxt.config.ts` | `storage`, `alarms`, `unlimitedStorage` |
| `apps/extension/public/locales/en.json` | `offline.*` i18n keys |

## Entities in offline scope

| Entity | IndexedDB store | Sync entity | Downloaded with |
|--------|-----------------|-------------|-----------------|
| Novel | `novels` | — (download only, no offline create) | user action |
| Keyword | `keywords` | `keyword` | novel download |
| Replacement | `replacements` | `replacement` | novel download |
| KeywordCategory | `keywordCategories` | — | novel download (form lookups) |
| KeywordNature | `keywordNatures` | — | novel download (form lookups) |

## Design decisions (Story Lens)

- **Conflict policy**: server wins
- **Download trigger**: icon beside novel select
- **Sync trigger**: auto on reconnect + manual navbar button + 5-min alarm
- **Offline create**: keywords/replacements on downloaded novels only (not new novels)
- **Indicators**: badge count + inline pending badges + offline banner

## Extending SyncEntity

When adding a new offline-mutable entity:

1. Add to `SyncEntity` union in `types.ts`
2. Add Dexie store in `db.ts`
3. Add push handler branch in `sync-engine.ts`
4. Add mutation hook in `hooks.ts`
5. Wire list/form components to offline hooks when scope is downloaded
6. Include entity in `download.ts` bundle if scoped to a downloadable parent

## API call shape (Orval in this project)

Direct functions, not `{ data: body }`:

```typescript
await postKeywords(body);
await putKeywordsById(id, body);
await deleteKeywordsById(id);
```

Content scripts use `extensionApiGet` → background `apiRequest` proxy.
