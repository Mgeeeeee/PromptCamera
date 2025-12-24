
export interface ApiSettings {
  apiKey: string;
  baseUrl: string;
  selectedModel: string;
  useCustomProvider: boolean;
}

export interface AppState {
  capturedImage: string | null;
  resultImage: string | null;
  prompt: string;
  isCameraOpen: boolean;
  isGenerating: boolean;
  error: string | null;
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash-image',
  PRO = 'gemini-3-pro-image-preview'
}
