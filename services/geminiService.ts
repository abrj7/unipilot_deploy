
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { Message, Sender, CampusEvent } from '../types';
import { DATA_UW, DATA_UOFT, DATA_MAC, DATA_WESTERN, DATA_QUEENS, DATA_TMU } from './campusData';
import { USE_BACKEND } from '../constants';
import { chatWithBackend, summarizeEventsBackend } from './apiService';

// Initialize Gemini Client (Client Side) - Lazy loaded to prevent crash if no API key
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (!ai) {
    // Vite uses import.meta.env for environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_GOOGLE_API_KEY || "";
    if (!apiKey) {
      console.warn("No Gemini API key found. Client-side AI features will not work.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

const getCampusDataForId = (id: string) => {
  switch (id) {
    case 'uw': return DATA_UW;
    case 'uoft': return DATA_UOFT;
    case 'mac': return DATA_MAC;
    case 'western': return DATA_WESTERN;
    case 'queens': return DATA_QUEENS;
    case 'tmu': return DATA_TMU;
    default: return DATA_UW;
  }
};

export const generateResponse = async (
  universityId: string,
  personaName: string,
  styleGuide: string,
  userContext: string,
  userMessage: string,
  history: Message[],
  sessionId: string | null = null
): Promise<{ text: string, mapLocation?: { lat: number, lng: number, name: string } }> => {

  // --- CLIENT SIDE MODE (DEFAULT) ---
  // The user specified no external backend server is needed, so we use the client-side SDK.

  const genAI = getAI();
  if (!genAI) {
    return { text: "No API key configured. Please set the VITE_GEMINI_API_KEY environment variable in your .env file." };
  }

  const campusData = getCampusDataForId(universityId);
  const dataContext = JSON.stringify(campusData, null, 2);

  const displayMapTool: FunctionDeclaration = {
    name: "display_map",
    description: "Display an interactive map of a specific campus location.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        location_name: {
          type: Type.STRING,
          description: "The name of the location to find on the map."
        }
      },
      required: ["location_name"]
    }
  };

  const systemInstruction = `
    You are ${personaName}, an orientation leader and upper-year student guide for ${universityId}.
    
    CORE ASSUMPTION: The user does not know building names, shortcuts, or campus culture.
    
    YOUR GOAL: Explain what it is, where it is, why to go there, how to get there, and when it's best.

    🧠 UNIVERSAL RESPONSE TEMPLATE (STRICTLY FOLLOW THIS):
    1. One-sentence clear answer
    
    2. detailed_breakdown:
       - What it is (plain language)
       - Where it is (landmarks, nearby buildings)
       - Why people use it
       - Best time to go

    • Option 1 (if applicable)
    • Option 2 (if applicable)

    Helpful tip (access, hours, noise, food)
    
    Offer next action (map, directions, save, reminder)

    DATA CONTEXT:
    ${dataContext}

    USER CONTEXT:
    ${userContext}

    STYLE GUIDE:
    ${styleGuide}

    Always format nicely with Markdown. Use bolding for key terms.
  `;

  try {
    const recentHistory = history.slice(-5).map(msg => ({
      role: msg.sender === Sender.USER ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    let response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        ...recentHistory,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: [displayMapTool] }]
      }
    });

    let mapLocation = undefined;
    let finalText = "";

    // The SDK likely exposes text as a method or a property depending on version. 
    // Typescript says it's a getter, so access as property.
    if (response.text) {
      if (typeof response.text === 'function') {
        // @ts-ignore
        finalText = response.text();
      } else {
        finalText = response.text as string;
      }
    } else if (response.candidates && response.candidates.length > 0) {
      const part = response.candidates[0]?.content?.parts?.[0];
      if (part && 'text' in part) {
        finalText = part.text as string;
      }
    }

    let functionCalls: any[] = [];
    if (response.functionCalls) {
      if (typeof response.functionCalls === 'function') {
        // @ts-ignore
        functionCalls = response.functionCalls();
      } else {
        functionCalls = response.functionCalls as any[];
      }
    }

    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];

      if (call.name === 'display_map') {
        const locName = call.args['location_name'] as string;

        const location = campusData.locations.find(l =>
          l.name.toLowerCase().includes(locName.toLowerCase()) ||
          locName.toLowerCase().includes(l.name.toLowerCase())
        );

        let toolResult = { result: "Location not found." };

        if (location && location.coordinates) {
          mapLocation = {
            lat: location.coordinates[0],
            lng: location.coordinates[1],
            name: location.name
          };
          toolResult = { result: `Found: ${location.name}` };
        }

        response = await genAI.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: [
            ...recentHistory,
            { role: 'user', parts: [{ text: userMessage }] },
            { role: 'model', parts: [{ functionCall: call }] },
            { role: 'user', parts: [{ functionResponse: { name: call.name, response: toolResult } }] }
          ],
          config: { systemInstruction }
        });

        if (response.text) {
          if (typeof response.text === 'function') {
            // @ts-ignore
            finalText = response.text();
          } else {
            finalText = response.text as string;
          }
        }
      }
    }

    return {
      text: finalText || "I'm having trouble generating a response right now. (Empty Response)",
      mapLocation
    };

  } catch (error) {
    console.error("Gemini Error:", error);
    return { text: "Connection Error. Check console for details." };
  }
};

export const generateEventSummary = async (
  universityName: string,
  events: CampusEvent[],
  personaName: string,
  styleGuide: string
): Promise<string> => {

  // Client-Side Generation
  const genAI = getAI();
  if (!genAI) {
    return "Unable to generate summary: API Key missing.";
  }

  const prompt = `
    You are ${personaName}, an enthusiastic guide for ${universityName}.
    
    Task: Write a brief, exciting weekly briefing summarizing these campus events for a student.
    
    Events List:
    ${events.map(e => `- ${e.title} (${e.date}): ${e.description}`).join('\n')}
    
    Style Guide: ${styleGuide}
    
    Format:
    ## 📅 Campus Pulse
    [1 paragraph summary of vibes]
    
    🔥 Highlights
    - [Event 1]
    - [Event 2]
    
    Keep it under 150 words.
  `;

  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ]
    });
    return response.text || "No summary generated.";
  } catch (e) {
    console.error("Event Summary Error:", e);
    return "Check out the events below!";
  }
};
