# Plan: Install gRPC packages

## Context
Add the gRPC runtime library and the ts-proto code generator as project dependencies so subsequent milestones can generate TypeScript stubs from `.proto` files and communicate over gRPC.

## Settings
- Testing: no
- Logging: minimal
- Docs: no

## Tasks

### Phase 1: Install packages

- [x] **Task 1: Install @grpc/grpc-js as a production dependency**
  Files: `package.json`, `package-lock.json`
  Run `npm install @grpc/grpc-js` inside `mind_mcp/`. Verify the package appears in `dependencies` in `package.json`.

- [x] **Task 2: Install ts-proto as a dev dependency**
  Files: `package.json`, `package-lock.json`
  Run `npm install --save-dev ts-proto` inside `mind_mcp/`. Verify the package appears in `devDependencies` in `package.json`.
