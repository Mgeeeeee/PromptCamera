
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, ApiSettings } from "../types";

export const generateAIImage = async (
  base64Image: string,
  prompt: string,
  apiSettings?: ApiSettings
): Promise<string> => {
  // 1. If custom provider is configured and enabled, use that logic
  if (apiSettings?.useCustomProvider && apiSettings.apiKey && apiSettings.baseUrl) {
    return generateWithCustomProvider(base64Image, prompt, apiSettings);
  }

  // 2. Default to official SDK (Direct Google Gemini)
  // Always create a new instance right before the call to ensure the latest API key is used
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;
  const selectedModel = apiSettings?.selectedModel || ModelType.FLASH;

  try {
    // Determine configuration based on the model
    const config: any = {};
    if (selectedModel === ModelType.PRO) {
      config.imageConfig = {
        aspectRatio: "1:1",
        imageSize: "1K"
      };
    } else {
      config.imageConfig = {
        aspectRatio: "1:1"
      };
    }

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
            text: `Generate a new artistic image based on this photo. Prompt: ${prompt}. Output ONLY the image data.`,
          },
        ],
      },
      config,
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response generated from Gemini");

    // Iterate through all parts to find the image part
    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
      }
      if (part.text && part.text.includes('data:image')) {
        const match = part.text.match(/data:image\/[a-zA-Z]+;base64,[^"'\s\)]+/);
        if (match) return match[0];
      }
    }

    throw new Error("AI returned text but no image data. Try a more descriptive prompt.");
  } catch (error: any) {
    console.error("Gemini SDK Error:", error);
    throw error;
  }
};

async function generateWithCustomProvider(
  base64Image: string,
  prompt: string,
  settings: ApiSettings
): Promise<string> {
  const isGeminiModel = settings.selectedModel.toLowerCase().includes('gemini');
  let baseUrl = settings.baseUrl.trim();
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  
  const base64Data = base64Image.split(',')[1] || base64Image;

  if (isGeminiModel) {
    const url = `${baseUrl}/models/${settings.selectedModel}:generateContent?key=${settings.apiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
                { text: `Artistic image transformation: ${prompt}. Please return the resulting image data directly in the response.` }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
           return fetchViaOpenAICompatible(baseUrl, base64Image, prompt, settings);
        }
        throw new Error(data.error?.message || `Proxy error ${response.status}`);
      }

      if (data.candidates && data.candidates.length > 0) {
        for (const cand of data.candidates) {
          const parts = cand.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData?.data) {
              return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
            if (part.text) {
              const b64Match = part.text.match(/data:image\/[a-zA-Z]+;base64,[^"'\s\)]+/);
              if (b64Match) return b64Match[0];
              const urlMatch = part.text.match(/https?:\/\/[^\s"'\)]+\.(jpg|jpeg|png|webp|gif)/i);
              if (urlMatch) return urlMatch[0];
            }
          }
        }
      }

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const item = data.data[0];
        if (item.b64_json) return `data:image/png;base64,${item.b64_json}`;
        if (item.url) return item.url;
      }

      if (data.url) return data.url;
      if (data.image) return data.image;

      return fetchViaOpenAICompatible(baseUrl, base64Image, prompt, settings);
      
    } catch (e: any) {
      if (e.message.includes('Proxy error') || e.message.includes('fetch')) {
         return fetchViaOpenAICompatible(baseUrl, base64Image, prompt, settings);
      }
      throw e;
    }
  } else {
    return fetchViaOpenAICompatible(baseUrl, base64Image, prompt, settings);
  }
}

async function fetchViaOpenAICompatible(
  baseUrl: string,
  base64Image: string,
  prompt: string,
  settings: ApiSettings
): Promise<string> {
  const url = `${baseUrl}/images/generations`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${settings.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: settings.selectedModel,
        prompt: `Artistic transformation: ${prompt}`,
        image: base64Image,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json"
      })
    });

    const data = await response.json();
    if (response.ok) {
      const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;
      if (b64) return b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;
    }
    
    return fetchViaChatCompletions(baseUrl, base64Image, prompt, settings);

  } catch (err) {
    return fetchViaChatCompletions(baseUrl, base64Image, prompt, settings);
  }
}

async function fetchViaChatCompletions(
  baseUrl: string,
  base64Image: string,
  prompt: string,
  settings: ApiSettings
): Promise<string> {
  const url = `${baseUrl}/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.selectedModel,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `Transform this image into a new artistic piece. Prompt: ${prompt}. Please provide the image data in the final response.` },
            { type: "image_url", image_url: { url: base64Image } }
          ]
        }
      ]
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Proxy Chat API Error');

  const textContent = data.choices?.[0]?.message?.content || "";
  
  const b64Match = textContent.match(/data:image\/[a-zA-Z]+;base64,[^"'\s\)]+/);
  if (b64Match) return b64Match[0];
  
  const urlMatch = textContent.match(/https?:\/\/[^\s"'\)]+\.(jpg|jpeg|png|webp|gif)/i);
  if (urlMatch) return urlMatch[0];

  throw new Error("No image data found in the AI response. It may have only returned text.");
}
