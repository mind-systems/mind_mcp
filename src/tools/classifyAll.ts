import { fetchSessions } from "../api/client.js";
import type { BreathSession } from "../types.js";

const inputSchema = {};

function formatSessionBlock(session: BreathSession): string {
  const lines: string[] = [];

  lines.push(`--- Session ID: ${session.id} ---`);
  lines.push(`Description: ${session.description}`);
  lines.push(`Created: ${session.createdAt}`);
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

  return lines.join("\n");
}

async function fetchAllSessions(): Promise<BreathSession[]> {
  const firstPage = await fetchSessions(1, 50);
  const sessions: BreathSession[] = [...firstPage.data];

  if (firstPage.total > firstPage.pageSize) {
    const totalPages = Math.ceil(firstPage.total / firstPage.pageSize);
    for (let page = 2; page <= totalPages; page++) {
      const result = await fetchSessions(page, firstPage.pageSize);
      sessions.push(...result.data);
    }
  }

  return sessions;
}

export const classifyAllTool = {
  name: "classify_all_sessions",
  description:
    "Fetch all breathing sessions that have no timeOfDay classification and present them " +
    "in a single batch for the LLM to classify. Returns a formatted list asking for " +
    "morning/midday/evening suggestions for each session, to be confirmed before applying.",
  inputSchema,
  handler: async (_input: Record<string, never>) => {
    try {
      const allSessions = await fetchAllSessions();
      const unclassified = allSessions.filter(
        (s) => s.timeOfDay === null || s.timeOfDay === undefined,
      );

      if (unclassified.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "All sessions already have a timeOfDay classification. Nothing to classify.",
            },
          ],
        };
      }

      const sessionBlocks = unclassified.map(formatSessionBlock).join("\n\n");

      const text = [
        `Found ${unclassified.length} unclassified breathing session(s):\n`,
        sessionBlocks,
        "",
        "For each session above, please analyse the description and exercise characteristics " +
          "to suggest the most appropriate time of day (morning, midday, or evening). " +
          "Present your suggestions to the user for confirmation. " +
          "Once confirmed, call set_session_time_of_day for each session with the agreed value.",
      ].join("\n");

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
            text: `Failed to fetch sessions: ${err}`,
          },
        ],
      };
    }
  },
};
