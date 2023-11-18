import dotenv from "dotenv";
import {
  OpenAIChatMessage,
  OpenAIChatModel,
  Tool,
  ToolExecutionError,
  ZodSchema,
  useTool,
} from "modelfusion";
import { z } from "zod";

dotenv.config();

export const calculatorThatThrowsError = new Tool({
  name: "calculator",
  description: "Execute a calculation",

  parameters: new ZodSchema(
    z.object({
      a: z.number().describe("The first number."),
      b: z.number().describe("The second number."),
      operator: z
        .enum(["+", "-", "*", "/"])
        .describe("The operator (+, -, *, /)."),
    })
  ),

  execute: async () => {
    throw new Error("This tool always throws an error.");
  },
});

async function main() {
  const { tool, toolCall, args, ok, result } = await useTool(
    new OpenAIChatModel({ model: "gpt-3.5-turbo" }),
    calculatorThatThrowsError,
    [OpenAIChatMessage.user("What's fourteen times twelve?")]
  );

  console.log(`Tool call`, toolCall);
  console.log(`Tool: ${tool}`);
  console.log(`Arguments: ${JSON.stringify(args)}`);
  console.log(`Ok: ${ok}`);
  console.log(`Result: ${result}`);
}

main().catch(console.error);
