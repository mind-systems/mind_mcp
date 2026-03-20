import { z } from "zod";
import { fetchSessions } from "../api/client.js";

const inputSchema = {
  page: z.number().optional().describe("Page number (1-based)"),
  pageSize: z.number().optional().describe("Number of sessions per page"),
};

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description: "Fetch a compact list of the authenticated user's breathing sessions (id, description, complexity, timeOfDay, shared). Use get_breath_session for full details including exercises.",
  inputSchema,
  handler: async (input: { page?: number; pageSize?: number }) => {
    try {
      const result = await fetchSessions(input.page, input.pageSize);
      const compact = {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        data: result.data.map(({ id, description, complexity, timeOfDay, shared }) => ({
          id,
          description,
          complexity,
          timeOfDay,
          shared,
        })),
      };
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(compact, null, 2),
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
