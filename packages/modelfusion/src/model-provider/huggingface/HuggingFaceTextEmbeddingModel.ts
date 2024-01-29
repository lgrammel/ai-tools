import { z } from "zod";
import { FunctionCallOptions } from "../../core/FunctionOptions";
import { ApiConfiguration } from "../../core/api/ApiConfiguration";
import { callWithRetryAndThrottle } from "../../core/api/callWithRetryAndThrottle";
import {
  createJsonResponseHandler,
  postJsonToApi,
} from "../../core/api/postToApi";
import { zodSchema } from "../../core/schema/ZodSchema";
import { AbstractModel } from "../../model-function/AbstractModel";
import {
  EmbeddingModel,
  EmbeddingModelSettings,
} from "../../model-function/embed/EmbeddingModel";
import { HuggingFaceApiConfiguration } from "./HuggingFaceApiConfiguration";
import { failedHuggingFaceCallResponseHandler } from "./HuggingFaceError";

export interface HuggingFaceTextEmbeddingModelSettings
  extends EmbeddingModelSettings {
  api?: ApiConfiguration;

  model: string;

  maxValuesPerCall?: number;
  dimensions?: number;

  options?: {
    useCache?: boolean;
    waitForModel?: boolean;
  };
}

/**
 * Create a text embedding model that calls a Hugging Face Inference API Feature Extraction Task.
 *
 * @see https://huggingface.co/docs/api-inference/detailed_parameters#feature-extraction-task
 *
 * @example
 * const model = new HuggingFaceTextGenerationModel({
 *   model: "intfloat/e5-base-v2",
 *   maxTexstsPerCall: 5,
 *   retry: retryWithExponentialBackoff({ maxTries: 5 }),
 * });
 *
 * const embeddings = await embedMany(
 *   model,
 *   [
 *     "At first, Nox didn't know what to do with the pup.",
 *     "He keenly observed and absorbed everything around him, from the birds in the sky to the trees in the forest.",
 *   ]
 * );
 */
export class HuggingFaceTextEmbeddingModel
  extends AbstractModel<HuggingFaceTextEmbeddingModelSettings>
  implements EmbeddingModel<string, HuggingFaceTextEmbeddingModelSettings>
{
  constructor(settings: HuggingFaceTextEmbeddingModelSettings) {
    super({ settings });

    // There is no limit documented in the HuggingFace API. Use 1024 as a reasonable default.
    this.maxValuesPerCall = settings.maxValuesPerCall ?? 1024;
    this.dimensions = settings.dimensions;
  }

  readonly provider = "huggingface";
  get modelName() {
    return this.settings.model;
  }

  readonly maxValuesPerCall;
  readonly isParallelizable = true;

  readonly contextWindowSize = undefined;
  readonly dimensions;

  readonly tokenizer = undefined;

  async callAPI(
    texts: Array<string>,
    callOptions: FunctionCallOptions
  ): Promise<HuggingFaceTextEmbeddingResponse> {
    if (texts.length > this.maxValuesPerCall) {
      throw new Error(
        `The HuggingFace feature extraction API is configured to only support ${this.maxValuesPerCall} texts per API call.`
      );
    }

    const api = this.settings.api ?? new HuggingFaceApiConfiguration();
    const abortSignal = callOptions?.run?.abortSignal;

    return callWithRetryAndThrottle({
      retry: api.retry,
      throttle: api.throttle,
      call: async () =>
        postJsonToApi({
          url: api.assembleUrl(`/${this.settings.model}`),
          headers: api.headers({
            functionType: callOptions.functionType,
            functionId: callOptions.functionId,
            run: callOptions.run,
            callId: callOptions.callId,
          }),
          body: {
            inputs: texts,
            options: {
              use_cache: this.settings.options?.useCache ?? true,
              wait_for_model: this.settings.options?.waitForModel ?? true,
            },
          },
          failedResponseHandler: failedHuggingFaceCallResponseHandler,
          successfulResponseHandler: createJsonResponseHandler(
            zodSchema(huggingFaceTextEmbeddingResponseSchema)
          ),
          abortSignal,
        }),
    });
  }

  get settingsForEvent(): Partial<HuggingFaceTextEmbeddingModelSettings> {
    return {
      dimensions: this.settings.dimensions,
      options: this.settings.options,
    };
  }

  readonly countPromptTokens = undefined;

  async doEmbedValues(texts: string[], options: FunctionCallOptions) {
    const rawResponse = await this.callAPI(texts, options);

    return {
      rawResponse,
      embeddings: rawResponse,
    };
  }

  withSettings(
    additionalSettings: Partial<HuggingFaceTextEmbeddingModelSettings>
  ) {
    return new HuggingFaceTextEmbeddingModel(
      Object.assign({}, this.settings, additionalSettings)
    ) as this;
  }
}

const huggingFaceTextEmbeddingResponseSchema = z.array(z.array(z.number()));

export type HuggingFaceTextEmbeddingResponse = z.infer<
  typeof huggingFaceTextEmbeddingResponseSchema
>;
