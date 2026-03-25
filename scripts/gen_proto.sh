#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

mkdir -p src/generated

protoc \
  --plugin=protoc-gen-ts_proto=./node_modules/.bin/protoc-gen-ts_proto \
  --proto_path=proto \
  --ts_proto_out=src/generated/ \
  --ts_proto_opt=esModuleInterop=true \
  --ts_proto_opt=outputServices=grpc-js \
  proto/*.proto
