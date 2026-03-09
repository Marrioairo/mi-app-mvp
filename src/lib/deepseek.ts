/**
 * DeepSeek API Integration Module
 * Handles authentication, requests, streaming, and error management with retries.
 */

export interface DeepSeekOptions {
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(apiKey: string, baseUrl?: string, model?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl || "https://api.deepseek.com/v1";
    this.model = model || "deepseek-chat";
  }

  /**
   * Request a completion from DeepSeek with retries
   */
  async requestCompletion(prompt: string, systemInstruction?: string, options: DeepSeekOptions = {}, retries = 3): Promise<any> {
    const messages = [
      { role: "system", content: systemInstruction || "You are HoopsAI, a professional basketball tactical analyst." },
      { role: "user", content: prompt },
    ];

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.model,
            messages: messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.max_tokens ?? 2000,
            stream: options.stream ?? false,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`DeepSeek API Error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        return await response.json();
      } catch (error: any) {
        console.error(`DeepSeek Attempt ${i + 1} failed:`, error.message);
        if (i === retries - 1) throw error;
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }

  /**
   * Example prompts for sports analysis
   */
  static getPrompts() {
    return {
      summary: "Summarize the match events, highlighting the key momentum shifts and top performers.",
      tactics: "Analyze the defensive and offensive patterns. Suggest tactical adjustments for the trailing team.",
      prediction: "Based on the current score and player efficiency, predict the final score and win probability.",
      coach_report: "Generate a detailed performance report for the coach, focusing on individual player efficiency and team chemistry."
    };
  }
}

// Lazy initialization helper
let deepSeekInstance: DeepSeekService | null = null;

export const getDeepSeek = () => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_API_URL;
  const model = process.env.DEEPSEEK_MODEL;

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY is not defined in environment variables.");
  }
  if (!deepSeekInstance) {
    deepSeekInstance = new DeepSeekService(apiKey, baseUrl, model);
  }
  return deepSeekInstance;
};
