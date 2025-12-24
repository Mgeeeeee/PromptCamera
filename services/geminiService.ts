
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, ApiSettings } from "../types";

export const generateAIImage = async (
  base64Image: string,
  prompt: string,
  apiSettings?: ApiSettings
): Promise<string> => {
  // Always create a new instance right before the call to use the up-to-date API key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;
  const selectedModel = apiSettings?.selectedModel || ModelType.FLASH;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: selectedModel,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Artistically transform this image. Description: ${prompt || 'Make it artistic and creative'}. Output ONLY the new image data.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response generated from Gemini");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("AI returned text but no image data. Try adding more detail to your prompt.");
  } catch (error: any) {
    if (error.message?.includes("Requested entity was not found.")) {
      throw new Error("API_KEY_REQUIRED");
    }
    console.error("Gemini SDK Error:", error);
    throw error;
  }
};
