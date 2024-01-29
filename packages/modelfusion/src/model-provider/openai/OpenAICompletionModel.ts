import { PromptTemplateTextStreamingModel } from "../../model-function/generate-text/PromptTemplateTextStreamingModel";
import {
  TextStreamingBaseModel,
  textGenerationModelProperties,
} from "../../model-function/generate-text/TextGenerationModel";
import { TextGenerationPromptTemplate } from "../../model-function/generate-text/TextGenerationPromptTemplate";
import {
  chat,
  instruction,
  text,
} from "../../model-function/generate-text/prompt-template/TextPromptTemplate";
import { countTokens } from "../../model-function/tokenize-text/countTokens";
import {
  AbstractOpenAICompletionModel,
  AbstractOpenAICompletionModelSettings,
  OpenAICompletionResponse,
} from "./AbstractOpenAICompletionModel";
import { TikTokenTokenizer } from "./TikTokenTokenizer";

/**
 * @see https://platform.openai.com/docs/models/
 * @see https://openai.com/pricing
 */
export const OPENAI_TEXT_GENERATION_MODELS = {
  "gpt-3.5-turbo-instruct": {
    contextWindowSize: 4097,
    promptTokenCostInMillicents: 0.15,
    completionTokenCostInMillicents: 0.2,
  },
};

export function getOpenAICompletionModelInformation(
  model: OpenAICompletionModelType
): {
  contextWindowSize: number;
  promptTokenCostInMillicents: number;
  completionTokenCostInMillicents: number;
} {
  return OPENAI_TEXT_GENERATION_MODELS[model];
}

export type OpenAICompletionModelType =
  keyof typeof OPENAI_TEXT_GENERATION_MODELS;

export const isOpenAICompletionModel = (
  model: string
): model is OpenAICompletionModelType => model in OPENAI_TEXT_GENERATION_MODELS;

export const calculateOpenAICompletionCostInMillicents = ({
  model,
  response,
}: {
  model: OpenAICompletionModelType;
  response: OpenAICompletionResponse;
}) => {
  const modelInformation = getOpenAICompletionModelInformation(model);

  return (
    response.usage.prompt_tokens *
      modelInformation.promptTokenCostInMillicents +
    response.usage.completion_tokens *
      modelInformation.completionTokenCostInMillicents
  );
};

export interface OpenAICompletionModelSettings
  extends AbstractOpenAICompletionModelSettings {
  model: OpenAICompletionModelType;
}

/**
 * Create a text generation model that calls the OpenAI text completion API.
 *
 * @see https://platform.openai.com/docs/api-reference/completions/create
 *
 * @example
 * const model = new OpenAICompletionModel({
 *   model: "gpt-3.5-turbo-instruct",
 *   temperature: 0.7,
 *   maxGenerationTokens: 500,
 *   retry: retryWithExponentialBackoff({ maxTries: 5 }),
 * });
 *
 * const text = await generateText(
 *   model,
 *   "Write a short story about a robot learning to love:\n\n"
 * );
 */
export class OpenAICompletionModel
  extends AbstractOpenAICompletionModel<OpenAICompletionModelSettings>
  implements TextStreamingBaseModel<string, OpenAICompletionModelSettings>
{
  constructor(settings: OpenAICompletionModelSettings) {
    super(settings);

    const modelInformation = getOpenAICompletionModelInformation(
      this.settings.model
    );

    this.tokenizer = new TikTokenTokenizer({
      model: this.settings.model,
    });
    this.contextWindowSize = modelInformation.contextWindowSize;
  }

  readonly provider = "openai" as const;
  get modelName() {
    return this.settings.model;
  }

  readonly contextWindowSize: number;
  readonly tokenizer: TikTokenTokenizer;

  async countPromptTokens(input: string) {
    return countTokens(this.tokenizer, input);
  }

  get settingsForEvent(): Partial<OpenAICompletionModelSettings> {
    const eventSettingProperties: Array<string> = [
      ...textGenerationModelProperties,

      "suffix",
      "temperature",
      "topP",
      "logprobs",
      "echo",
      "presencePenalty",
      "frequencyPenalty",
      "bestOf",
      "logitBias",
      "seed",
    ] satisfies (keyof OpenAICompletionModelSettings)[];

    return Object.fromEntries(
      Object.entries(this.settings).filter(([key]) =>
        eventSettingProperties.includes(key)
      )
    );
  }

  withTextPrompt() {
    return this.withPromptTemplate(text());
  }

  withInstructionPrompt() {
    return this.withPromptTemplate(instruction());
  }

  withChatPrompt(options?: { user?: string; assistant?: string }) {
    return this.withPromptTemplate(chat(options));
  }

  withPromptTemplate<INPUT_PROMPT>(
    promptTemplate: TextGenerationPromptTemplate<INPUT_PROMPT, string>
  ): PromptTemplateTextStreamingModel<
    INPUT_PROMPT,
    string,
    OpenAICompletionModelSettings,
    this
  > {
    return new PromptTemplateTextStreamingModel({
      model: this.withSettings({
        stopSequences: [
          ...(this.settings.stopSequences ?? []),
          ...promptTemplate.stopSequences,
        ],
      }),
      promptTemplate,
    });
  }

  withSettings(additionalSettings: Partial<OpenAICompletionModelSettings>) {
    return new OpenAICompletionModel(
      Object.assign({}, this.settings, additionalSettings)
    ) as this;
  }
}
