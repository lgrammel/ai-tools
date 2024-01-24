---
sidebar_position: 18
---

# Guards

**Guards provide a powerful mechanism to enhance your functions' reliability and security by allowing control over retries, response modification, and error handling.** Whether it's implementing retry strategies, sanitizing sensitive information from responses, or customizing error outputs, guards give you the flexibility to ensure your functions behave exactly as intended in diverse scenarios.

The guard function wraps any existing function, e.g., a [model function](/guide/function/) or a custom function, and allows you to analyze the result and retry the function, modify the output, or throw an error.

## Understanding the Guard Function

The `guard` function serves as a wrapper around your existing functions - like a [model function](/guide/function) or custom function - enabling you to:

- Analyze the results once computed.
- Retry the function if necessary, with a limit on the number of retries.
- Modify the output that is returned.
- Throw custom errors.

```ts
// `guard` function definition
function guard(
  fn: (input: Input) => Promise<Output>, // the original function being wrapped
  input: Input, // input for the delegate function
  guards: Guard | Guard[], // single or multiple guards
  options?: { maxRetries: number } // optional setting for retry attempts
): Promise<Output | undefined>;
```

Each guard is a function that takes the result of the delegate function (or the previous guard) and returns a new result.

```ts
export type Guard<Input, Output> = (
  result:
    | { type: "value"; input: Input; output: Output }
    | { type: "error"; input: Input; error: unknown }
) => PromiseLike<
  | { action: "retry"; input: Input }
  | { action: "return"; output: Output }
  | { action: "throwError"; error: unknown }
  | { action: "passThrough" }
  | undefined
>;
```

Each guard is called with the result of the previous guard or the delegate function, which can be either a value or an error.

The guard can return one of the following actions:

- `retry`: Retry the delegate function with the return input. This allows you to modify the input for the next retry.
- `return`: Return the output. This allows you to modify the output, e.g. to redact sensitive information.
- `throwError`: Throw an error. This allows you to throw a custom error.
- `passThrough`: Pass through the result. This allows you to skip the guard. `undefined` is treated as `passThrough`.

## Usage Examples

[Examples](https://github.com/lgrammel/modelfusion/tree/main/examples/basic/src/guard)

### Redact sensitive information

Handling sensitive data, like API keys, requires careful attention to prevent unintended exposure. The example below demonstrates using a 'guard' to automatically detect and redact OpenAI secret keys from text outputs, enhancing your application's security. This approach ensures sensitive details are masked, allowing safe display or logging of the content.

```ts
// example assumes you are running https://huggingface.co/TheBloke/Llama-2-7B-GGUF with llama.cpp

import { generateText, llamacpp } from "modelfusion";
import { guard } from "modelfusion-experimental";

const OPENAI_KEY_REGEXP = new RegExp("sk-[a-zA-Z0-9]{24}", "gi");

const result = await guard(
  (prompt, options) =>
    generateText({
      model: llamacpp
        .CompletionTextGenerator({
          // ...
        })
        .withTextPromptTemplate(Llama2Prompt.instruction()),
      prompt,
      ...options, // pass through options (for tracing)
    }),
  {
    instruction:
      "Show me how to use OpenAI's completion API in JavaScript, " +
      "including authentication.",
  },

  // guard:
  async (result) => {
    if (result.type === "value") {
      return {
        action: "return",
        output: result.output.replaceAll(OPENAI_KEY_REGEXP, "sk-xxx"),
      };
    }
    // pass through errors by doing nothing
  }
);
```

### Throw error when content is moderated

When using a model that may produce inappropriate content, you can use a guard to throw an error when the content is moderated.

```ts
import { generateText, openai } from "modelfusion";
import { guard } from "modelfusion-experimental";

// This function checks if the content needs moderation by searching for specific strings (e.g., "Nox").
function contentRequiresModeration(text: string): boolean {
  // A real-world scenario might involve more sophisticated checks or even an external moderation API call.
  return text.includes("Nox");
}

const story = await guard(
  (prompt) =>
    generateText({
      model: openai.CompletionTextGenerator({
        model: "gpt-3.5-turbo-instruct",
        temperature: 0.7,
        maxGenerationTokens: 250,
      }),
      prompt,
    }),
  "Write a short story about a robot called Nox:\n\n", // without including the word Nox
  async (result) => {
    // If there's no error and the content needs moderation, throw a custom error.
    if (result.type === "value" && contentRequiresModeration(result.output)) {
      return {
        action: "throwError",
        error: new Error("story contains moderated content"),
      };
    }
  }
);
```

### Retry object parsing with error message

During object generation, models may occasionally produce outputs that either cannot be parsed or do not pass certain validation checks.
With the `fixObject` guard, you can retry generating the structure with a modified input that includes the error message.

```ts
import { generateObject, openai, zodSchema } from "modelfusion";
import { guard, fixObject } from "modelfusion-experimental";

const result = await guard(
  (prompt, options) =>
    generateObject({
      model: openai
        .ChatTextGenerator(/*...*/)
        .asFunctionCallObjectGenerationModel({
          fnName: "myFunction",
        }),
      schema: zodSchema({
        // ...
      }),
      prompt,
      ...options,
    }),
  [
    // ...
  ],
  fixObject({
    modifyInputForRetry: async ({ input, error }) => [
      ...input,
      openai.ChatMessage.assistant(null, {
        functionCall: {
          name: "sentiment",
          arguments: JSON.stringify(error.valueText),
        },
      }),
      openai.ChatMessage.user(error.message),
      openai.ChatMessage.user("Please fix the error and try again."),
    ],
  })
);
```

### Retry structure parsing with stronger model

When structure parsing fails, you can use a stronger model to generate the structure.

In this example, `gpt-3.5-turbo` is used initially. If structure parsing fails, `gpt-4` is used instead.

```ts
import {
  generateObject,
  openai,
  OpenAIChatModelType,
  zodSchema,
} from "modelfusion";
import { guard, fixObject } from "modelfusion-experimental";

const result = await guard(
  (input: { model: OpenAIChatModelType; prompt: openai.ChatPrompt }, options) =>
    generateObject({
      model: openai
        .ChatTextGenerator({ model: input.model })
        .asFunctionCallObjectGenerationModel(/*...*/),
      schema: zodSchema(/*...*/),
      prompt: input.prompt,
      ...options,
    }),
  {
    model: "gpt-3.5-turbo",
    prompt: [
      // ...
    ],
  },
  fixObject({
    modifyInputForRetry: async ({ input, error }) => ({
      model: "gpt-4" as const,
      prompt: input.prompt,
    }),
  })
);
```
