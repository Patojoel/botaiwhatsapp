import { IAIProvider, AIMessage } from "../ai.interface";

export class OpenRouterProvider implements IAIProvider {
  private apiKey: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || "";
    // On conserve le fallback vers la version openrouter recommandée
    this.model =
      process.env.OPENROUTER_MODEL || "meta-llama/llama-3.2-3b-instruct:free";
  }

  async generateResponse(
    messages: AIMessage[],
  ): Promise<{ reply: string; duration: number; modelName: string }> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY non configurée.");
    }

    const startTime = Date.now();

    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "WhatsApp AI Bot",
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
      throw new Error(`OpenRouter error: ${response.status} ${text}`);
    }

    const data = await response.json();
    const reply =
      data.choices?.[0]?.message?.content || "Désolé, je n'ai pas de réponse.";

    return {
      reply,
      duration: Date.now() - startTime,
      modelName: `openrouter/${this.model}`,
    };
  }
}
