import type { PartialDeep } from "type-fest";
import { FunctionOptions } from "../../core/FunctionOptions.js";
import { JsonSchemaProducer } from "../../core/schema/JsonSchemaProducer.js";
import { Schema } from "../../core/schema/Schema.js";
import { isDeepEqualData } from "../../util/isDeepEqualData.js";
import { ModelCallMetadata } from "../ModelCallMetadata.js";
import { executeStreamCall } from "../executeStreamCall.js";
import { ObjectStreamingModel } from "./ObjectGenerationModel.js";
import { ObjectStream } from "./ObjectStream.js";

/**
 * Generate and stream an object for a prompt and a schema.
 *
 * @see https://modelfusion.dev/guide/function/generate-object
 *
 * @example
 * const objectStream = await streamObject({
 *   model: openai.ChatTextGenerator(...).asFunctionCallObjectGenerationModel(...),
 *   schema: zodSchema(
 *     z.array(
 *       z.object({
 *         name: z.string(),
 *         class: z
 *           .string()
 *           .describe("Character class, e.g. warrior, mage, or thief."),
 *         description: z.string(),
 *       })
 *     ),
 *   prompt: [
 *     openai.ChatMessage.user(
 *       "Generate 3 character descriptions for a fantasy role playing game."
 *     ),
 *   ]
 * });
 *
 * for await (const { partialObject } of objectStream) {
 *   // ...
 * }
 *
 * @param {ObjectStreamingModel<PROMPT>} options.model - The model that generates the object
 * @param {Schema<OBJECT>} options.schema - The schema of the object to be generated.
 * @param {PROMPT | ((schema: Schema<OBJECT>) => PROMPT)} options.prompt
 * The prompt to be used.
 * You can also pass a function that takes the schema as an argument and returns the prompt.
 */
export async function streamObject<OBJECT, PROMPT>(
  args: {
    model: ObjectStreamingModel<PROMPT>;
    schema: Schema<OBJECT> & JsonSchemaProducer;
    prompt: PROMPT | ((schema: Schema<OBJECT>) => PROMPT);
    fullResponse?: false;
  } & FunctionOptions
): Promise<ObjectStream<OBJECT>>;
export async function streamObject<OBJECT, PROMPT>(
  args: {
    model: ObjectStreamingModel<PROMPT>;
    schema: Schema<OBJECT> & JsonSchemaProducer;
    prompt: PROMPT | ((schema: Schema<OBJECT>) => PROMPT);
    fullResponse: true;
  } & FunctionOptions
): Promise<{
  objectStream: ObjectStream<OBJECT>;
  objectPromise: PromiseLike<OBJECT>;
  metadata: Omit<ModelCallMetadata, "durationInMs" | "finishTimestamp">;
}>;
export async function streamObject<OBJECT, PROMPT>({
  model,
  schema,
  prompt,
  fullResponse,
  ...options
}: {
  model: ObjectStreamingModel<PROMPT>;
  schema: Schema<OBJECT> & JsonSchemaProducer;
  prompt: PROMPT | ((schema: Schema<OBJECT>) => PROMPT);
  fullResponse?: boolean;
} & FunctionOptions): Promise<
  | ObjectStream<OBJECT>
  | {
      objectStream: ObjectStream<OBJECT>;
      objectPromise: PromiseLike<OBJECT>;
      metadata: Omit<ModelCallMetadata, "durationInMs" | "finishTimestamp">;
    }
> {
  // Note: PROMPT must not be a function.
  const expandedPrompt =
    typeof prompt === "function"
      ? (prompt as (schema: Schema<OBJECT>) => PROMPT)(schema)
      : prompt;

  let accumulatedText = "";
  let accumulatedTextDelta = "";
  let latestObject: unknown | undefined;

  let resolveObject: (value: OBJECT) => void;
  let rejectObject: (reason: unknown) => void;
  const objectPromise = new Promise<OBJECT>((resolve, reject) => {
    resolveObject = resolve;
    rejectObject = reject;
  });

  const callResponse = await executeStreamCall<
    unknown,
    {
      partialObject: PartialDeep<OBJECT>;
      partialText: string;
      textDelta: string;
    },
    ObjectStreamingModel<PROMPT>
  >({
    functionType: "stream-object",
    input: {
      schema,
      prompt: expandedPrompt,
    },
    model,
    options,
    startStream: async (options) =>
      model.doStreamObject(schema, expandedPrompt, options),

    processDelta(delta) {
      const textDelta = model.extractObjectTextDelta(delta.deltaValue);

      if (textDelta == null) {
        return undefined;
      }

      accumulatedText += textDelta;
      accumulatedTextDelta += textDelta;

      const currentObject = model.parseAccumulatedObjectText(accumulatedText);

      // only send a new part into the stream when the partial object has changed:
      if (!isDeepEqualData(latestObject, currentObject)) {
        latestObject = currentObject;

        // reset delta accumulation:
        const currentAccumulatedTextDelta = accumulatedTextDelta;
        accumulatedTextDelta = "";

        // TODO add type checking
        return {
          partialObject: latestObject as PartialDeep<
            OBJECT,
            { recurseIntoArrays: true }
          >,
          partialText: accumulatedText,
          textDelta: currentAccumulatedTextDelta,
        };
      }

      return undefined;
    },

    // The last object is processed and returned, even if it was already returned previously.
    // The reason is that the full text delta should be returned (and no characters should be omitted).
    processFinished() {
      return {
        partialObject: latestObject as PartialDeep<
          OBJECT,
          { recurseIntoArrays: true }
        >,
        partialText: accumulatedText,
        textDelta: accumulatedTextDelta,
      };
    },

    onDone() {
      // process the final result (full type validation):
      const parseResult = schema.validate(latestObject);

      if (parseResult.success) {
        resolveObject(parseResult.value);
      } else {
        rejectObject(parseResult.error);
      }
    },
  });

  return fullResponse
    ? {
        objectStream: callResponse.value,
        objectPromise: objectPromise,
        metadata: callResponse.metadata,
      }
    : callResponse.value;
}
