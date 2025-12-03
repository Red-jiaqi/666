import { GoogleGenAI, Type } from "@google/genai";
import { GeminiInterpretation } from "../types";

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is not set in the environment.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key' });

export const interpretPattern = async (imageBase64: string): Promise<GeminiInterpretation> => {
  if (!apiKey) {
    throw new Error("API Key is missing.");
  }

  // Remove data URL header if present
  const base64Data = imageBase64.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Data,
            },
          },
          {
            text: `You are a Zen master and an expert in traditional bamboo weaving (Zhubian). 
            The user has created a dynamic weaving pattern using their body movement (motion capture).
            The provided image is a snapshot of this digital interaction.
            
            1. Analyze the flow, chaos, or order in the lines.
            2. Give this creation a poetic 4-character Chinese idiom title (with English translation).
            3. Write a very short Haiku-style poem about the movement seen in the pattern.
            4. Provide a "Weaving Philosophy" interpretation connecting the user's movement to life advice.
            
            Return ONLY JSON.`
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "A poetic title, e.g., 'Wind Dancing Bamboo (风舞竹韵)'" },
            poem: { type: Type.STRING, description: "A short poem reflecting the visual pattern" },
            philosophy: { type: Type.STRING, description: "Philosophical interpretation of the pattern" }
          },
          required: ["title", "poem", "philosophy"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    return JSON.parse(text) as GeminiInterpretation;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
