import { llamacpp, streamText } from "modelfusion";
import fs from "node:fs";
import path from "node:path";

// see https://modelfusion.dev/integration/model-provider/llamacpp/using-bakllava for instructions
async function main() {
  const image = fs.readFileSync(path.join("data", "comic-mouse.png"));

  const textStream = await streamText({
    model: llamacpp
      .CompletionTextGenerator({
        promptTemplate: llamacpp.prompt.BakLLaVA1,
        maxGenerationTokens: 1024,
        temperature: 0,
      })
      .withInstructionPrompt(),

    prompt: {
      instruction: [
        { type: "text", text: "Describe the image in detail:\n\n" },
        { type: "image", image },
      ],
    },
  });

  for await (const textPart of textStream) {
    process.stdout.write(textPart);
  }
}

main().catch(console.error);
