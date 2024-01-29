import { PromptTemplate } from "../PromptTemplate";

/**
 * Prompt templates format a source prompt as a target prompt.
 */
export interface TextGenerationPromptTemplate<SOURCE_PROMPT, TARGET_PROMPT>
  extends PromptTemplate<SOURCE_PROMPT, TARGET_PROMPT> {
  /**
   * The texts that should be used as default stop sequences.
   * This is e.g. important for chat formats.
   */
  stopSequences: string[];
}
