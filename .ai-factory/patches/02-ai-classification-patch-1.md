# Patch: AI Classification (02) — Review 1

**Review:** `.ai-factory/reviews/02-ai-classification-review-1.md`
**Critical fixes:** 0
**Suggestions:** 1

---

## Fix 1: Remove unused `z` import

**File:** `src/tools/classifyAll.ts`
**Line:** 1
**Severity:** Suggestion (lint)
**Problem:** `z` is imported from `"zod"` but never used. The `inputSchema` is a plain empty object `{}` — no Zod types are referenced. This will fail strict lint rules (`@typescript-eslint/no-unused-imports`, `no-unused-vars`).

**Before:**
```typescript
import { z } from "zod";
import { fetchSessions } from "../api/client.js";
import type { BreathSession } from "../types.js";
```

**After:**
```typescript
import { fetchSessions } from "../api/client.js";
import type { BreathSession } from "../types.js";
```

**Why:** Dead import. Every other tool file uses `z` in its `inputSchema` definition, but `classifyAll` has an empty schema (`{}`), so `z` is unnecessary.
