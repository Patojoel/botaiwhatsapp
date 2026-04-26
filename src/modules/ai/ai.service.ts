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

  private async getBotPrompt(botInstanceId: string) {
    const instance = await prisma.botInstance.findUnique({
      where: { id: botInstanceId },
      select: { systemPrompt: true },
    });
    return instance?.systemPrompt;
  }

  async generateResponse(
    botInstanceId: string,
    messages: { role: "user" | "assistant"; content: string }[],
    fallbackPrompt: string = "Tu es un assistant commercial intelligent, court et concis pour WhatsApp.",
  ): Promise<string> {
    const botPrompt = await this.getBotPrompt(botInstanceId);
    const systemPrompt = botPrompt || fallbackPrompt;

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
        `[AI] Response generated for bot ${botInstanceId} — model: ${modelName}, duration: ${duration}ms`,
      );
      return reply;
    } catch (error) {
      logger.error(
        { error, botInstanceId },
        `[AI] Generation error for bot ${botInstanceId}: ${error}`,
      );
      throw error;
    }
  }
}

function getActiveProvider(): IAIProvider {
  const providerName = process.env.AI_PROVIDER || "openrouter";

  if (providerName === "groq") {
    return new GroqProvider();
  } else if (providerName === "huggingface") {
    return new HuggingFaceProvider();
  } else {
    return new OpenRouterProvider();
  }
}

export const aiService = new AIService(getActiveProvider());
