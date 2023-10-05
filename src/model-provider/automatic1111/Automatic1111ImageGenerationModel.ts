import { z } from "zod";
import { FunctionOptions } from "../../core/FunctionOptions.js";
import { ApiConfiguration } from "../../core/api/ApiConfiguration.js";
import { callWithRetryAndThrottle } from "../../core/api/callWithRetryAndThrottle.js";
import {
  createJsonResponseHandler,
  postJsonToApi,
} from "../../core/api/postToApi.js";
import { AbstractModel } from "../../model-function/AbstractModel.js";
import {
  ImageGenerationModel,
  ImageGenerationModelSettings,
} from "../../model-function/generate-image/ImageGenerationModel.js";
import { Automatic1111ApiConfiguration } from "./Automatic1111ApiConfiguration.js";
import { failedAutomatic1111CallResponseHandler } from "./Automatic1111Error.js";

/**
 * Create an image generation model that calls the AUTOMATIC1111 Stable Diffusion Web UI API.
 *
 * @see https://github.com/AUTOMATIC1111/stable-diffusion-webui
 */
export class Automatic1111ImageGenerationModel
  extends AbstractModel<Automatic1111ImageGenerationModelSettings>
  implements
    ImageGenerationModel<
      A111ImageGenerationPrompt,
      Automatic1111ImageGenerationModelSettings
    >
{
  constructor(settings: Automatic1111ImageGenerationModelSettings) {
    super({ settings });
  }

  readonly provider = "Automatic1111" as const;

  get modelName() {
    return this.settings.model;
  }

  async callAPI(
    input: A111ImageGenerationPrompt,
    options?: FunctionOptions
  ): Promise<Automatic1111ImageGenerationResponse> {
    return callWithRetryAndThrottle({
      retry: this.settings.api?.retry,
      throttle: this.settings.api?.throttle,
      call: async () =>
        callAutomatic1111ImageGenerationAPI({
          ...this.settings,

          abortSignal: options?.run?.abortSignal,
          prompt: input.prompt,
        }),
    });
  }

  get settingsForEvent(): Partial<Automatic1111ImageGenerationModelSettings> {
    return {
      height: this.settings.height,
      width: this.settings.width,
      sampler: this.settings.sampler,
      steps: this.settings.steps,
    };
  }

  async doGenerateImage(
    prompt: A111ImageGenerationPrompt,
    options?: FunctionOptions
  ) {
    const response = await this.callAPI(prompt, options);

    return {
      response,
      base64Image: response.images[0],
    };
  }

  withSettings(additionalSettings: Automatic1111ImageGenerationModelSettings) {
    return new Automatic1111ImageGenerationModel(
      Object.assign({}, this.settings, additionalSettings)
    ) as this;
  }
}

export interface Automatic1111ImageGenerationModelSettings
  extends ImageGenerationModelSettings {
  api?: ApiConfiguration;

  model: string;

  height?: number;
  width?: number;
  sampler?: string;
  steps?: number;
}

const Automatic1111ImageGenerationResponseSchema = z.object({
  images: z.array(z.string()),
  parameters: z.object({}),
  info: z.string(),
});

export type Automatic1111ImageGenerationResponse = z.infer<
  typeof Automatic1111ImageGenerationResponseSchema
>;

export type A111ImageGenerationPrompt = {
  prompt: string;
  negativePrompt?: string;
  seed?: number;
};

async function callAutomatic1111ImageGenerationAPI({
  api = new Automatic1111ApiConfiguration(),
  abortSignal,
  height,
  width,
  prompt,
  negativePrompt,
  sampler,
  steps,
  seed,
  model,
}: {
  api?: ApiConfiguration;
  abortSignal?: AbortSignal;
  height?: number;
  width?: number;
  prompt: string;
  negativePrompt?: string;
  sampler?: string;
  steps?: number;
  seed?: number;
  model?: string;
}): Promise<Automatic1111ImageGenerationResponse> {
  return postJsonToApi({
    url: api.assembleUrl(`/txt2img`),
    headers: api.headers,
    body: {
      height,
      width,
      prompt,
      negative_prompt: negativePrompt,
      sampler_index: sampler,
      steps,
      seed,
      override_settings: {
        sd_model_checkpoint: model,
      },
    },
    failedResponseHandler: failedAutomatic1111CallResponseHandler,
    successfulResponseHandler: createJsonResponseHandler(
      Automatic1111ImageGenerationResponseSchema
    ),
    abortSignal,
  });
}
