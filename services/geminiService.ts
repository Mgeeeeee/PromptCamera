
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType } from "../types";

export const generateAIImage = async (
  base64Image: string,
  prompt: string,
  modelName: string = ModelType.FLASH
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Strip metadata prefix if present
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Based on this photo, create a new artistic image following this prompt: ${prompt}. Maintain the general composition and subject but transform the style and details as requested.`,
          },
        ],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response generated from AI");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    throw new Error("AI returned text but no image part.");
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
