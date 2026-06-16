import { z } from "zod";
import { fetchSessions } from "../api/grpc-client.js";

const inputSchema = {
  pageSize: z.number().optional().describe("Number of sessions per page (default 10)"),
};

export const listSessionsTool = {
  name: "list_my_breath_sessions",
  description:
    "Fetch a compact list of breathing sessions visible to the authenticated user, grouped by section: STARRED (starred by me), MINE (my own), SHARED (others' shared). Use get_breath_session for full details including exercises.",
  inputSchema,
  handler: async (input: { pageSize?: number }) => {
    try {
      const result = await fetchSessions({ pageSize: input.pageSize });
      const compact = {
        items: result.items.map(({ session, section }) => ({
          id: session.id,
          description: session.description,
          complexity: session.complexity,
          timeOfDay: session.timeOfDay,
          shared: session.shared,
          isStarred: session.isStarred,
          section,
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
