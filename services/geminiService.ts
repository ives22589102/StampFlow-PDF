import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractCodeFromText = async (text: string): Promise<string> => {
  if (!text || text.length < 5) return "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        Analyze the following text extracted from a business PDF document.
        Your goal is to find a specific Reference Number, Policy Number, Order ID, or PB Number that needs to be stamped.
        
        Common formats include: "PB 123456", "Ref: #999", "PO-2024-X".
        
        Return ONLY the code/number string found. Do not add labels like "Found:" or markdown.
        If multiple exist, pick the most likely primary identifier.
        If nothing resembling a code is found, return an empty string.

        Text content:
        "${text.substring(0, 3000)}" 
      `,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Gemini extraction failed:", error);
    return "";
  }
};
