import dotenv from "dotenv";
import { generateObject, openai, uncheckedSchema } from "modelfusion";

dotenv.config();

async function main() {
  const sentiment = await generateObject({
    model: openai
      .ChatTextGenerator({
        model: "gpt-3.5-turbo",
        temperature: 0,
        maxGenerationTokens: 50,
      })
      .asFunctionCallObjectGenerationModel({
        fnName: "sentiment",
        fnDescription: "Write the sentiment analysis",
      })
      .withInstructionPrompt(),

    schema: uncheckedSchema({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        sentiment: {
          type: "string",
          enum: ["positive", "neutral", "negative"],
          description: "Sentiment.",
        },
      },
      required: ["sentiment"],
      additionalProperties: false,
    }),

    prompt: {
      system:
        "You are a sentiment evaluator. " +
        "Analyze the sentiment of the following product review:",
      instruction:
        "After I opened the package, I was met by a very unpleasant smell " +
        "that did not disappear even after washing. Never again!",
    },
  });

  console.log(JSON.stringify(sentiment, null, 2));
}

main().catch(console.error);
