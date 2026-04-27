import { logger } from "@/lib/logger";

export class AudioService {
  private static apiKey = process.env.GROQ_API_KEY;

  /**
   * Transcrit un fichier audio via Groq Whisper
   * @param audioBuffer Le buffer de l'audio (format ogg/opus de WhatsApp)
   * @returns Le texte transcrit
   */
  static async transcribe(audioBuffer: Buffer): Promise<string> {
    if (!this.apiKey) {
      logger.error("[AudioService] GROQ_API_KEY manquante");
      throw new Error("Configuration audio manquante");
    }

    try {
      const startTime = Date.now();
      const formData = new FormData();
      const uint8Array = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8Array], { type: "audio/ogg" });
      
      // Utiliser .m4a ou .mp3 comme extension aide souvent l'API à mieux parser le header
      formData.append("file", blob, "audio.m4a");
      formData.append("model", "whisper-large-v3");
      formData.append("language", "fr");
      formData.append("response_format", "json");

      const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      const duration = Date.now() - startTime;
      logger.info(`[AudioService] Groq API response in ${duration}ms`);

      if (!response.ok) {
        const errorData = await response.json();
        logger.error({ errorData }, "[AudioService] Erreur API Groq");
        throw new Error("Erreur lors de la transcription");
      }

      const data = await response.json();
      return data.text || "";
    } catch (error) {
      logger.error({ error }, "[AudioService] Erreur transcription");
      throw error;
    }
  }
}
