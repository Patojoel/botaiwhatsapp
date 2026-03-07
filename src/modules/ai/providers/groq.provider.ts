import { IAIProvider, AIMessage } from "../ai.interface";

export class GroqProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || "";
    this.model = process.env.GROQ_MODEL || "llama3-8b-8192";
  }

  async generateResponse(
    messages: AIMessage[],
  ): Promise<{ reply: string; duration: number; modelName: string }> {
    if (!this.apiKey) {
      throw new Error("GROQ_API_KEY non configurée.");
    }

    const startTime = Date.now();

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 500,
        }),
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Désolé, je n'ai pas de réponse.";

    return {
      reply,
      duration: Date.now() - startTime,
      modelName: `groq/${this.model}`,
    };
  }
}
