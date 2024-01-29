import {
  PromptFunction,
  expandPrompt,
  isPromptFunction,
} from "../../core/PromptFunction";
import { FunctionOptions } from "../../core/FunctionOptions";
import { JsonSchemaProducer } from "../../core/schema/JsonSchemaProducer";
import { Schema } from "../../core/schema/Schema";
import { ModelCallMetadata } from "../ModelCallMetadata";
import { executeStandardCall } from "../executeStandardCall";
import {
  ObjectGenerationModel,
  ObjectGenerationModelSettings,
} from "./ObjectGenerationModel";
import { ObjectValidationError } from "./ObjectValidationError";

/**
 * Generate a typed object for a prompt and a schema.
 *
 * @see https://modelfusion.dev/guide/function/generate-object
 *
 * @example
 * const sentiment = await generateObject({
 *   model: openai.ChatTextGenerator(...).asFunctionCallObjectGenerationModel(...),
 *
 *   schema: zodSchema(z.object({
 *     sentiment: z
 *       .enum(["positive", "neutral", "negative"])
 *       .describe("Sentiment."),
 *   })),
 *
 *   prompt: [
 *     openai.ChatMessage.system(
 *       "You are a sentiment evaluator. " +
 *         "Analyze the sentiment of the following product review:"
 *     ),
 *     openai.ChatMessage.user(
 *       "After I opened the package, I was met by a very unpleasant smell " +
 *         "that did not disappear even after washing. Never again!"
 *     ),
 *   ]
 * });
 *
 * @param {ObjectGenerationModel<PROMPT, SETTINGS>} options.model - The model to generate the object.
 * @param {Schema<OBJECT>} options.schema - The schema to be used.
 * @param {PROMPT | ((schema: Schema<OBJECT>) => PROMPT)} options.prompt
 * The prompt to be used.
 * You can also pass a function that takes the schema as an argument and returns the prompt.
 *
 * @returns {Promise<OBJECT>} - Returns a promise that resolves to the generated object.
 */
export async function generateObject<
  OBJECT,
  PROMPT,
  SETTINGS extends ObjectGenerationModelSettings,
>(
  args: {
    model: ObjectGenerationModel<PROMPT, SETTINGS>;
    schema: Schema<OBJECT> & JsonSchemaProducer;
    prompt:
      | PROMPT
      | PromptFunction<unknown, PROMPT>
      | ((schema: Schema<OBJECT>) => PROMPT | PromptFunction<unknown, PROMPT>);
    fullResponse?: false;
  } & FunctionOptions
): Promise<OBJECT>;
export async function generateObject<
  OBJECT,
  PROMPT,
  SETTINGS extends ObjectGenerationModelSettings,
>(
  args: {
    model: ObjectGenerationModel<PROMPT, SETTINGS>;
    schema: Schema<OBJECT> & JsonSchemaProducer;
    prompt:
      | PROMPT
      | PromptFunction<unknown, PROMPT>
      | ((schema: Schema<OBJECT>) => PROMPT | PromptFunction<unknown, PROMPT>);
    fullResponse: true;
  } & FunctionOptions
): Promise<{
  value: OBJECT;
  rawResponse: unknown;
  metadata: ModelCallMetadata;
}>;
export async function generateObject<
  OBJECT,
  PROMPT,
  SETTINGS extends ObjectGenerationModelSettings,
>({
  model,
  schema,
  prompt,
  fullResponse,
  ...options
}: {
  model: ObjectGenerationModel<PROMPT, SETTINGS>;
  schema: Schema<OBJECT> & JsonSchemaProducer;
  prompt:
    | PROMPT
    | PromptFunction<unknown, PROMPT>
    | ((schema: Schema<OBJECT>) => PROMPT | PromptFunction<unknown, PROMPT>);
  fullResponse?: boolean;
} & FunctionOptions): Promise<
  | OBJECT
  | {
      value: OBJECT;
      rawResponse: unknown;
      metadata: ModelCallMetadata;
    }
> {
  // Resolve the prompt if it is a function (and not a PromptFunction)
  const resolvedPrompt =
    typeof prompt === "function" && !isPromptFunction(prompt)
      ? (prompt as (schema: Schema<OBJECT>) => PROMPT)(schema)
      : prompt;

  const expandedPrompt = await expandPrompt(resolvedPrompt);

  const callResponse = await executeStandardCall({
    functionType: "generate-object",
    input: {
      schema,
      ...expandedPrompt,
    },
    model,
    options,
    generateResponse: async (options) => {
      const result = await model.doGenerateObject(
        schema,
        expandedPrompt.prompt,
        options
      );

      const parseResult = schema.validate(result.value);

      if (!parseResult.success) {
        throw new ObjectValidationError({
          valueText: result.valueText,
          value: result.value,
          cause: parseResult.error,
        });
      }

      const value = parseResult.value;

      return {
        rawResponse: result.rawResponse,
        extractedValue: value,
        usage: result.usage,
      };
    },
  });

  return fullResponse
    ? {
        value: callResponse.value,
        rawResponse: callResponse.rawResponse,
        metadata: callResponse.metadata,
      }
    : callResponse.value;
}
