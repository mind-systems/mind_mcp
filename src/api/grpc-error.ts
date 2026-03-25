import { type ServiceError, status } from "@grpc/grpc-js";

export function grpcError(err: ServiceError): Error {
  let label: string;
  switch (err.code) {
    case status.NOT_FOUND:
      label = "not_found";
      break;
    case status.UNAUTHENTICATED:
      label = "unauthorized";
      break;
    case status.PERMISSION_DENIED:
      label = "forbidden";
      break;
    case status.INVALID_ARGUMENT:
      label = "invalid_input";
      break;
    default:
      label = "internal_error";
  }
  return new Error(`gRPC ${label} (${err.code}): ${err.details || err.message}`);
}
