import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs/promises";
import { logger } from "@/lib/logger";

export class VideoService {
  /**
   * Génère une vidéo promotionnelle à partir d'images et d'un audio
   * @param images Chemins locaux ou URLs des images
   * @param audioPath Chemin local du fichier audio
   * @param format Format de sortie ("9:16", "16:9", "1:1")
   * @returns Chemin de la vidéo générée
   */
  static async createPromoVideo(
    images: string[],
    audioPath: string,
    format: "9:16" | "16:9" | "1:1" = "9:16"
  ): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const outputFileName = `promo_${Date.now()}.mp4`;
        const outputDir = path.resolve(process.cwd(), "public/uploads/videos");
        const outputPath = path.join(outputDir, outputFileName);
        
        // S'assurer que le dossier de sortie existe
        await fs.mkdir(outputDir, { recursive: true });

        const size = this.getDimensions(format);
        const [width, height] = size.split('x');

        const command = ffmpeg();

        // 1. Ajouter les images (6 secondes par image pour atteindre 10-20s au total)
        images.forEach((img) => {
          let inputSource = img;
          
          if (img.startsWith("http")) {
            inputSource = img;
          } else if (img.startsWith("/")) {
            inputSource = path.resolve(process.cwd(), `public${img}`);
          } else {
            inputSource = path.resolve(img);
          }
          
          command.input(inputSource).loop(6); // 6 secondes par image
        });

        // 2. Ajouter l'audio
        const absoluteAudioPath = path.resolve(audioPath);
        command.input(absoluteAudioPath);

        // 3. Construction du filtre complexe (Normalisation + Diaporama)
        let filters = [];
        
        // Normalisation de chaque image
        images.forEach((_, i) => {
          filters.push({
            filter: 'scale',
            options: { w: width, h: height, force_original_aspect_ratio: 'decrease' },
            inputs: `${i}:v`,
            outputs: `v${i}s`
          });
          filters.push({
            filter: 'pad',
            options: { w: width, h: height, x: '(ow-iw)/2', y: '(oh-ih)/2' },
            inputs: `v${i}s`,
            outputs: `v${i}`
          });
        });
        
        // Assemblage (Concaténation)
        if (images.length > 1) {
          filters.push({
            filter: 'concat',
            options: { n: images.length, v: 1, a: 0 },
            inputs: images.map((_, i) => `v${i}`),
            outputs: 'outv'
          });
        } else {
          filters.push({
            filter: 'null',
            inputs: 'v0',
            outputs: 'outv'
          });
        }

        // Ajouter l'audio au filtre complexe pour éviter les erreurs de mapping
        filters.push({
          filter: 'anull',
          inputs: `${images.length}:a`,
          outputs: 'outa'
        });

        logger.info(`[VideoService] Lancement FFmpeg pour ${outputFileName}...`);

        command
          .complexFilter(filters)
          .map("[outv]")
          .map("[outa]")
          .outputOptions([
            "-c:v libx264",
            "-preset fast", // On repasse en fast pour une meilleure qualité que ultrafast
            "-crf 23",
            "-pix_fmt yuv420p",
            "-movflags +faststart"
          ])
          .on("start", (cmd) => {
            logger.info(`[VideoService] Commande FFmpeg: ${cmd}`);
          })
          .on("end", () => {
            logger.info(`[VideoService] Vidéo générée avec succès.`);
            resolve(`/uploads/videos/${outputFileName}`);
          })
          .on("error", (err, stdout, stderr) => {
            logger.error(`[VideoService] Erreur FFmpeg: ${err.message}`);
            logger.error(`[VideoService] FFmpeg Stderr: ${stderr}`);
            reject(err);
          })
          .save(outputPath);

      } catch (error) {
        logger.error(`[VideoService] Erreur critique: ${error}`);
        reject(error);
      }
    });
  }

  private static getDimensions(format: string): string {
    if (format === "16:9") return "1920x1080";
    if (format === "1:1") return "1080x1080";
    return "1080x1920"; // 9:16 par défaut
  }
}
