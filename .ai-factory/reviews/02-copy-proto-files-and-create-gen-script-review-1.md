# Code Review: 02 — Copy proto files and create gen script

**Files reviewed:** `scripts/gen_proto.sh`, `package.json`, `CLAUDE.md`, `src/generated/auth.ts`, `src/generated/breath_sessions.ts`

## Critical Issues

### 1. Missing runtime dependency: `@bufbuild/protobuf`

The generated files import from `@bufbuild/protobuf/wire`:

```ts
import { BinaryReader, BinaryWriter } from "@bufbuild/protobuf/wire";
```

This package is **not listed in `package.json`**. It only exists in `node_modules/` as a transitive dependency of `ts-proto` (a `devDependency`).

This breaks in two scenarios:

- **`npm install --omit=dev`** (production install): `ts-proto` is skipped, so `@bufbuild/protobuf` is never installed. Any import of the generated stubs fails at runtime with `Cannot find module '@bufbuild/protobuf/wire'`.
- **npm publish**: `package.json` declares `"files": ["dist"]`. Consumers install only the listed `dependencies`. Without `@bufbuild/protobuf` in `dependencies`, `require("@bufbuild/protobuf/wire")` from `dist/generated/auth.js` fails for every consumer.

**Fix:** Add `@bufbuild/protobuf` to `dependencies` (not `devDependencies`):

```bash
npm install @bufbuild/protobuf
```

This moves it from an implicit transitive dependency to an explicit runtime one.

## Checks Passed

- **Proto freshness**: `auth.proto` and `breath_sessions.proto` are identical to `mind_api/proto/` originals.
- **Script correctness**: `scripts/gen_proto.sh` uses `set -euo pipefail`, resolves project root correctly, includes `--proto_path=proto` so output lands directly in `src/generated/` (not `src/generated/proto/`). File is executable (`755`).
- **`npm run proto:gen`**: Runs without errors, produces both `.ts` files in `src/generated/`.
- **TypeScript compilation**: `npm run build` succeeds — all generated types resolve and compile cleanly.
- **`tsconfig.json` alignment**: `esModuleInterop=true` and `module: NodeNext` match the ts-proto options (`esModuleInterop=true`, `outputServices=grpc-js`).
- **Service client exports**: Both `AuthServiceClient` and `BreathSessionServiceClient` are exported with correct constructor signatures for phase 5.4.
- **`.gitignore`**: Correctly does NOT exclude `src/generated/`, aligning with the roadmap's "commit generated stubs" decision.
- **CLAUDE.md**: `proto:gen` command documented under `# Proto` section, matching existing style.
- **`package.json`**: `proto:gen` script placed after `format`, correct invocation.
