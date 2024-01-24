import dotenv from "dotenv";
import { elevenlabs, generateSpeech, generateText, openai } from "modelfusion";
import fs from "node:fs";

dotenv.config();

async function main() {
  const story = await generateText({
    model: openai
      .ChatTextGenerator({
        model: "gpt-3.5-turbo",
        temperature: 0.7,
        maxGenerationTokens: 500,
      })
      .withInstructionPrompt(),

    prompt: {
      system:
        "You are a great storyteller. " +
        "You specialize in stories for children.",
      instruction: "Tell me a story about a robot learning to love.",
    },
  });

  const narratedStory = await generateSpeech({
    model: elevenlabs.SpeechGenerator({
      voice: "AZnzlk1XvdvUeBnXmlld", // Domi
      model: "eleven_multilingual_v2",
    }),
    text: story,
  });

  const path = `./generate-narrated-story-example.mp3`;
  fs.writeFileSync(path, narratedStory);
}

main().catch(console.error);
