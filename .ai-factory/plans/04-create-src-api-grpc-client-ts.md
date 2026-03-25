# Plan: Create `src/api/grpc-client.ts`

## Context

Replace the REST-based API client with a gRPC client that uses the already-generated `ts-proto` stubs, injecting PAT auth at the channel level so tool files require zero changes.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: gRPC infrastructure

- [x] **Task 1: Create `src/api/grpc-error.ts` — gRPC-to-throw error mapper**
  Files: `src/api/grpc-error.ts`
  Create a utility that converts `ServiceError` (from `@grpc/grpc-js`) into a thrown `Error` with a human-readable message matching the pattern tools already expect (`"API error …: …"`). Import `ServiceError` and `status` from `@grpc/grpc-js`. The function signature: `function grpcError(err: ServiceError): Error`. Map gRPC status codes to short labels following the table in `.ai-factory/notes/01-grpc-client-setup.md` (NOT_FOUND → `not_found`, UNAUTHENTICATED → `unauthorized`, PERMISSION_DENIED → `forbidden`, INVALID_ARGUMENT → `invalid_input`, everything else → `internal_error`). Format the thrown error message as `` `gRPC ${label} (${err.code}): ${err.details || err.message}` `` so tools' existing `catch (err)` blocks produce useful output without changes.

- [x] **Task 2: Create `src/api/grpc-client.ts` — channel setup, DTO mapping, 4 exported functions**
  Files: `src/api/grpc-client.ts`

  **Env & validation.** Read `MIND_GRPC_URL`, `MIND_PAT_TOKEN`, `MIND_GRPC_TLS` at module scope. Throw if `MIND_GRPC_URL` or `MIND_PAT_TOKEN` are missing (same fail-fast pattern as current `client.ts`). `MIND_GRPC_TLS` defaults to `"false"` when absent.

  **Channel credentials — branched by TLS mode.** `@grpc/grpc-js` does not allow composing insecure credentials with call credentials — `combineChannelCredentials(createInsecure(), callCreds)` throws `"Cannot compose insecure credentials"`. Handle the two modes separately:

  - **TLS mode** (`MIND_GRPC_TLS === "true"`): create call credentials via `grpc.credentials.createFromMetadataGenerator()` that adds `authorization: Bearer <token>`, combine with `grpc.credentials.createSsl()` using `combineChannelCredentials`, and instantiate `BreathSessionServiceClient` with the combined creds.
  - **Insecure mode** (default): instantiate `BreathSessionServiceClient` with `grpc.credentials.createInsecure()` and pass an `interceptors` option containing an auth interceptor. The interceptor creates an `InterceptingCall` that overrides `start()` to inject `authorization: Bearer <token>` into the metadata of every outgoing call. Pattern:
    ```ts
    function authInterceptor(options, nextCall) {
      return new grpc.InterceptingCall(nextCall(options), {
        start(metadata, listener, next) {
          metadata.add('authorization', `Bearer ${token}`);
          next(metadata, listener);
        },
      });
    }
    ```

  **Promisify helper.** The generated client methods use Node-style callbacks with multiple overloads (request-only, request+metadata, request+metadata+options). Write a private generic helper:
  ```ts
  function callUnary<Req, Res>(
    method: (request: Req, callback: (err: ServiceError | null, res?: Res) => void) => void,
    request: Req,
  ): Promise<Res>
  ```
  Bind the method to the client instance using `.call(client, request, callback)` — explicitly targeting the 2-arg overload (request + callback) so that metadata and options args are not accidentally included. On error, throw via `grpcError()` from Task 1.

  **DTO mappers (private, not exported).** Convert between proto DTOs and `src/types.ts` types. All duration fields (step `duration`, exercise `restDuration`) are in seconds on both sides — no unit conversion needed (the `types.ts` comment saying "milliseconds" is stale; Task 3 fixes it).

  - `StepType` enum ↔ `"inhale"|"exhale"|"hold"` string — use lowercase of enum name.
  - `TimeOfDay` enum (0/1/2) ↔ `"morning"|"midday"|"evening"` string — use lowercase of enum name. Proto `undefined` maps to `null` in REST type.
  - `StepDto` → `BreathStep`: convert `type` enum to string; pass through `duration` as-is (both seconds).
  - `ExerciseDto` → `BreathExercise`: map `steps` array through the step mapper; pass through `restDuration` and `repeatCount`.
  - `BreathSessionDto` → `BreathSession`: map `exercises`, `timeOfDay` (enum → string | null), pass through scalar fields (`id`, `userId`, `description`, `complexity`, `shared`, `createdAt`, `updatedAt`). Omit `deletedAt` (not in REST type).
  - `BreathSessionWithStarredDto` → `BreathSession`: the generated type marks `session` as `BreathSessionDto | undefined`. Guard against `undefined` — if `session` is missing, throw an error with a descriptive message (`"Malformed gRPC response: session field is missing"`). When present, map via the DTO mapper above, then merge `isStarred` from the wrapper.
  - Reverse mappers for request payloads:
    - `BreathExercise` → `ExerciseDto` (for create/update): string step type → `StepType` enum.
    - `CreateBreathSessionPayload` → `CreateSessionRequest`: map exercises, convert `timeOfDay` string → enum.
    - `Partial<BreathSession>` → `UpdateSessionRequest` fields: only set fields that are present in the input. If `exercises` is present, wrap in `ExerciseList`. If `timeOfDay` is present, convert string → enum.

  **4 exported functions** — identical signatures to `client.ts`, same names, same return types from `../types.js`:
  1. `fetchSessions(page?: number, pageSize?: number): Promise<BreathSessionListResponse>` — call `client.listSessions({ page: page ?? 1, pageSize: pageSize ?? 10 })`, map `ListSessionsResponse` → `BreathSessionListResponse` (map each `BreathSessionWithStarredDto` → `BreathSession`, pass through `total`, `page`, `pageSize`).
  2. `fetchSession(id: string): Promise<BreathSession>` — call `client.getSession({ id })`, map `BreathSessionWithStarredDto` → `BreathSession`.
  3. `patchSession(id: string, data: Partial<BreathSession>): Promise<BreathSession>` — build `UpdateSessionRequest` from `id` + `data`, call `client.updateSession(req)`, map `BreathSessionDto` → `BreathSession`.
  4. `createSession(data: CreateBreathSessionPayload): Promise<BreathSession>` — build `CreateSessionRequest`, call `client.createSession(req)`, map `BreathSessionDto` → `BreathSession`.

### Phase 2: Housekeeping

- [x] **Task 3: Fix stale `types.ts` duration comment**
  Files: `src/types.ts`
  Change the comment on `BreathStep.duration` from `// milliseconds` to `// seconds` to match the REST API (`@ApiProperty({ description: 'Duration in seconds' })`), the proto contract (`// duration is in seconds.`), and the generated stubs. The REST API has always returned seconds — this comment was incorrect.

- [x] **Task 4: Create `.env.example` with both REST and gRPC vars**
  Files: `.env.example`
  Create `.env.example` at the project root with both sets of env vars. During the transition (roadmap steps 5.4 → 5.6) both `client.ts` (REST) and `grpc-client.ts` coexist, and tools still import from `client.ts` until individually migrated. Contents:
  ```
  # REST client (still used until all tools are migrated to gRPC — see roadmap 5.5/5.6)
  MIND_API_URL=http://localhost:3000

  # gRPC client
  MIND_GRPC_URL=localhost:50051
  MIND_GRPC_TLS=false

  # Auth (shared by both clients)
  MIND_PAT_TOKEN=pat_your_token_here
  ```

- [x] **Task 5: Update `DESCRIPTION.md` env section and `ARCHITECTURE.md` folder structure**
  Files: `.ai-factory/DESCRIPTION.md`, `.ai-factory/ARCHITECTURE.md`

  In `DESCRIPTION.md` Authentication section: add `MIND_GRPC_URL` and `MIND_GRPC_TLS` alongside the existing `MIND_API_URL` and `MIND_PAT_TOKEN`. Note that during the transition both REST and gRPC env vars are needed.

  In `ARCHITECTURE.md`: update the folder structure template to show the transition state where both clients coexist:
  ```
  src/
  ├── api/
  │   ├── client.ts       # REST client (to be removed after full migration)
  │   ├── grpc-client.ts   # gRPC client (new, same 4 exported functions)
  │   └── grpc-error.ts    # gRPC status code → Error mapper
  ```
  Update dependency rules to add: `api/grpc-client.ts` → `api/grpc-error.ts`, `api/grpc-client.ts` → `generated/*`, `api/grpc-client.ts` → `types.ts`. Add a note that `api/client.ts` will be deleted after roadmap step 5.6 and the folder structure / dependency rules should be simplified at that point.

## Commit Plan
- **Commit 1** (after tasks 1-2): "Add gRPC client with PAT auth, DTO mappers, and error handling"
- **Commit 2** (after tasks 3-5): "Fix duration unit comment, add .env.example, update project docs for gRPC transition"
