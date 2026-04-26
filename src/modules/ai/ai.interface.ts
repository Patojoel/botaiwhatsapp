export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string | AIMultimodalContent[];
}

export type AIMultimodalContent = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface IAIProvider {
  /**
   * Génère une réponse à partir d'un historique de messages.
   * Doit retourner la réponse textuelle, la durée de la requête, et le modèle utilisé.
   */
  generateResponse(
    messages: AIMessage[],
  ): Promise<{ reply: string; duration: number; modelName: string }>;
}
