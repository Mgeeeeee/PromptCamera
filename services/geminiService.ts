
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, ApiSettings } from "../types";

export const generateAIImage = async (
  base64Image: string,
  prompt: string,
  apiSettings?: ApiSettings
): Promise<string> => {
  // Use Custom Provider if configured
  if (apiSettings?.useCustomProvider && apiSettings.apiKey && apiSettings.baseUrl) {
    return generateWithCustomProvider(base64Image, prompt, apiSettings);
  }

  // Default to Gemini SDK
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ModelType.FLASH,
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

async function generateWithCustomProvider(
  base64Image: string,
  prompt: string,
  settings: ApiSettings
): Promise<string> {
  const isGeminiModel = settings.selectedModel.toLowerCase().includes('gemini');
  const baseUrl = settings.baseUrl.endsWith('/') ? settings.baseUrl.slice(0, -1) : settings.baseUrl;
  
  // If it's a Gemini model being proxied, we try to use the Gemini content format via a direct fetch
  if (isGeminiModel) {
    const url = `${baseUrl}/models/${settings.selectedModel}:generateContent?key=${settings.apiKey}`;
    const base64Data = base64Image.split(',')[1] || base64Image;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: {
          parts: [
            { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
            { text: `Artistic transformation: ${prompt}` }
          ]
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Proxy API Error');
    }

    const data = await response.json();
    const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (imagePart) return `data:image/png;base64,${imagePart.inlineData.data}`;
    throw new Error("No image in proxy response");
  } else {
    // Generic OpenAI-compatible image generation (DALL-E style)
    // Note: Standard OpenAI /v1/images/generations doesn't support image-to-image with text prompts easily in one call
    // but many proxies adapt it. Here we use a standard image gen fallback.
    const url = `${baseUrl}/images/generations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        prompt: `Transform this scene: ${prompt}`,
        // Note: Standard DALL-E doesn't take an 'image' field in 'generations', 
        // usually 'edits' or 'variations' is used. 
        // For simplicity with common proxies:
        image: base64Image, 
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Custom API Error');
    }

    const data = await response.json();
    const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;
    if (b64) return b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;
    throw new Error("Failed to receive image from provider");
  }
}
