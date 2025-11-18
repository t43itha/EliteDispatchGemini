import { GoogleGenAI, Type } from "@google/genai";
import { Booking, Driver, AiDriverSuggestion } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Ensure we use the correct model
const MODEL_NAME = 'gemini-2.5-flash';

export const suggestDriver = async (booking: Booking, drivers: Driver[]): Promise<AiDriverSuggestion | null> => {
  try {
    const availableDrivers = drivers.filter(d => d.status !== 'OFF_DUTY');
    
    if (availableDrivers.length === 0) {
        return { driverId: '', reasoning: 'No drivers available.' };
    }

    const prompt = `
      Act as an expert fleet dispatcher. Analyze this booking and the available drivers to suggest the best match.
      
      Booking Details:
      - Pickup: ${booking.pickupLocation}
      - Dropoff: ${booking.dropoffLocation}
      - Passengers: ${booking.passengers}
      - Time: ${booking.pickupTime}
      - Notes: ${booking.notes || 'None'}

      Available Drivers:
      ${availableDrivers.map(d => `- ID: ${d.id}, Name: ${d.name}, Vehicle: ${d.vehicle}, Location: ${d.location}, Status: ${d.status}`).join('\n')}

      Consider vehicle capacity, proximity (assume locations are logical), and driver status.
      If a driver is BUSY, they might still be a good candidate if they are near the dropoff of their current job (simulate this logic).
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            driverId: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["driverId", "reasoning"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as AiDriverSuggestion;

  } catch (error) {
    console.error("Error getting AI suggestion:", error);
    return null;
  }
};

export const generateWhatsAppMessage = async (booking: Booking, driver: Driver): Promise<string> => {
  try {
    const prompt = `
      You are EliteDispatch, a modern dispatch system. Write a WhatsApp message to driver ${driver.name} assigning them a job.
      
      Job Details:
      - Customer: ${booking.customerName}
      - Pickup: ${booking.pickupLocation}
      - Dropoff: ${booking.dropoffLocation}
      - Time: ${new Date(booking.pickupTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
      - Pax: ${booking.passengers}
      - Price: $${booking.price}
      - Notes: ${booking.notes || 'N/A'}

      Format guidelines:
      - Start with "🆕 *NEW TRIP*"
      - Use emojis (📍, 🏁, 🕒, 👤, 💵) for fields.
      - Use *bold* for labels.
      - Keep it compact and professional.
      - End with "Reply 👍 to confirm."
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
    });

    return response.text || "Error generating message.";
  } catch (error) {
    console.error("Error generating message:", error);
    return `🆕 *NEW TRIP*\n📍 Pick: ${booking.pickupLocation}\n🏁 Drop: ${booking.dropoffLocation}\n🕒 Time: ${new Date(booking.pickupTime).toLocaleTimeString()}\n\nReply 👍 to confirm.`;
  }
};