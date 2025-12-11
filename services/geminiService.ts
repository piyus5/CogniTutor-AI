import { GoogleGenAI, GenerateContentResponse, Modality } from "@google/genai";

// Initialize the API client
// CRITICAL: process.env.API_KEY is handled by the environment, we do not ask user for it.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Sends a message to the Gemini API with a specific system instruction (persona).
 * Supports both text and image input.
 * Enables Google Search Grounding for factual accuracy.
 */
export const streamTutorResponse = async (
  prompt: string,
  systemInstruction: string,
  imageData?: { base64: string; mimeType: string },
  history: { role: string; parts: { text: string }[] }[] = []
): Promise<AsyncIterable<GenerateContentResponse>> => {
  
  // We use gemini-2.5-flash for speed, efficiency, and search capabilities.
  const modelId = 'gemini-2.5-flash';

  const parts: any[] = [{ text: prompt }];

  if (imageData) {
    // If an image is present, we prepend it to the user's prompt
    parts.unshift({
      inlineData: {
        mimeType: imageData.mimeType, // Use the actual mime type detected from the file
        data: imageData.base64
      }
    });
  }

  // We use a chat session to maintain history.
  // We enable the googleSearch tool to allow the tutor to fetch up-to-date information.
  const chat = ai.chats.create({
    model: modelId,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7, // Balanced creativity and accuracy
      tools: [{ googleSearch: {} }] // Enable Google Search Grounding
    },
    history: history.map(h => ({
      role: h.role,
      parts: h.parts
    }))
  });

  if (imageData) {
    // If there is an image, we must pass it in the message payload.
    // Fixed: 'parts' should be passed directly to 'message', not wrapped in an object.
    return await chat.sendMessageStream({
        message: parts
    });
  } else {
    return await chat.sendMessageStream({
        message: prompt
    });
  }
};

/**
 * Generates speech from text using Gemini TTS model.
 */
export const generateTutorSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    return null;
  }
};