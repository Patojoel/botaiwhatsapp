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

  async generateResponse(
    botInstanceId: string,
    messages: { role: "user" | "assistant"; content: string | any[] }[] = [],
    _imageUrl?: string,
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

    if (enrichedContext) {
      const rulesStr = enrichedContext.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
      const restrictionStr = enrichedContext.restrictToProducts 
        ? "\n⚠️ RESTRICTION : Réponds UNIQUEMENT sur les produits du catalogue." 
        : "";

      systemPrompt = `
### TON RÔLE
Tu es un expert en vente directe sur WhatsApp. Ton style est humain, rapide et percutant.
${enrichedContext.prompt}

### CATALOGUE PRODUITS & MÉDIAS
${enrichedContext.productsInfo}

### RÈGLES D'OR (À RESPECTER DANS CET ORDRE)

1. **CONCISION ABSOLUE :** Maximum 1 ou 2 phrases par message. Pas de politesse inutile.
2. **DÉCLENCHEMENT MÉDIA :** N'envoie une photo ou une vidéo QUE si le client le demande explicitement (ex: "montre moi", "photo", "vidéo", "je veux voir"). Ne les envoie JAMAIS automatiquement.
3. **PAS DE COMMENTAIRE :** Quand tu mets une balise [IMAGE...] ou [VIDEO...], ne fais aucune introduction (pas de "Voici la photo"). Mets juste la balise à la fin de ton texte.
4. **SYNTAXE :** Utilise '[IMAGE:REAL_ID:INDEX]' ou '[VIDEO:REAL_ID:1]'. Remplace REAL_ID par l'identifiant technique (ex: cmog7...).
5. **SUIVI DES INDEX :** Si le client demande "une autre photo", utilise l'index suivant (:2, :3...). Ne renvoie jamais deux fois la même.
6. **OBJECTIF :** Ton but est de conclure la vente le plus vite possible.
7. **VOCAUX :** Si le message commence par "(Vocal) : ", c'est que le client t'a parlé. Sois particulièrement chaleureux et proactif.

### RÈGLES MÉTIER
${rulesStr}
${restrictionStr}
`;
    } else {
      const inst = await prisma.botInstance.findUnique({ 
        where: { id: botInstanceId }, 
        select: { systemPrompt: true }
      });
      systemPrompt = inst?.systemPrompt || fallbackPrompt;
    }

    // 2. Préparation des messages
    const history: AIMessage[] = messages.map(m => {
      let textContent = "";
      if (typeof m.content === "string") {
        textContent = m.content;
      } else if (Array.isArray(m.content)) {
        textContent = m.content
          .filter((c: any) => c.type === "text")
          .map((c: any) => c.text)
          .join("\n");
      }
      return { role: m.role, content: textContent || "" };
    });

    const formatted: AIMessage[] = [
      { role: "system", content: systemPrompt },
      ...history
    ];

    // Rappel final pour "forcer" la concision et le déclenchement média
    if (history.length > 0) {
      formatted.push({ 
        role: "system", 
        content: "RAPPEL : 1-2 phrases max. N'envoie de média QUE si on te le demande." 
      });
    }

    if (formatted.length === 1 || (formatted.length > 0 && formatted[formatted.length-1].role === "assistant")) {
       formatted.push({ role: "user", content: "Continue." });
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

function getActiveProvider(): IAIProvider {
  const providerName = (process.env.AI_PROVIDER || "openrouter").toLowerCase();
  if (providerName === "groq") return new GroqProvider();
  if (providerName === "huggingface") return new HuggingFaceProvider();
  return new OpenRouterProvider();
}

export const aiService = new AIService(getActiveProvider());
