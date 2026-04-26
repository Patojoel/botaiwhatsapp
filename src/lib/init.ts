import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { initWorker, scheduleDailyStatuses } from "./queue";
import { logger } from "./logger";
import { prisma } from "./prisma";

const globalForInit = global as unknown as { 
  isInitialized: boolean;
  workerInstance: any;
};

export const initializeApp = async () => {
  if (globalForInit.isInitialized) return;

  logger.info("[Init] Initialisation de l'application...");

  // Initialiser le worker BullMQ
  if (!globalForInit.workerInstance) {
    globalForInit.workerInstance = initWorker();
    logger.info("[Init] Worker BullMQ initialisé.");
  }

  // Relancer toutes les instances WhatsApp actives
  try {
    await WhatsAppService.initializeAll();
    const activeInstances = await prisma.botInstance.findMany({
      where: { status: { not: "DISCONNECTED" } },
      select: { id: true },
    });
    await scheduleDailyStatuses(activeInstances.map(i => i.id));
    logger.info("[Init] Instances WhatsApp relancées et statuts planifiés.");
  } catch (error) {
    logger.error(error, "[Init] Erreur lors de la relance des instances WhatsApp:");
  }

  globalForInit.isInitialized = true;
};
