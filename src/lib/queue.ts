import { Queue, Worker } from "bullmq";
import { logger } from "./logger";
import { aiService } from "@/modules/ai/ai.service";
import { ConversationRepository } from "@/modules/conversation/conversation.repository";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { prisma } from "./prisma";

const connection: any = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
  password: process.env.REDIS_PASSWORD,
};

if (typeof connection === "string") {
  const masked = connection.replace(/:[^@]+@/, ":****@");
  logger.info(`[Queue] Connexion Redis via URL: ${masked}`);
} else {
  logger.info(`[Queue] Connexion Redis via Host: ${connection.host}`);
}

const globalForQueue = global as unknown as { 
  messageQueue: Queue | undefined;
  worker: Worker | undefined;
};

export const messageQueue = globalForQueue.messageQueue || new Queue("whatsapp-messages", { connection });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.messageQueue = messageQueue;
}

/**
 * Planifie les statuts quotidiens pour toutes les instances actives
 */
export const scheduleDailyStatuses = async (instances: string[]) => {
  // Nettoyer les anciens jobs répétables pour éviter les doublons
  const repeatableJobs = await messageQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    if (job.name === "dailyStatus") {
      await messageQueue.removeRepeatableByKey(job.key);
    }
  }

  const activeInstances = await (prisma as any).botInstance.findMany({
    where: { id: { in: instances } },
    select: { id: true, statusSchedule: true }
  });

  for (const bot of activeInstances) {
    await messageQueue.add(
      "dailyStatus",
      { botInstanceId: bot.id },
      {
        repeat: {
          pattern: bot.statusSchedule || "0 9 * * *",
        },
      },
    );
  }
  logger.info(`[Queue] Statuts planifiés pour ${activeInstances.length} instances.`);
};

/**
 * Met à jour la programmation pour une instance spécifique
 */
export const updateBotStatusSchedule = async (botInstanceId: string, cron: string) => {
  const repeatableJobs = await messageQueue.getRepeatableJobs();
  for (const job of repeatableJobs) {
    // BullMQ stocke les données dans job.id sous forme 'name:pattern:...'
    if (job.name === "dailyStatus" && job.key.includes(botInstanceId)) {
      await messageQueue.removeRepeatableByKey(job.key);
    }
  }

  await messageQueue.add(
    "dailyStatus",
    { botInstanceId },
    {
      repeat: {
        pattern: cron,
      },
    },
  );
  logger.info(`[Queue] Nouvelle programmation pour ${botInstanceId}: ${cron}`);
};

// Instance d'un simple worker si on voulait l'activer dans ce même process
// En production, il serait probablement dans un process séparé
export const initWorker = () => {
  if (globalForQueue.worker) {
    return globalForQueue.worker;
  }

  const worker = new Worker(
    "whatsapp-messages",
    async (job) => {
      logger.info(`[Queue] Traitement du job ${job.id} (${job.name})`);

      if (job.name === "processAI") {
        const { botInstanceId, contactId, remoteJid } = job.data;

        try {
          const history = await ConversationRepository.getHistory(contactId, 10);
          const aiMessages = history.map((h: any) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })) as { role: "user" | "assistant"; content: string }[];

          const aiResponse = await aiService.generateResponse(
            botInstanceId,
            aiMessages,
          );

          await ConversationRepository.saveMessage(
            botInstanceId,
            contactId,
            "assistant",
            aiResponse,
          );

          await WhatsAppService.sendTextMessage(
            botInstanceId,
            remoteJid,
            aiResponse,
          );
        } catch (error: any) {
          logger.error(`[Queue] Erreur job ${job.id}: ${error.message}`);
          throw error;
        }
      } else if (job.name === "dailyStatus") {
        const { botInstanceId } = job.data;
        try {
          const instance = await (prisma as any).botInstance.findUnique({
            where: { id: botInstanceId },
          });

          if (!instance) return;  

          // Générer un statut via l'IA
          const statusText = await aiService.generateResponse(botInstanceId, [
            {
              role: "user",
              content:
                "Génère un court message inspirant ou une actualité pour mon statut WhatsApp du jour. Maximum 150 caractères.",
            },
          ]);

          await WhatsAppService.sendStatusUpdate(
            botInstanceId,
            statusText,
            instance.statusMediaUrl || undefined,
            (instance.statusMediaType as "image" | "video") || "image",
          );
          logger.info(`[Queue] Statut publié pour l'instance ${botInstanceId}`);
        } catch (error: any) {
          logger.error(
            `[Queue] Erreur publication statut ${botInstanceId}: ${error.message}`,
          );
        }
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

  if (process.env.NODE_ENV !== "production") {
    globalForQueue.worker = worker;
  }

  return worker;
};
