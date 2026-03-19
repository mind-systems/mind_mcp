import { z } from "zod";
import { patchSession } from "../api/client.js";

const inputSchema = {
  sessionId: z.string().describe("The ID of the breathing session to update"),
  timeOfDay: z
    .enum(["morning", "midday", "evening"])
    .describe("The time of day to assign to this session"),
};

export const setTimeOfDayTool = {
  name: "set_session_time_of_day",
  description:
    "Update a breathing session's timeOfDay field to morning, midday, or evening.",
  inputSchema,
  handler: async (input: {
    sessionId: string;
    timeOfDay: "morning" | "midday" | "evening";
  }) => {
    try {
      const updated = await patchSession(input.sessionId, {
        timeOfDay: input.timeOfDay,
      });
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(updated, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Failed to update session: ${err}`,
          },
        ],
      };
    }
  },
};
