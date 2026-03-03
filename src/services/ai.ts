import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AISuggestion {
  originalText: string;
  suggestedText: string;
  explanation: string;
}

export async function generateInitialDraft(prompt: string, attachments?: string[]): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  const systemInstruction = `You are Muse, a world-class writing partner. 
  Your goal is to help the user write high-quality, engaging content.
  When asked to generate a draft, write in a clean, professional, yet evocative style.
  Use Markdown for structure (h1, h2, etc.).`;

  const response = await ai.models.generateContent({
    model,
    contents: `Prompt: ${prompt}${attachments ? `\n\nAttachments Context: ${attachments.join("\n")}` : ""}`,
    config: { systemInstruction },
  });

  return response.text || "";
}

export async function iterateOnText(
  fullContent: string,
  selectedText: string,
  feedback: string
): Promise<string> {
  const model = "gemini-3.1-pro-preview";
  const systemInstruction = `You are Muse, a collaborative editor. 
  The user has selected a specific part of their writing and provided feedback.
  Rewrite ONLY the selected portion to address the feedback, while ensuring it still fits perfectly within the surrounding context.
  Return ONLY the rewritten text, no explanations.`;

  const prompt = `
  FULL CONTEXT:
  ${fullContent}

  SELECTED TEXT TO REWRITE:
  ${selectedText}

  USER FEEDBACK:
  ${feedback}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: { systemInstruction },
  });

  return response.text?.trim() || selectedText;
}

export async function getProactiveFeedback(content: string): Promise<AISuggestion[]> {
  const model = "gemini-3-flash-preview";
  const systemInstruction = `You are Muse, a proactive writing coach.
  Analyze the provided text and find 1-3 specific areas where the writing could be improved (clarity, impact, tone, or grammar).
  For each area, provide the original text, a suggested improvement, and a brief explanation.
  Return the result as a JSON array of objects.`;

  const response = await ai.models.generateContent({
    model,
    contents: content,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            originalText: { type: Type.STRING },
            suggestedText: { type: Type.STRING },
            explanation: { type: Type.STRING },
          },
          required: ["originalText", "suggestedText", "explanation"],
        },
      },
    },
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    console.error("Failed to parse proactive feedback", e);
    return [];
  }
}
