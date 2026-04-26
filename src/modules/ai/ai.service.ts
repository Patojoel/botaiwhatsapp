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

  /**
   * Génère une réponse IA basée sur le contexte de l'instance et du catalogue.
   * Note : La vision (images) est désactivée pour le moment pour privilégier la stabilité du texte.
   */
  async generateResponse(
    botInstanceId: string,
    messages: { role: "user" | "assistant"; content: string | any[] }[] = [],
    _imageUrl?: string, // Préfixé par _ car inutilisé pour la stabilité actuelle
    fallbackPrompt: string = "Tu es un assistant commercial intelligent.",
    enrichedContext?: {
      prompt: string;
      rules: string[];
      productsInfo: string;
      restrictToProducts: boolean;
      productImages?: string[];
    }
  ): Promise<string> {
    
    let systemPrompt = "";

    // 1. Construction du prompt contextuel
    if (enrichedContext) {
      const rulesStr = enrichedContext.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
      const restrictionStr = enrichedContext.restrictToProducts 
        ? "\n⚠️ RESTRICTION : Réponds UNIQUEMENT sur les produits du catalogue ci-dessous." 
        : "";

      systemPrompt = `
### TON RÔLE
${enrichedContext.prompt}

### RÈGLES DE CONDUITE
${rulesStr}
${restrictionStr}

### CATALOGUE PRODUITS
Voici tes produits. Utilise EXCLUSIVEMENT ces détails pour répondre :
${enrichedContext.productsInfo}

### INSTRUCTIONS DE RÉPONSE
- Sois chaleureux, humain et très concis.
- **PHOTO (OBLIGATOIRE) :** Dès que tu mentionnes un produit ou que le client pose une question dessus, tu DOIS impérativement ajouter la balise '[IMAGE:ID_DU_PRODUIT]' à la fin de ton message. Ne l'oublie jamais, c'est crucial pour la vente. L'ID est celui entre parenthèses.
- Si le client envoie une image, explique que tu peux l'aider par texte uniquement pour le moment.
`;
    } else {
      const inst = await prisma.botInstance.findUnique({ 
        where: { id: botInstanceId }, 
        select: { systemPrompt: true }
      });
      systemPrompt = inst?.systemPrompt || fallbackPrompt;
    }

    // 2. Préparation des messages pour l'IA (On ne garde QUE le texte pour éviter les erreurs 400)
    const formatted: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages.map(m => {
        let textContent = "";
        if (typeof m.content === "string") {
          textContent = m.content;
        } else if (Array.isArray(m.content)) {
          // Si c'est un tableau (format multimodal), on extrait uniquement les blocs de texte
          textContent = m.content
            .filter((c: any) => c.type === "text")
            .map((c: any) => c.text)
            .join("\n");
        }
        return { role: m.role, content: textContent || "" };
      })
    ];

    // Sécurité : au moins un message utilisateur
    if (formatted.length === 1) {
       formatted.push({ role: "user", content: "Bonjour" });
    }

    try {
      const result = await this.provider.generateResponse(formatted);
      return result.reply;
    } catch (error) {
      logger.error({ error, botInstanceId }, "[AI] Generation Error");
      return "Désolé, je rencontre une petite difficulté technique. Je reviens vers vous très vite.";
    }
  }
}

/**
 * Factory pour récupérer le provider configuré dans les variables d'environnement.
 */
function getActiveProvider(): IAIProvider {
  const providerName = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  if (providerName === "groq") return new GroqProvider();
  if (providerName === "huggingface") return new HuggingFaceProvider();
  return new OpenRouterProvider();
}

export const aiService = new AIService(getActiveProvider());
