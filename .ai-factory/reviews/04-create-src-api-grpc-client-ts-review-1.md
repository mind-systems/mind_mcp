# Code Review: 04 — Create `src/api/grpc-client.ts`

**Plan:** `.ai-factory/plans/04-create-src-api-grpc-client-ts.md`
**Build:** passes (`npm run build` — clean)

---

## Critical Issues

None.

---

## Bugs

### 1. `buildUpdateRequest` cannot clear `timeOfDay` to null

`grpc-client.ts:230-235` — When `data.timeOfDay` is `null` (meaning "clear timeOfDay"), the code sets `req.timeOfDay = undefined`:

```ts
if (data.timeOfDay !== undefined) {
  req.timeOfDay =
    data.timeOfDay !== null
      ? mapTimeOfDayToProto(data.timeOfDay)
      : undefined;   // ← proto3 treats undefined as "not sent"
}
```

In proto3, `undefined` on an optional field means "don't touch this field" — the server won't clear it. The user's intent (clear timeOfDay) is silently dropped.

**Current impact: none.** The only caller (`setTimeOfDay.ts`) always passes a valid enum value ("morning"/"midday"/"evening"), never `null`. But the `Partial<BreathSession>` type allows `timeOfDay: null`, so this is a latent contract violation that will bite when someone tries to clear a session's timeOfDay.

**Fix options:**
- If the proto contract supports clearing via a sentinel (e.g. sending `TIME_OF_DAY_UNSPECIFIED = 0` if one existed, or a separate `clear_time_of_day` bool), use that.
- If the proto has no mechanism to clear an optional enum, this is a proto contract gap — document it and address in the proto first.
- At minimum, throw an explicit error when `null` is passed so it fails loudly instead of silently: `throw new Error("Clearing timeOfDay via gRPC is not supported — proto has no sentinel value")`.

---

## Suggestions

### 2. `mapStepType` default case silently maps unknown types to "inhale"

`grpc-client.ts:107-108` — If the proto adds a new `StepType` variant (e.g. `EXHALE_NOSE`), this mapper will silently return `"inhale"` instead of failing visibly. Compare with `mapStepTypeToProto` which is exhaustive (TypeScript enforces all union cases). Consider throwing on the default branch so proto contract changes surface immediately:

```ts
default:
  throw new Error(`Unknown StepType: ${type}`);
```

### 3. `mapTimeOfDay` has the same silent-default pattern

`grpc-client.ts:131-132` — Returns `null` for any unrecognized `TimeOfDay` value. This is more defensible than the step-type case (treating unknown as "unset" is reasonable), but worth noting. If a 4th time-of-day is added to the proto, it'll map to `null` silently.

### 4. ARCHITECTURE.md "Key Principles" section is now slightly stale

`ARCHITECTURE.md:77` still says *"API client is the only HTTP boundary"* and `ARCHITECTURE.md:80` references only `MIND_API_URL` and `MIND_PAT_TOKEN`. The folder structure and dependency rules were updated, but these prose sections weren't. Minor — they still apply to `client.ts` during the transition — but they'd be misleading if someone reads only the principles without the folder structure context.

---

## Positive Notes

- The TLS/insecure credential branching correctly addresses the `combineChannelCredentials` limitation — insecure mode uses interceptors, TLS mode uses combined credentials. This was the primary critical issue in the plan review and it's handled well.
- The `callUnary` helper uses `method.call(client, ...)` to correctly bind `this` and target the 2-arg overload. The `as unknown as GrpcMethod<...>` casts are necessary because the generated client methods have 3 overloads — the cast is safe since the runtime dispatches correctly.
- The `mapSessionWithStarred` null guard (line 192) catches the `session: undefined` case with a clear error message.
- Duration passthrough is correct — both proto and REST use seconds, and the `types.ts` comment is now fixed.
- `.env.example` correctly includes both REST and gRPC vars with transition context.
- All four exported function signatures are identical to `client.ts` — drop-in replacement confirmed.
- Build passes cleanly with no type errors.

REVIEW_PASS
