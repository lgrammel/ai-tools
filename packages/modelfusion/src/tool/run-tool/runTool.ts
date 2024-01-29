import { FunctionOptions } from "../../core/FunctionOptions";
import { executeFunctionCall } from "../../core/executeFunctionCall";
import { Tool } from "../Tool";
import { ToolCallResult } from "../ToolCallResult";
import { safeExecuteToolCall } from "../execute-tool/safeExecuteToolCall";
import {
  ToolCallGenerationModel,
  ToolCallGenerationModelSettings,
} from "../generate-tool-call/ToolCallGenerationModel";
import { generateToolCall } from "../generate-tool-call/generateToolCall";

/**
 * `runTool` uses `generateToolCall` to generate parameters for a tool and
 * then executes the tool with the parameters using `executeTool`.
 *
 * @returns The result contains the name of the tool (`tool` property),
 * the parameters (`parameters` property, typed),
 * and the result of the tool execution (`result` property, typed).
 *
 * @see {@link generateToolCall}
 * @see {@link executeTool}
 */
export async function runTool<
  PROMPT,
  // Using 'any' is required to allow for flexibility in the inputs. The actual types are
  // retrieved through lookups such as TOOL["name"], such that any does not affect any client.
  TOOL extends Tool<string, any, any>, // eslint-disable-line @typescript-eslint/no-explicit-any
>({
  model,
  tool,
  prompt,
  ...options
}: {
  model: ToolCallGenerationModel<PROMPT, ToolCallGenerationModelSettings>;
  tool: TOOL;
  prompt: PROMPT | ((tool: TOOL) => PROMPT);
} & FunctionOptions): Promise<
  ToolCallResult<
    TOOL["name"],
    TOOL["parameters"],
    Awaited<ReturnType<TOOL["execute"]>>
  >
> {
  // Note: PROMPT must not be a function.
  const expandedPrompt =
    typeof prompt === "function"
      ? (prompt as (tool: TOOL) => PROMPT)(tool)
      : prompt;

  return executeFunctionCall({
    options,
    input: expandedPrompt,
    functionType: "run-tool",
    execute: async (options) =>
      safeExecuteToolCall(
        tool,
        await generateToolCall<
          TOOL["parameters"],
          PROMPT,
          TOOL["name"],
          ToolCallGenerationModelSettings
        >({ model, tool, prompt: expandedPrompt, ...options }),
        options
      ),
  });
}
