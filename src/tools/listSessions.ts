import { z } from "zod";
import { fetchSessions } from "../api/client.js";

const inputSchema = {
  page: z.number().optional().describe("Page number (1-based)"),
  pageSize: z.number().optional().describe("Number of sessions per page"),
};

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description: "Fetch the authenticated user's breathing sessions.",
  inputSchema,
  handler: async (input: { page?: number; pageSize?: number }) => {
    try {
      const result = await fetchSessions(input.page, input.pageSize);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(result, null, 2),
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
