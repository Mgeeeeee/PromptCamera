
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ModelType, ApiSettings } from "../types";

export const generateAIImage = async (
  base64Image: string,
  prompt: string,
  apiSettings?: ApiSettings
): Promise<string> => {
  // 1. 如果配置了自定义代理且启用了该功能，优先使用代理逻辑
  if (apiSettings?.useCustomProvider && apiSettings.apiKey && apiSettings.baseUrl) {
    return generateWithCustomProvider(base64Image, prompt, apiSettings);
  }

  // 2. 默认使用官方 SDK (Gemini 3 系列)
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.split(',')[1] || base64Image;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: ModelType.FLASH,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: 'image/jpeg',
              },
            },
            {
              text: `Generate a new artistic image based on this photo. Prompt: ${prompt}. Output only the image.`,
            },
          ],
        },
      ],
    });

    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error("No response generated from Gemini");

    for (const part of candidate.content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
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

  // 策略 A: 尝试使用 Gemini 原生 API 结构 (Google REST API 格式)
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
                { text: `Artistic image transformation: ${prompt}` }
              ]
            }
          ]
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || `Proxy error ${response.status}`);
      }

      // 深度搜索返回结果中的图片数据
      // 路径 1: Google 原生格式 candidates[0].content.parts[i].inlineData
      const candidates = data.candidates || [];
      for (const cand of candidates) {
        const parts = cand.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData?.data) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          }
        }
      }

      // 路径 2: 某些代理会把图片放在 OpenAI 风格的格式里，即使调用的是 Gemini 接口
      if (data.data?.[0]?.b64_json) return `data:image/png;base64,${data.data[0].b64_json}`;
      if (data.data?.[0]?.url) return data.data[0].url;

      console.warn("Unexpected Proxy Response Structure:", data);
      throw new Error("Could not find image data in response. The model might have returned text instead.");
      
    } catch (e: any) {
      // 如果报错是 404 或者 Unmarshal 失败，说明代理可能不支持 :generateContent 路径，尝试 OpenAI 兼容路径
      if (e.message.includes('404') || e.message.includes('marshal')) {
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
  // 针对 Tuzi API 等 OpenAI 兼容接口的格式
  const url = `${baseUrl}/images/generations`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.selectedModel,
      prompt: `Transform this image with style: ${prompt}`,
      image: base64Image, // 某些代理直接传完整 base64
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Standard API Error');

  const b64 = data.data?.[0]?.b64_json || data.data?.[0]?.url;
  if (b64) return b64.startsWith('http') ? b64 : `data:image/png;base64,${b64}`;
  
  throw new Error("Failed to extract image from standard provider response.");
}
