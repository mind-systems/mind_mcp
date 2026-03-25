import { z } from "zod";
import { fetchSession } from "../api/grpc-client.js";

const inputSchema = {
  id: z.string().describe("ID of the breath session to retrieve"),
};

export const getSessionTool = {
  name: "get_breath_session",
  description: "Fetch full details of a single breathing session by ID, including exercises.",
  inputSchema,
  handler: async (input: { id: string }) => {
    try {
      const session = await fetchSession(input.id);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(session, null, 2),
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
