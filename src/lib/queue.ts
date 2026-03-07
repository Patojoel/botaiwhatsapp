import { Queue, Worker } from "bullmq";
import { logger } from "./logger";

const connection = {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

export const messageQueue = new Queue("whatsapp-messages", { connection });

// Instance d'un simple worker si on voulait l'activer dans ce même process
// En production, il serait probablement dans un process séparé
export const initWorker = () => {
  const worker = new Worker(
    "whatsapp-messages",
    async (job) => {
      logger.info(`[Queue] Traitement du job ${job.id}`);
      if (job.name === "processMessage") {
        // Intégrer la logique de réception asynchrone pour scalabilité (Phase 4)
        logger.info(`[Queue] Message data: ${JSON.stringify(job.data)}`);
      }
    },
    { connection },
  );

  worker.on("completed", (job) => {
    logger.info(`[Queue] Job ${job.id} terminé`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`[Queue] Job ${job?.id} a échoué: ${err.message}`);
  });

  return worker;
};
