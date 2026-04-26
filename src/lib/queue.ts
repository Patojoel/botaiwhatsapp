import { Queue, Worker, Job } from "bullmq";
import { aiService } from "@/modules/ai/ai.service";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { prisma } from "./prisma";
import fs from "fs/promises";
import path from "path";
import { logger } from "./logger";
import { ConversationRepository } from "@/modules/conversation/conversation.repository";

const connection: any = process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379"),
};

// On garde le nom messageQueue pour la compatibilité
let messageQueue: Queue;

if (!(global as any).messageQueue) {
  (global as any).messageQueue = new Queue("ai-processing", {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: true,
    },
  });
}
messageQueue = (global as any).messageQueue;

export const broadcastQueue = new Queue("whatsapp-broadcasts", {
  connection,
});

export { messageQueue };
export const aiQueue = messageQueue; // Alias pour la compatibilité interne

export async function addAIJob(data: any) {
  return messageQueue.add("processAI", data);
}

// --- HELPERS PLANIFICATION MODULAIRE ---

function generateCronPatterns(scheduleConfig: any[]): string[] {
    if (!scheduleConfig || !Array.isArray(scheduleConfig)) return [];
    
    const patterns: string[] = [];
    scheduleConfig.forEach(item => {
        if (item.times && item.times.length > 0) {
            item.times.forEach((time: string) => {
                const [hour, minute] = time.split(":");
                // Format Cron: minute hour dayOfMonth month dayOfWeek
                patterns.push(`${parseInt(minute)} ${parseInt(hour)} * * ${item.day}`);
            });
        }
    });
    return patterns;
}

export async function updateCampaignJob(campaignId: string, cronPattern: string, isActive: boolean, scheduleConfig?: any) {
    // Supprimer tous les anciens jobs liés à cette campagne
    const jobs = await messageQueue.getRepeatableJobs();
    const existingJobs = jobs.filter(j => j.id?.startsWith(`campaign-${campaignId}`));
    for (const j of existingJobs) {
        await messageQueue.removeRepeatableByKey(j.key);
    }

    if (!isActive) return;

    // Si on a une config modulaire, on génère plusieurs jobs
    if (scheduleConfig && Array.isArray(scheduleConfig)) {
        const patterns = generateCronPatterns(scheduleConfig);
        for (let i = 0; i < patterns.length; i++) {
            await messageQueue.add(
                "status-update",
                { campaignId },
                {
                    repeat: { pattern: patterns[i] },
                    jobId: `campaign-${campaignId}-${i}`,
                    removeOnComplete: true,
                }
            );
        }
        logger.info(`[Queue] Campagne ${campaignId}: ${patterns.length} horaires programmés via config modulaire.`);
    } else if (cronPattern) {
        // Fallback sur le cron unique si pas de config modulaire
        await messageQueue.add(
            "status-update",
            { campaignId },
            {
                repeat: { pattern: cronPattern },
                jobId: `campaign-${campaignId}`,
                removeOnComplete: true,
            }
        );
        logger.info(`[Queue] Campagne ${campaignId} programmée via cron simple: ${cronPattern}`);
    }
}

// Alias pour la compatibilité avec les routes d'instance
export const updateBotStatusSchedule = updateCampaignJob;

export async function removeCampaignJob(campaignId: string) {
    const jobs = await messageQueue.getRepeatableJobs();
    const existingJobs = jobs.filter(j => j?.id?.startsWith(`campaign-${campaignId}`));
    for (const j of existingJobs) {
        await messageQueue.removeRepeatableByKey(j.key);
    }
}

export async function updateBroadcastJob(broadcastId: string, cronPattern: string | null, isActive: boolean, scheduleConfig?: any) {
    // Supprimer tous les anciens jobs
    const jobs = await broadcastQueue.getRepeatableJobs();
    const existingJobs = jobs.filter(j => j.id?.startsWith(`broadcast-${broadcastId}`));
    for (const j of existingJobs) {
        await broadcastQueue.removeRepeatableByKey(j.key);
    }

    if (!isActive) return;

    if (scheduleConfig && Array.isArray(scheduleConfig)) {
        const patterns = generateCronPatterns(scheduleConfig);
        for (let i = 0; i < patterns.length; i++) {
            await broadcastQueue.add(
                "send-broadcast",
                { broadcastId },
                {
                    repeat: { pattern: patterns[i] },
                    jobId: `broadcast-${broadcastId}-${i}`,
                    removeOnComplete: true,
                }
            );
        }
        logger.info(`[Queue] Broadcast ${broadcastId}: ${patterns.length} horaires programmés.`);
    } else if (cronPattern) {
        await broadcastQueue.add(
            "send-broadcast",
            { broadcastId },
            {
                repeat: { pattern: cronPattern },
                jobId: `broadcast-${broadcastId}`,
                removeOnComplete: true,
            }
        );
        logger.info(`[Queue] Broadcast ${broadcastId} programmé: ${cronPattern}`);
    } else {
        // Envoi immédiat si pas de cron et pas de config
        await broadcastQueue.add("send-broadcast", { broadcastId });
    }
}

// Worker
if (!(global as any).aiWorker) {
    // Worker pour les diffusions (Broadcast)
    const broadcastWorker = new Worker("whatsapp-broadcasts", async (job) => {
        const { broadcastId } = job.data;
        logger.info(`[Queue] Traitement broadcast ${broadcastId}`);

        try {
            const broadcast = await (prisma as any).broadcastCampaign.findUnique({
                where: { id: broadcastId },
                include: {
                    recipients: {
                        where: { status: "PENDING" },
                        include: { contact: true }
                    }
                }
            });

            if (!broadcast || broadcast.recipients.length === 0) {
                await (prisma as any).broadcastCampaign.update({
                    where: { id: broadcastId },
                    data: { status: "COMPLETED" }
                });
                return;
            }

            // Marquer comme en cours
            await (prisma as any).broadcastCampaign.update({
                where: { id: broadcastId },
                data: { status: "PROCESSING" }
            });

            // Envoi aux destinataires avec délai
            for (const recipient of broadcast.recipients) {
                try {
                    // Vérifier si la campagne est toujours active
                    const current = await (prisma as any).broadcastCampaign.findUnique({ where: { id: broadcastId } });
                    if (current.status === "PAUSED") break;

                    await WhatsAppService.sendDirectMessage(
                        broadcast.botInstanceId,
                        recipient.contact.phone,
                        broadcast.content,
                        broadcast.mediaUrl || undefined,
                        broadcast.mediaType as any
                    );

                    // Update recipient status
                    await (prisma as any).broadcastRecipient.update({
                        where: { id: recipient.id },
                        data: { status: "SENT" }
                    });

                    // Log
                    await (prisma as any).broadcastLog.create({
                        data: {
                            broadcastCampaignId: broadcastId,
                            contactPhone: recipient.contact.phone,
                            status: "SENT"
                        }
                    });

                    // Délai anti-spam (2-5 secondes)
                    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
                } catch (err: any) {
                    logger.error(`[Queue] Erreur envoi broadcast à ${recipient.contact.phone}: ${err}`);
                    await (prisma as any).broadcastLog.create({
                        data: {
                            broadcastCampaignId: broadcastId,
                            contactPhone: recipient.contact.phone,
                            status: "FAILED",
                            error: err.message
                        }
                    });
                }
            }

            // Terminer
            await (prisma as any).broadcastCampaign.update({
                where: { id: broadcastId },
                data: { status: "COMPLETED" }
            });

        } catch (error) {
            logger.error(`[Queue] Erreur critique broadcast ${broadcastId}: ${error}`);
            throw error;
        }
    }, { connection, concurrency: 1 });

    (global as any).broadcastWorker = broadcastWorker;

    (global as any).aiWorker = new Worker(
        "ai-processing",
        async (job: Job) => {
            if (job.name === "processAI") {
                let { botInstanceId, contactId, messages, mediaUrl, remoteJid } = job.data;
                
                try {
                    // Charger l'instance avec son prompt actif et les produits liés
                    const instance = await prisma.botInstance.findUnique({
                        where: { id: botInstanceId },
                        include: {
                            activePrompt: {
                                include: { products: true }
                            }
                        }
                    });

                    logger.info(`[Queue] Processing AI for instance ${botInstanceId}. Active Prompt: ${instance?.activePrompt?.name || "NONE"}`);

                    // Si les messages ne sont pas fournis, on charge l'historique
                    if (!messages || !Array.isArray(messages)) {
                        const history = await (ConversationRepository as any).getHistory(contactId);
                        messages = history.map((m: any) => ({ role: m.role, content: m.content }));
                    }

                    // Préparer le contexte enrichi
                    let enrichedContext = undefined;
                    if (instance?.activePrompt) {
                        const p = instance.activePrompt;
                        let productsInfo = "";
                        let productImages: string[] = [];

                        if (p.products && p.products.length > 0) {
                            logger.info(`[Queue] Found ${p.products.length} products for context.`);
                            productsInfo = "\n\n### CATALOGUE PRODUITS (IMPORTANT: utilise [IMAGE:ID] pour envoyer la photo d'un produit)\n" + p.products.map((prod: any) => 
                                `- ${prod.name} (ID: ${prod.id}): ${prod.description} | Prix: ${prod.price} ${prod.currency} | Caractéristiques: ${prod.features.join(", ")}`
                            ).join("\n");

                            // Récupérer la première image de chaque produit pour l'IA
                            productImages = p.products
                                .map((prod: any) => prod.images?.[0])
                                .filter((img: string) => !!img);
                        }

                        enrichedContext = {
                            prompt: p.content,
                            rules: p.rules,
                            productsInfo,
                            restrictToProducts: p.restrictToProducts,
                            productImages
                        };
                    }

                    const response = await aiService.generateResponse(
                        botInstanceId, 
                        messages, 
                        mediaUrl,
                        undefined, // fallbackPrompt
                        enrichedContext
                    );
                    
                    logger.info(`[Queue] AI Response: "${response}"`);
                    // Envoyer la réponse via WhatsApp (Texte)
                    let cleanResponse = response;
                    const imageMatch = response.match(/\[IMAGE:\s*([\w-]+)\s*\]/);
                    
                    if (imageMatch) {
                        const productId = imageMatch[1];
                        cleanResponse = response.replace(/\[IMAGE:\s*[\w-]+\s*\]/g, "").trim();
                        
                        // Récupérer l'image du produit
                        const product = await prisma.product.findUnique({ where: { id: productId } });
                        const images = product?.images as any[];
                        
                        if (product && Array.isArray(images) && images.length > 0) {
                            const imageToSend = images[0];
                            if (imageToSend) {
                                logger.info(`[Queue] AI requested image for product ${productId}. Sending...`);
                                
                                // Envoi de l'image
                                await WhatsAppService.sendDirectMessage(
                                    botInstanceId,
                                    remoteJid,
                                    `Voici la photo de : ${product.name}`,
                                    imageToSend,
                                    "image"
                                );
                            }
                        }
                    }

                    // Envoyer le texte final
                    await WhatsAppService.sendTextMessage(botInstanceId, remoteJid, cleanResponse);

                    // Sauvegarder la réponse de l'assistant
                    await (ConversationRepository as any).saveMessage(botInstanceId, contactId, "assistant", cleanResponse);

                    return { response };
                } catch (error) {
                    logger.error(`[Queue] AI Error: ${error}`);
                    throw error;
                }
            } else if (job.name === "status-update") {
                const { campaignId } = job.data;
                try {
                    // Gérer à la fois les campagnes et les instances (ancien système)
                    let campaign;
                    if (campaignId.startsWith("instance-")) {
                        const instId = campaignId.replace("instance-", "");
                        const inst = await prisma.botInstance.findUnique({ where: { id: instId } });
                        if (!inst) return;
                        campaign = {
                            id: inst.id,
                            botInstanceId: inst.id,
                            mediaUrl: inst.statusMediaUrl,
                            mediaType: inst.statusMediaType,
                            useAI: true,
                            isActive: true,
                            customText: null,
                            name: "Statut Instance"
                        };
                    } else {
                        campaign = await (prisma as any).statusCampaign.findUnique({
                            where: { id: campaignId },
                            include: { botInstance: true }
                        });
                    }

                    if (!campaign || !campaign.isActive) return;

                    let aiMediaUrl = campaign.mediaUrl;
                    if (aiMediaUrl && aiMediaUrl.includes("/uploads/")) {
                        try {
                            const fileName = aiMediaUrl.split("/uploads/")[1];
                            const absoluteUploadsDir = path.join(process.cwd(), "public", "uploads");
                            const filePath = path.join(absoluteUploadsDir, fileName);
                            const fileBuffer = await fs.readFile(filePath);
                            const base64Image = fileBuffer.toString("base64");
                            const ext = path.extname(fileName).toLowerCase().replace(".", "");
                            const mimeType = ext === "png" ? "image/png" : "image/jpeg";
                            aiMediaUrl = `data:${mimeType};base64,${base64Image}`;
                        } catch (err) {
                            logger.error(`[Queue] Erreur lecture fichier local (${campaign.mediaUrl}): ${err}`);
                            aiMediaUrl = null;
                        }
                    }

                    let statusText = campaign.customText;
                    if (campaign.useAI) {
                        const hasValidImage = aiMediaUrl && aiMediaUrl.startsWith("data:image");
                        statusText = await aiService.generateResponse(campaign.botInstanceId, [
                            {
                                role: "user",
                                content: (hasValidImage && campaign.mediaType === "image")
                                    ? "Analyse cette image et génère un court message inspirant ou une légende adaptée (max 150 car.) pour mon statut WhatsApp."
                                    : "Génère un court message inspirant (max 150 car.) pour un statut WhatsApp.",
                            },
                        ], (hasValidImage && campaign.mediaType === "image") ? aiMediaUrl : undefined);
                    }

                    await WhatsAppService.sendStatusUpdate(
                        campaign.botInstanceId,
                        statusText || "",
                        aiMediaUrl || undefined,
                        campaign.mediaType as any
                    );

                    // Log
                    await (prisma as any).statusLog.create({
                        data: {
                            botInstanceId: campaign.botInstanceId,
                            campaignId: campaignId.startsWith("instance-") ? null : campaignId,
                            text: statusText || "",
                            mediaUrl: campaign.mediaUrl,
                            mediaType: campaign.mediaType,
                            status: "SUCCESS"
                        }
                    });

                    logger.info(`[Queue] Statut publié pour ${campaign.name}`);
                } catch (error: any) {
                    logger.error(`[Queue] Erreur job ${campaignId}: ${error}`);
                    throw error;
                }
            }
        },
        { connection, concurrency: 5 }
    );
}

export const initWorker = async () => {
    logger.info("[Init] Chargement des tâches planifiées...");
    try {
        // Charger les campagnes de statut (Nouveau système)
        const campaigns = await (prisma as any).statusCampaign.findMany({ where: { isActive: true } });
        for (const c of campaigns) {
            await updateCampaignJob(c.id, c.cronPattern, c.isActive, c.scheduleConfig);
        }

        // Charger les anciens plannings d'instances (Ancien système)
        const instances = await (prisma.botInstance as any).findMany({
            where: { statusSchedule: { not: null } }
        });
        for (const inst of instances) {
            const schedule = (inst as any).statusSchedule;
            if (schedule) {
                await updateCampaignJob(`instance-${inst.id}`, schedule, true);
            }
        }

        // Charger les diffusions actives
        const broadcasts = await (prisma as any).broadcastCampaign.findMany({
            where: { isActive: true }
        });
        for (const b of broadcasts) {
            if (b.scheduleConfig || b.cronPattern) {
                await updateBroadcastJob(b.id, b.cronPattern, b.isActive, b.scheduleConfig);
            }
        }
    } catch (err) {
        logger.error(`[Init] Erreur initialisation planning: ${err}`);
    }
    return (global as any).aiWorker;
};
