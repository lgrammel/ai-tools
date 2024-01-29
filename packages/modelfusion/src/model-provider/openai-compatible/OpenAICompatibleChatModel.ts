import {
  FlexibleObjectFromTextPromptTemplate,
  ObjectFromTextPromptTemplate,
} from "../../model-function/generate-object/ObjectFromTextPromptTemplate";
import { ObjectFromTextStreamingModel } from "../../model-function/generate-object/ObjectFromTextStreamingModel";
import { PromptTemplateFullTextModel } from "../../model-function/generate-text/PromptTemplateFullTextModel";
import {
  TextStreamingBaseModel,
  TextStreamingModel,
  textGenerationModelProperties,
} from "../../model-function/generate-text/TextGenerationModel";
import { TextGenerationPromptTemplate } from "../../model-function/generate-text/TextGenerationPromptTemplate";
import { ToolCallGenerationModel } from "../../tool/generate-tool-call/ToolCallGenerationModel";
import { ToolCallsGenerationModel } from "../../tool/generate-tool-calls/ToolCallsGenerationModel";
import {
  AbstractOpenAIChatModel,
  AbstractOpenAIChatSettings,
  OpenAIChatPrompt,
} from "../openai/AbstractOpenAIChatModel";
import { chat, instruction, text } from "../openai/OpenAIChatPromptTemplate";
import {
  OpenAICompatibleApiConfiguration,
  OpenAICompatibleProviderName,
} from "./OpenAICompatibleApiConfiguration";

export interface OpenAICompatibleChatSettings
  extends AbstractOpenAIChatSettings {
  api: OpenAICompatibleApiConfiguration; // required
  provider?: OpenAICompatibleProviderName;
}

/**
 * Create a text generation model that calls an API that is compatible with OpenAI's chat API.
 *
 * Please note that many providers implement the API with slight differences, which can cause
 * unexpected errors and different behavior in less common scenarios.
 *
 * @see https://platform.openai.com/docs/api-reference/chat/create
 */
export class OpenAICompatibleChatModel
  extends AbstractOpenAIChatModel<OpenAICompatibleChatSettings>
  implements
    TextStreamingBaseModel<OpenAIChatPrompt, OpenAICompatibleChatSettings>,
    ToolCallGenerationModel<OpenAIChatPrompt, OpenAICompatibleChatSettings>,
    ToolCallsGenerationModel<OpenAIChatPrompt, OpenAICompatibleChatSettings>
{
  constructor(settings: OpenAICompatibleChatSettings) {
    super(settings);
  }

  get provider(): OpenAICompatibleProviderName {
    return (
      this.settings.provider ?? this.settings.api.provider ?? "openaicompatible"
    );
  }

  get modelName() {
    return this.settings.model;
  }

  readonly contextWindowSize = undefined;
  readonly tokenizer = undefined;
  readonly countPromptTokens = undefined;

  get settingsForEvent(): Partial<OpenAICompatibleChatSettings> {
    const eventSettingProperties: Array<string> = [
      ...textGenerationModelProperties,

      "functions",
      "functionCall",
      "temperature",
      "topP",
      "presencePenalty",
      "frequencyPenalty",
      "logitBias",
      "seed",
      "responseFormat",
    ] satisfies (keyof OpenAICompatibleChatSettings)[];

    return Object.fromEntries(
      Object.entries(this.settings).filter(([key]) =>
        eventSettingProperties.includes(key)
      )
    );
  }

  asObjectGenerationModel<INPUT_PROMPT, OpenAIChatPrompt>(
    promptTemplate:
      | ObjectFromTextPromptTemplate<INPUT_PROMPT, OpenAIChatPrompt>
      | FlexibleObjectFromTextPromptTemplate<INPUT_PROMPT, unknown>
  ) {
    return "adaptModel" in promptTemplate
      ? new ObjectFromTextStreamingModel({
          model: promptTemplate.adaptModel(this),
          template: promptTemplate,
        })
      : new ObjectFromTextStreamingModel({
          model: this as TextStreamingModel<OpenAIChatPrompt>,
          template: promptTemplate,
        });
  }

  withTextPrompt() {
    return this.withPromptTemplate(text());
  }

  withInstructionPrompt() {
    return this.withPromptTemplate(instruction());
  }

  withChatPrompt() {
    return this.withPromptTemplate(chat());
  }

  withPromptTemplate<INPUT_PROMPT>(
    promptTemplate: TextGenerationPromptTemplate<INPUT_PROMPT, OpenAIChatPrompt>
  ): PromptTemplateFullTextModel<
    INPUT_PROMPT,
    OpenAIChatPrompt,
    OpenAICompatibleChatSettings,
    this
  > {
    return new PromptTemplateFullTextModel({
      model: this.withSettings({
        stopSequences: [
          ...(this.settings.stopSequences ?? []),
          ...promptTemplate.stopSequences,
        ],
      }),
      promptTemplate,
    });
  }

  withJsonOutput() {
    return this.withSettings({ responseFormat: { type: "json_object" } });
  }

  withSettings(additionalSettings: Partial<OpenAICompatibleChatSettings>) {
    return new OpenAICompatibleChatModel(
      Object.assign({}, this.settings, additionalSettings)
    ) as this;
  }
}
