import * as googleTTS from "google-tts-api";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { logger } from "@/lib/logger";

export class VoiceService {
  /**
   * Génère un fichier audio à partir d'un texte (TTS)
   * @param text Le texte à lire
   * @param lang La langue (ex: 'fr')
   * @returns Le chemin local du fichier audio généré
   */
  static async generateAudio(text: string, lang: string = "fr"): Promise<string> {
    try {
      logger.info(`[VoiceService] Génération audio pour: "${text.substring(0, 30)}..."`);

      // 1. Essayer différents hôtes pour contourner les problèmes réseau (ENOTFOUND)
      const hosts = [
        "https://translate.google.com",
        "https://translate.google.com.br",
        "https://translate.google.com.vn",
      ];

      let response = null;
      let lastError = null;

      for (const host of hosts) {
        try {
          const url = googleTTS.getAudioUrl(text.substring(0, 200), {
            lang,
            slow: false,
            host,
          });

          response = await axios({
            url,
            method: "GET",
            responseType: "arraybuffer",
            timeout: 5000,
          });
          
          if (response) break; // Succès !
        } catch (err) {
          lastError = err;
          logger.warn(`[VoiceService] Échec avec l'hôte ${host}, tentative suivante...`);
        }
      }

      if (!response) {
        throw lastError || new Error("Tous les hôtes Google TTS ont échoué.");
      }

      // 3. Sauvegarder temporairement
      const fileName = `voice_${Date.now()}.mp3`;
      const tempDir = path.join(process.cwd(), "public", "uploads", "temp");
      await fs.mkdir(tempDir, { recursive: true });
      
      const filePath = path.join(tempDir, fileName);
      await fs.writeFile(filePath, Buffer.from(response.data));

      return filePath;
    } catch (error) {
      logger.error({ error }, "[VoiceService] Erreur génération audio");
      throw error;
    }
  }
}
