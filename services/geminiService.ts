
import { GoogleGenAI } from "@google/genai";

export const getCommentary = async (
  player1Rank: string,
  player2Rank: string,
  winnerName: string,
  isWar: boolean,
  p1Count: number,
  p2Count: number
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    You are a witty and energetic sports commentator for a game of 'War' (card game).
    The last round:
    Player 1 flipped: ${player1Rank}
    Player 2 flipped: ${player2Rank}
    Winner: ${winnerName}
    Was it a War?: ${isWar ? 'YES!' : 'No'}
    Cards left: Player 1 has ${p1Count}, Player 2 has ${p2Count}.

    Provide a very short, punchy, and exciting reaction (maximum 15 words).
    Keep it fun. Use Hebrew if the audience is Israeli, or English. Let's go with a mix or Hebrew focus since the request was in Hebrew.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        maxOutputTokens: 50,
        temperature: 0.8
      }
    });
    return response.text || "איזה מהלך!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "קרב צמוד!";
  }
};
