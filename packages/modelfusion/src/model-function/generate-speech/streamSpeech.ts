import { FunctionOptions } from "../../core/FunctionOptions";
import { AsyncQueue } from "../../util/AsyncQueue";
import { ModelCallMetadata } from "../ModelCallMetadata";
import { executeStreamCall } from "../executeStreamCall";
import {
  SpeechGenerationModelSettings,
  StreamingSpeechGenerationModel,
} from "./SpeechGenerationModel";

/**
 * Stream synthesized speech from text. Also called text-to-speech (TTS).
 * Duplex streaming where both the input and output are streamed is supported.
 *
 * @see https://modelfusion.dev/guide/function/generate-speech
 *
 * @example
 * const textStream = await streamText(...);
 *
 * const speechStream = await streamSpeech({
 *   model: elevenlabs.SpeechGenerator(...),
 *   text: textStream
 * });
 *
 * for await (const speechPart of speechStream) {
 *   // ...
 * }
 *
 * @param {StreamingSpeechGenerationModel<SpeechGenerationModelSettings>} model - The speech generation model.
 * @param {AsyncIterable<string> | string} text - The text to be converted to speech. Can be a string or an async iterable of strings.
 * @param {FunctionOptions} [options] - Optional function options.
 *
 * @returns {AsyncIterableResultPromise<Uint8Array>} An async iterable promise that contains the synthesized speech chunks.
 */
export async function streamSpeech(
  args: {
    model: StreamingSpeechGenerationModel<SpeechGenerationModelSettings>;
    text: AsyncIterable<string> | string;
    fullResponse?: false;
  } & FunctionOptions
): Promise<AsyncIterable<Uint8Array>>;
export async function streamSpeech(
  args: {
    model: StreamingSpeechGenerationModel<SpeechGenerationModelSettings>;
    text: AsyncIterable<string> | string;
    fullResponse: true;
  } & FunctionOptions
): Promise<{
  speechStream: AsyncIterable<Uint8Array>;
  metadata: Omit<ModelCallMetadata, "durationInMs" | "finishTimestamp">;
}>;
export async function streamSpeech({
  model,
  text,
  fullResponse,
  ...options
}: {
  model: StreamingSpeechGenerationModel<SpeechGenerationModelSettings>;
  text: AsyncIterable<string> | string;
  fullResponse?: boolean;
} & FunctionOptions): Promise<
  | AsyncIterable<Uint8Array>
  | {
      speechStream: AsyncIterable<Uint8Array>;
      metadata: Omit<ModelCallMetadata, "durationInMs" | "finishTimestamp">;
    }
> {
  let textStream: AsyncIterable<string>;

  // simulate a stream with a single value for a string input:
  if (typeof text === "string") {
    const queue = new AsyncQueue<string>();
    queue.push(text);
    queue.close();
    textStream = queue;
  } else {
    textStream = text;
  }

  const callResponse = await executeStreamCall({
    functionType: "stream-speech",
    input: text,
    model,
    options,
    startStream: async (options) =>
      model.doGenerateSpeechStreamDuplex(textStream, options),
    processDelta: (delta) => delta.deltaValue,
  });

  return fullResponse
    ? {
        speechStream: callResponse.value,
        metadata: callResponse.metadata,
      }
    : callResponse.value;
}
