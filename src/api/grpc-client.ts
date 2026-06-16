import * as grpc from "@grpc/grpc-js";
import type { ServiceError } from "@grpc/grpc-js";

import {
  BreathSessionServiceClient,
  SessionSection as ProtoSessionSection,
  StepType,
  TimeOfDay as ProtoTimeOfDay,
  type BreathSessionDto,
  type BreathSessionWithStarredDto,
  type CreateSessionRequest,
  type ExerciseDto,
  type ExerciseList,
  type ListSessionsRequest,
  type ListSessionsResponse,
  type SessionListItem as ProtoSessionListItem,
  type StepDto,
  type UpdateSessionRequest,
} from "../generated/breath_sessions.js";
import type {
  BreathExercise,
  BreathSession,
  BreathSessionListResponse,
  BreathStep,
  CreateBreathSessionPayload,
  SessionListItem,
  SessionSection,
  TimeOfDay,
} from "../types.js";
import { grpcError } from "./grpc-error.js";

// ---- Env & validation ----

const GRPC_URL = process.env.MIND_GRPC_URL;
const TOKEN = process.env.MIND_PAT_TOKEN;
const TLS = process.env.MIND_GRPC_TLS ?? "false";

if (!GRPC_URL || !TOKEN) {
  throw new Error("MIND_GRPC_URL and MIND_PAT_TOKEN must be set");
}

// ---- Channel setup (branched by TLS mode) ----
//
// @grpc/grpc-js does not allow composing insecure credentials with call credentials —
// combineChannelCredentials(createInsecure(), callCreds) throws "Cannot compose insecure credentials".
// TLS mode uses combined channel+call credentials; insecure mode uses interceptors.

let client: BreathSessionServiceClient;

if (TLS === "true") {
  const callCreds = grpc.credentials.createFromMetadataGenerator(
    (_params, callback) => {
      const meta = new grpc.Metadata();
      meta.add("authorization", `Bearer ${TOKEN!}`);
      callback(null, meta);
    },
  );
  const channelCreds = grpc.credentials.combineChannelCredentials(
    grpc.credentials.createSsl(),
    callCreds,
  );
  client = new BreathSessionServiceClient(GRPC_URL, channelCreds);
} else {
  const authInterceptor: grpc.Interceptor = (options, nextCall) => {
    return new grpc.InterceptingCall(nextCall(options), {
      start(metadata, listener, next) {
        metadata.add("authorization", `Bearer ${TOKEN!}`);
        next(metadata, listener);
      },
    });
  };
  client = new BreathSessionServiceClient(
    GRPC_URL,
    grpc.credentials.createInsecure(),
    { interceptors: [authInterceptor] },
  );
}

// ---- Promisify helper ----

type GrpcMethod<Req, Res> = (
  request: Req,
  callback: (err: ServiceError | null, res?: Res) => void,
) => void;

function callUnary<Req, Res>(
  method: GrpcMethod<Req, Res>,
  request: Req,
): Promise<Res> {
  return new Promise<Res>((resolve, reject) => {
    method.call(client, request, (err: ServiceError | null, res?: Res) => {
      if (err) {
        reject(grpcError(err));
      } else {
        resolve(res as Res);
      }
    });
  });
}

// ---- DTO mappers (private) ----

function mapStepType(type: StepType): BreathStep["type"] {
  switch (type) {
    case StepType.INHALE:
      return "inhale";
    case StepType.EXHALE:
      return "exhale";
    case StepType.HOLD:
      return "hold";
    default:
      return "inhale";
  }
}

function mapStepTypeToProto(type: BreathStep["type"]): StepType {
  switch (type) {
    case "inhale":
      return StepType.INHALE;
    case "exhale":
      return StepType.EXHALE;
    case "hold":
      return StepType.HOLD;
  }
}

function mapTimeOfDay(tod: ProtoTimeOfDay | undefined): TimeOfDay | null {
  switch (tod) {
    case ProtoTimeOfDay.MORNING:
      return "morning";
    case ProtoTimeOfDay.MIDDAY:
      return "midday";
    case ProtoTimeOfDay.EVENING:
      return "evening";
    default:
      return null;
  }
}

function mapTimeOfDayToProto(tod: TimeOfDay): ProtoTimeOfDay {
  switch (tod) {
    case "morning":
      return ProtoTimeOfDay.MORNING;
    case "midday":
      return ProtoTimeOfDay.MIDDAY;
    case "evening":
      return ProtoTimeOfDay.EVENING;
  }
}

function mapStep(step: StepDto): BreathStep {
  return {
    type: mapStepType(step.type),
    duration: step.duration,
  };
}

function mapStepToProto(step: BreathStep): StepDto {
  return {
    type: mapStepTypeToProto(step.type),
    duration: step.duration,
  };
}

function mapExercise(ex: ExerciseDto): BreathExercise {
  return {
    steps: ex.steps.map(mapStep),
    restDuration: ex.restDuration,
    repeatCount: ex.repeatCount,
  };
}

function mapExerciseToProto(ex: BreathExercise): ExerciseDto {
  return {
    steps: ex.steps.map(mapStepToProto),
    restDuration: ex.restDuration,
    repeatCount: ex.repeatCount,
  };
}

function mapSessionDto(dto: BreathSessionDto): BreathSession {
  return {
    id: dto.id,
    userId: dto.userId,
    description: dto.description,
    exercises: dto.exercises.map(mapExercise),
    complexity: dto.complexity,
    shared: dto.shared,
    timeOfDay: mapTimeOfDay(dto.timeOfDay),
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function mapSessionWithStarred(dto: BreathSessionWithStarredDto): BreathSession {
  if (!dto.session) {
    throw new Error("Malformed gRPC response: session field is missing");
  }
  return {
    ...mapSessionDto(dto.session),
    isStarred: dto.isStarred,
  };
}

function mapSection(s: ProtoSessionSection): SessionSection {
  switch (s) {
    case ProtoSessionSection.STARRED:
      return "STARRED";
    case ProtoSessionSection.MINE:
      return "MINE";
    case ProtoSessionSection.SHARED:
      return "SHARED";
    // UNRECOGNIZED (and any future member) is intentionally coerced to the
    // least-privileged grouping; SessionSection has no neutral member.
    default:
      return "SHARED";
  }
}

function buildCreateRequest(data: CreateBreathSessionPayload): CreateSessionRequest {
  return {
    description: data.description,
    exercises: data.exercises.map(mapExerciseToProto),
    shared: data.shared,
    timeOfDay:
      data.timeOfDay !== undefined
        ? mapTimeOfDayToProto(data.timeOfDay)
        : undefined,
  };
}

function buildUpdateRequest(
  id: string,
  data: Partial<BreathSession>,
): UpdateSessionRequest {
  const req: UpdateSessionRequest = { id };
  if (data.description !== undefined) {
    req.description = data.description;
  }
  if (data.shared !== undefined) {
    req.shared = data.shared;
  }
  if (data.exercises !== undefined) {
    const exerciseList: ExerciseList = {
      exercises: data.exercises.map(mapExerciseToProto),
    };
    req.exercises = exerciseList;
  }
  if (data.timeOfDay !== undefined) {
    req.timeOfDay =
      data.timeOfDay !== null
        ? mapTimeOfDayToProto(data.timeOfDay)
        : undefined;
  }
  return req;
}

// ---- Exported functions ----

export async function fetchSessions(
  opts?: { cursor?: string; pageSize?: number },
): Promise<BreathSessionListResponse> {
  const resp = await callUnary(
    client.listSessions as unknown as GrpcMethod<
      ListSessionsRequest,
      ListSessionsResponse
    >,
    { cursor: opts?.cursor, pageSize: opts?.pageSize ?? 10 },
  );
  const items: SessionListItem[] = resp.items.map(
    (item: ProtoSessionListItem) => {
      if (!item.session) {
        throw new Error("Malformed gRPC response: list item session is missing");
      }
      return { session: mapSessionWithStarred(item.session), section: mapSection(item.section) };
    },
  );
  return { items, nextCursor: resp.nextCursor };
}

export async function fetchSession(id: string): Promise<BreathSession> {
  const resp = await callUnary(
    client.getSession as unknown as GrpcMethod<
      { id: string },
      BreathSessionWithStarredDto
    >,
    { id },
  );
  return mapSessionWithStarred(resp);
}

export async function patchSession(
  id: string,
  data: Partial<BreathSession>,
): Promise<BreathSession> {
  const req = buildUpdateRequest(id, data);
  const resp = await callUnary(
    client.updateSession as unknown as GrpcMethod<
      UpdateSessionRequest,
      BreathSessionDto
    >,
    req,
  );
  return mapSessionDto(resp);
}

export async function createSession(
  data: CreateBreathSessionPayload,
): Promise<BreathSession> {
  const req = buildCreateRequest(data);
  const resp = await callUnary(
    client.createSession as unknown as GrpcMethod<
      CreateSessionRequest,
      BreathSessionDto
    >,
    req,
  );
  return mapSessionDto(resp);
}
