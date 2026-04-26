import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { initWorker } from "./queue";
import { logger } from "./logger";
import { prisma } from "./prisma";

const globalForInit = global as unknown as { 
  isInitialized: boolean;
  workerInstance: any;
};

export const initializeApp = async () => {
  if (globalForInit.isInitialized) return;

  logger.info("[Init] Initialisation de l'application...");

  // Initialiser le worker BullMQ et charger les plannings
  if (!globalForInit.workerInstance) {
    globalForInit.workerInstance = await initWorker();
    logger.info("[Init] Worker BullMQ et plannings initialisés.");
  }

  // Relancer toutes les instances WhatsApp actives
  try {
    await WhatsAppService.initializeAll();
    logger.info("[Init] Instances WhatsApp relancées.");
  } catch (error) {
    logger.error(error, "[Init] Erreur lors de la relance des instances WhatsApp:");
  }

  globalForInit.isInitialized = true;
};
