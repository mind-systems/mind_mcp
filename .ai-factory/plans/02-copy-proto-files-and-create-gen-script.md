# Plan: Copy proto files and create gen script

## Context

Set up the proto-to-TypeScript code generation pipeline so `mind_mcp` can generate typed stubs from the `.proto` contracts owned by `mind_api`. The `proto/` directory with both files already exists; this milestone wires up the generation script, npm command, and documentation.

## Settings
- Testing: no
- Logging: minimal
- Docs: CLAUDE.md update only

## Tasks

### Phase 1: Proto files

- [x] **Task 1: Verify proto files are present and current**
  Files: `proto/breath_sessions.proto`, `proto/auth.proto`
  The `proto/` directory already exists with both files copied from `mind_api/proto/`. Diff them against the originals (`mind_api/proto/breath_sessions.proto` and `mind_api/proto/auth.proto`) and re-copy if they differ. No modifications — `mind_api/proto/` is the single source of truth.

### Phase 2: Generation script and npm wiring

- [x] **Task 2: Create `scripts/gen_proto.sh`** (depends on Task 1)
  Files: `scripts/gen_proto.sh`
  Create the `scripts/` directory and add `gen_proto.sh`. The script must:
  - Start with `#!/usr/bin/env bash` and `set -euo pipefail`.
  - `cd` to the project root (relative to script location: `cd "$(dirname "$0")/.."`).
  - Create `src/generated/` if it doesn't exist (`mkdir -p src/generated`).
  - Run protoc with the ts-proto plugin:
    ```
    protoc \
      --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
      --proto_path=proto \
      --ts_proto_out=src/generated/ \
      --ts_proto_opt=esModuleInterop=true \
      --ts_proto_opt=outputServices=grpc-js \
      proto/*.proto
    ```
  - `--proto_path=proto` is required so protoc resolves inputs relative to `proto/`, placing output directly in `src/generated/` (without it, files would land in `src/generated/proto/`).
  - Make the script executable (`chmod +x`).
  - `esModuleInterop=true` is required because the project uses `module: NodeNext`. `outputServices=grpc-js` matches the `@grpc/grpc-js` dependency already present.

- [x] **Task 3: Add `proto:gen` script to `package.json`** (depends on Task 2)
  Files: `package.json`
  Add to the `scripts` section: `"proto:gen": "bash scripts/gen_proto.sh"`. Place it after the existing `format` script. Run `npm run proto:gen` once to verify it produces files in `src/generated/`.

- [x] **Task 4: Document `proto:gen` in `CLAUDE.md`** (depends on Task 3)
  Files: `CLAUDE.md`
  In `CLAUDE.md`, add `npm run proto:gen` to the Commands code block under a `# Proto` comment, with a brief note: `# Regenerate TypeScript stubs from proto/*.proto`. Keep the existing structure and style. Generated stubs in `src/generated/` are committed to the repo per the roadmap — consumers don't need `protoc` installed to build.
