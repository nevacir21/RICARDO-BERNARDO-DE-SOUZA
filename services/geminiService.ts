
import { GoogleGenAI, Type } from "@google/genai";
import { AgendaEvent } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export const SYSTEM_INSTRUCTION = `You are "Elite AI", a highly efficient personal assistant.
Your goal is to help the user manage their agenda and life.
You can help create events, summarize the day, and provide advice.

Special Attention: MEDICINE REMINDERS and RECURRING ALARMS.
If the user mentions taking medicine (remédio, pílula, dose, etc.), always categorize it as "health" and suggest a reminder.
If the user says "todos os dias", "diariamente", "sempre às", detect it as a recurring event (daily).

If the user wants to schedule something, identify the title, date, time, priority, and if it repeats.
Always respond in a helpful, professional, and concise manner.
Current date context: ${new Date().toLocaleDateString()} - ${new Date().toLocaleTimeString()}.

Available priorities: low, medium, high.
Available categories: work, personal, health, finance, other.
Available recurrence: none, daily.`;

export const getGeminiResponse = async (
  prompt: string, 
  events: AgendaEvent[], 
  chatHistory: {role: string, parts: {text: string}[]}[]
) => {
  const model = 'gemini-3-flash-preview';
  
  const eventContext = events.map(e => 
    `- ${e.title} at ${e.start.toLocaleTimeString()} (${e.recurrence === 'daily' ? 'Daily' : 'One-time'})`
  ).join('\n');

  const fullPrompt = `
Current User Agenda:
${eventContext || 'No events scheduled yet.'}

User message: ${prompt}`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: fullPrompt }] }
      ],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "I'm sorry, I couldn't process that.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "I encountered an error while trying to help. Please check your connection.";
  }
};

export const extractEventData = async (text: string) => {
  const model = 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ 
        role: 'user', 
        parts: [{ text: `Extract event details from this text: "${text}". 
        Check if it's recurring daily ("todos os dias").` }] 
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isEvent: { type: Type.BOOLEAN },
            title: { type: Type.STRING },
            start: { type: Type.STRING, description: "ISO 8601 format" },
            end: { type: Type.STRING, description: "ISO 8601 format" },
            priority: { type: Type.STRING, enum: ["low", "medium", "high"] },
            category: { type: Type.STRING, enum: ["work", "personal", "health", "finance", "other"] },
            recurrence: { type: Type.STRING, enum: ["none", "daily"] },
            description: { type: Type.STRING }
          },
          required: ["isEvent"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Extraction Error:", error);
    return null;
  }
};
