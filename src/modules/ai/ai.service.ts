import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { IAIProvider, AIMessage } from "./ai.interface";
import { GroqProvider } from "./providers/groq.provider";
import { HuggingFaceProvider } from "./providers/huggingface.provider";
import { OpenRouterProvider } from "./providers/openrouter.provider";

export class AIService {
  private provider: IAIProvider;

  constructor(provider: IAIProvider) {
    this.provider = provider;
  }

  private async getActiveProfile() {
    return prisma.botProfile.findFirst({
      where: { isActive: true },
    });
  }

  async generateResponse(
    messages: { role: "user" | "assistant"; content: string }[],
    fallbackPrompt: string = "Tu es un assistant commercial intelligent, court et concis pour WhatsApp.",
  ): Promise<string> {
    const profile = await this.getActiveProfile();
    const systemPrompt = profile?.systemPrompt || fallbackPrompt;

    const formattedMessages: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(
        (m) => ({ role: m.role, content: m.content }) as AIMessage,
      ),
    ];

    try {
      const { reply, duration, modelName } =
        await this.provider.generateResponse(formattedMessages);
      logger.info(
        `[AI] Génération réponse — modèle: ${modelName}, durée: ${duration}ms`,
      );
      return reply;
    } catch (error) {
      logger.error({ error }, `[AI] Erreur génération: ${error}`);
      throw error;
    }
  }
}

// Inversion de dépendance active
// Permet de brancher l'IA désirée de manière dynamique !
function getActiveProvider(): IAIProvider {
  const providerName = process.env.AI_PROVIDER ;

  if (providerName === "groq") {
    return new GroqProvider();
  } else if (providerName === "huggingface") {
    return new HuggingFaceProvider();
  } else {
    // Fallback original
    return new OpenRouterProvider();
  }
}

export const aiService = new AIService(getActiveProvider());
