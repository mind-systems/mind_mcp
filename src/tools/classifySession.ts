import { z } from "zod";
import { fetchSession } from "../api/grpc-client.js";
import type { BreathSession } from "../types.js";

const inputSchema = {
  sessionId: z.string().describe("The ID of the breathing session to classify"),
};

function formatSessionForClassification(session: BreathSession): string {
  const lines: string[] = [];

  lines.push(`Session ID: ${session.id}`);
  lines.push(`Description: ${session.description}`);
  lines.push(`Created: ${session.createdAt}`);
  lines.push(`Current timeOfDay: ${session.timeOfDay ?? "unclassified"}`);
  lines.push("");
  lines.push("Exercises:");

  session.exercises.forEach((exercise, exerciseIndex) => {
    lines.push(`  Exercise ${exerciseIndex + 1}:`);
    lines.push(`    Repeat count: ${exercise.repeatCount}`);
    lines.push(`    Rest duration: ${exercise.restDuration}ms`);
    lines.push(`    Steps:`);
    exercise.steps.forEach((step, stepIndex) => {
      lines.push(
        `      Step ${stepIndex + 1}: ${step.type} for ${step.duration}ms`,
      );
    });
  });

  lines.push("");
  lines.push(
    "Based on this breathing session's description and exercise characteristics, " +
      "please suggest the most appropriate time of day for this session. " +
      "Respond with exactly one of: morning, midday, or evening.",
  );

  return lines.join("\n");
}

export const classifySessionTool = {
  name: "classify_session_time_of_day",
  description:
    "Fetch a breathing session by ID and format it for time-of-day classification. " +
    "Returns session details and asks the LLM to suggest morning, midday, or evening.",
  inputSchema,
  handler: async (input: { sessionId: string }) => {
    try {
      const session = await fetchSession(input.sessionId);
      const text = formatSessionForClassification(session);
      return {
        content: [
          {
            type: "text" as const,
            text,
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Failed to fetch session: ${err}`,
          },
        ],
      };
    }
  },
};
