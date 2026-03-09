import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getAI = () => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  return new GoogleGenAI({ apiKey });
};

export const chatWithAI = async (messages: { role: string; content: string }[]) => {
  const ai = getAI();
  const model = ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: messages.map(m => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    })),
  });
  return model;
};
