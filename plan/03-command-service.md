# Phase 3 — ExecutePrompt service and protocol

[Global tracker](main.md) · **Status: In progress** · **Estimate: 5 points** · **Dependencies: phases 1–2**

## User story

As an extension, I want a validated local endpoint so I can send a prompt and receive predictable output without knowing provider CLI details.

## Proposed v1 contract

One business endpoint: **`POST /ExecutePrompt`**. Require `Authorization: Bearer <pairing-token>` and `Content-Type: application/json`.

```json
{
  "prompt": "Summarize this page: ...",
  "model": "codex-sol6",
  "effort": "medium"
}
```

`prompt` is nonempty text. `model` is a registered runtime enum value/alias. `effort` must be supported by that model. Reject unknown properties; callers cannot provide executables, environment variables, shell flags, or working directories.

Success:

```json
{
  "requestId": "generated-uuid",
  "output": "The final model answer...",
  "model": "codex:gpt-6-sol",
  "provider": "codex",
  "effort": "medium",
  "durationMs": 12500
}
```

Failure:

```json
{
  "requestId": "generated-uuid",
  "error": {
    "code": "UNSUPPORTED_EFFORT",
    "message": "The selected model does not support this effort.",
    "retryable": false
  }
}
```

Supporting **`GET /capabilities`** is authenticated connection metadata, not another business command. Return protocol version, model records, provider status, and limits.

For `Accept: application/x-ndjson`, send headers promptly and emit `started`, periodic `heartbeat`, and exactly one terminal `result` or `error` frame. Each frame is one JSON object plus a newline. Pre-execution failures use HTTP errors; failures after streaming begins use terminal frames. Other callers can request one JSON response. These streams carry status/final output, not reasoning or partial model text.

## Initial limits, subject to phase 0 verification

| Limit | Value |
| --- | --- |
| Bind | `127.0.0.1` only |
| Default port | `43127`, locally configurable |
| JSON body | 1 MiB UTF-8 bytes |
| Prompt | 500 KiB UTF-8 bytes, plus provider context limits |
| Final answer | 1 MiB UTF-8 bytes |
| Inference runtime | 240 seconds |
| Concurrent jobs | 2 |
| Pending queue | None; fail busy immediately |
| Heartbeats | Every 10 seconds |

Do not silently truncate input/output. Byte limits do not guarantee token-context fit; surface provider context errors. Bound catalog discovery separately.

## Tasks

- [x] Implement transport-neutral command service, provider registry, admission control, and cancellation without Electron imports.
- [ ] Add Fastify routes with strict request/response schemas, runtime enum validation, limits, request IDs, and typed errors.
- [x] Enforce loopback binding and exact permitted Host values against DNS rebinding.
- [x] Require bearer authentication on every endpoint using constant-time comparison.
- [x] Reject webpage Origins; allow extension Origins under the verified pairing policy. Origin-less local callers still need credentials. Never reflect arbitrary CORS origins.
- [ ] Verify extension preflight and local-network browser policy behavior before finalizing permissions/CORS handling.
- [ ] Map validation to `400`, authentication to `401`, origin/host to `403`, size to `413`, model/effort to `422`, busy to `429`, unavailable provider to `503`, provider failure to `502`, and timeout to `504`, with stable error codes.
- [x] Use no-store responses and log only safe request ID/status/duration metadata.
- [x] Bound streaming frames and send initial headers without waiting for inference. Clean up heartbeat timers on every terminal path.
- [ ] Abort provider work when the response connection closes early; release capacity exactly once across completion/cancellation races.
- [x] Cancel accepted jobs on credential rotation and shutdown.
- [ ] Version schemas and compatibility fixtures so the independently versioned extension can reject incompatible protocols clearly.

## Acceptance criteria

- [ ] Valid JSON/NDJSON requests return the same final answer semantics.
- [ ] Wrong token/origin/host, oversized bodies, and invalid enums never invoke inference.
- [ ] Busy requests fail promptly; completed or canceled jobs release capacity.
- [ ] Disconnect/timeout tests prove child cancellation, heartbeat cleanup, and single completion.
- [ ] Model/effort definitions have one client source of truth, without a duplicate static extension enum.

## Validation record

Fastify `GET /capabilities` and `POST /ExecutePrompt` implemented. Packaged app served a live NDJSON `started`/`result` prompt. Tests cover token/Origin/Host rejection, dynamic effort validation, capacity, streaming, and cancellation. **Open:** real HTTP disconnect races and 240-second activity.
