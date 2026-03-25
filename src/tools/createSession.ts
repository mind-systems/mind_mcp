import { z } from "zod";
import { createSession } from "../api/grpc-client.js";

const inputSchema = {
  description: z
    .string()
    .describe("Descriptive name or summary of the breathing session"),
  exercises: z
    .array(
      z.object({
        steps: z
          .array(
            z.object({
              type: z.enum(["inhale", "exhale", "hold"]),
              duration: z.number().min(0).describe("Duration in seconds"),
            }),
          )
          .min(1)
          .describe("Sequence of breath steps for this exercise"),
        restDuration: z
          .number()
          .min(0)
          .describe("Rest between repeats in seconds"),
        repeatCount: z
          .number()
          .min(1)
          .describe("Number of times to repeat this exercise"),
      }),
    )
    .min(1)
    .describe("List of exercises that make up the session"),
  timeOfDay: z
    .enum(["morning", "midday", "evening"])
    .optional()
    .describe("When this session is best suited for"),
  shared: z
    .boolean()
    .optional()
    .describe("Whether to make the session publicly visible (default false)"),
};

export const createSessionTool = {
  name: "create_breath_session",
  description:
    "Create a new breathing session via the Mind API. " +
    "The AI agent is responsible for designing the exercises based on the user's goal, " +
    "desired difficulty, and time of day — this tool handles validation and API submission. " +
    "\n\nExercise structure: each exercise has a `steps` array (sequence of inhale/exhale/hold steps), " +
    "a `restDuration` (milliseconds of rest between repeats), and a `repeatCount` (how many times to repeat). " +
    "\n\nTypical ranges: step durations 1–10s, rest 1–5s, repeatCount 1–10. " +
    "Do NOT provide a `complexity` field — it is computed server-side. " +
    "\n\nExamples of exercise design by goal:\n" +
    "- Calming/sleep (evening): slow exhales longer than inhales, low repeatCount, generous rest\n" +
    "- Energising (morning): equal or longer inhales, higher repeatCount, shorter rest\n" +
    "- Focus (midday): box breathing (equal inhale/hold/exhale/hold), moderate repeatCount",
  inputSchema,
  handler: async (input: {
    description: string;
    exercises: {
      steps: { type: "inhale" | "exhale" | "hold"; duration: number }[];
      restDuration: number;
      repeatCount: number;
    }[];
    timeOfDay?: "morning" | "midday" | "evening";
    shared?: boolean;
  }) => {
    try {
      const created = await createSession(input);
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(created, null, 2),
          },
        ],
      };
    } catch (err) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Failed to create session: ${err}`,
          },
        ],
      };
    }
  },
};
