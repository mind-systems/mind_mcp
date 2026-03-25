# gRPC Client Setup — Research Notes

## Library stack

- `@grpc/grpc-js` — Node.js gRPC runtime
- `ts-proto` — compile-time stub generation (no runtime proto loading; stubs are plain TypeScript classes)

## Proto loading strategy

Use `ts-proto` to generate typed stubs at build time. Generated files go to `src/generated/`. This avoids runtime proto file resolution and gives full TypeScript type safety on request/response shapes.

## PAT authentication

Personal Access Tokens are injected at the channel level via `grpc.credentials.createFromMetadataGenerator()` combined with channel credentials. This means auth is automatic on every call — no per-call `Metadata` object needed in tool files.

```ts
const callCreds = grpc.credentials.createFromMetadataGenerator((_params, callback) => {
  const meta = new grpc.Metadata();
  meta.add('authorization', `Bearer ${process.env.MIND_PAT_TOKEN}`);
  callback(null, meta);
});

const channelCreds = process.env.MIND_GRPC_TLS === 'true'
  ? grpc.credentials.createSsl()
  : grpc.credentials.createInsecure();

const combinedCreds = grpc.credentials.combineChannelCredentials(channelCreds, callCreds);
const channel = new grpc.Client(process.env.MIND_GRPC_URL, combinedCreds);
```

## Error mapping

gRPC status codes must be mapped to MCP error shapes. Design a `grpcErrorToMcpError(err: ServiceError): McpError` utility in `src/api/grpc-error.ts`. Key mappings:

| gRPC status | MCP error code |
|-------------|----------------|
| NOT_FOUND (5) | `not_found` |
| UNAUTHENTICATED (16) | `unauthorized` |
| PERMISSION_DENIED (7) | `forbidden` |
| INVALID_ARGUMENT (3) | `invalid_input` |
| INTERNAL (13) | `internal_error` |
