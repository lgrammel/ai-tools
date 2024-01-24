import dotenv from "dotenv";
import { generateImage, generateText, openai } from "modelfusion";
import fs from "node:fs";

dotenv.config();

const imageUrl =
  process.argv[2] ??
  "https://upload.wikimedia.org/wikipedia/commons/d/d8/Steam_train%2C_Seahill_%281985%29_-_geograph.org.uk_-_3789663.jpg";

async function main() {
  const imageResponse = await fetch(imageUrl);
  const originalImage = Buffer.from(await imageResponse.arrayBuffer());

  const imageGenerationPrompt = await generateText({
    model: openai
      .ChatTextGenerator({
        model: "gpt-4-vision-preview",
        maxGenerationTokens: 128,
      })
      .withInstructionPrompt(),

    prompt: {
      instruction: [
        {
          type: "text",
          text:
            "Generate an image generation prompt for creating a cyberpunk-style image " +
            "that resembles the attached image. " +
            "Capture the essence of the image in 1-2 sentences.",
        },
        { type: "image", image: originalImage },
      ],
    },
  });

  console.log();
  console.log(`Image generation prompt:`);
  console.log(imageGenerationPrompt);

  const image = await generateImage({
    model: openai.ImageGenerator({
      model: "dall-e-3",
      quality: "hd",
      size: "1024x1024",
    }),
    prompt: imageGenerationPrompt,
  });

  const path = `./enhanced-image-example.png`;
  fs.writeFileSync(path, image);

  console.log();
  console.log(`Image saved to ${path}`);
}

main().catch(console.error);
