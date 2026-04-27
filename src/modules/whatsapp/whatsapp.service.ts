import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadContentFromMessage
} from "@whiskeysockets/baileys";
import { usePrismaAuthState } from "./prisma-auth";
import { Boom } from "@hapi/boom";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { ConversationRepository } from "../conversation/conversation.repository";
import { AudioService } from "../ai/audio.service";
import pino from "pino";
import path from "path";
import fs from "fs/promises";
import { EventEmitter } from "events";
import { messageQueue } from "@/lib/queue";

interface InstanceData {
  socket: any;
  qrCode: string | null;
  status: "Disconnected" | "Connecting" | "Connected" | "QR Ready";
}

const globalForBaileys = global as unknown as {
  whatsappInstances: Map<string, InstanceData>;
  whatsappEvents: EventEmitter;
};

if (!globalForBaileys.whatsappInstances) {
  globalForBaileys.whatsappInstances = new Map();
}

if (!globalForBaileys.whatsappEvents) {
  globalForBaileys.whatsappEvents = new EventEmitter();
  globalForBaileys.whatsappEvents.setMaxListeners(100);
}

export class WhatsAppService {
  private static get instances() {
    return globalForBaileys.whatsappInstances;
  }

  static get events() {
    return globalForBaileys.whatsappEvents;
  }

  static async initializeAll() {
    const activeInstances = await prisma.botInstance.findMany({
      where: { status: { not: "DISCONNECTED" } },
    });

    for (const instance of activeInstances) {
      await this.initializeInstance(instance.id);
    }
  }

  static async initializeInstance(botInstanceId: string) {
    const existing = this.instances.get(botInstanceId);
    if (existing?.status === "Connected" || existing?.status === "Connecting") {
      return;
    }

    if (existing?.socket) {
      try {
        existing.socket.end();
      } catch (e) {}
    }

    logger.info(`[WhatsApp] Initialisation de l'instance: ${botInstanceId}`);
    this.updateInstanceState(botInstanceId, {
      status: "Connecting",
      qrCode: null,
    });

    try {
      const { state, saveCreds } = await usePrismaAuthState(botInstanceId);
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }) as any,
      });

      this.instances.get(botInstanceId)!.socket = sock;

      sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.updateInstanceState(botInstanceId, {
            qrCode: qr,
            status: "QR Ready",
          });
          await prisma.botInstance.update({
            where: { id: botInstanceId },
            data: { status: "QR_READY" },
          });
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          this.updateInstanceState(botInstanceId, {
            status: "Disconnected",
            qrCode: null,
          });
          await prisma.botInstance.update({
            where: { id: botInstanceId },
            data: { status: "DISCONNECTED" },
          });

          if (shouldReconnect) {
            this.initializeInstance(botInstanceId);
          } else {
            logger.info(
              `[WhatsApp] Instance ${botInstanceId} déconnectée définitivement`,
            );
            // Les sessions sont déjà gérées par la cascade Prisma si l'instance est supprimée
            // ou on peut faire un cleanup manuel ici si on veut nettoyer uniquement les clés de session
            await prisma.whatsappSession.deleteMany({
              where: { botInstanceId },
            });
          }
        } else if (connection === "open") {
          this.updateInstanceState(botInstanceId, {
            status: "Connected",
            qrCode: null,
          });
          await prisma.botInstance.update({
            where: { id: botInstanceId },
            data: {
              status: "CONNECTED",
              phone: sock.user?.id.split(":")[0].split("@")[0],
            },
          });
          logger.info(
            `[WhatsApp] Instance ${botInstanceId} connectée (${sock.user?.id})`,
          );
        }
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;
        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;
        if (msg.key.remoteJid?.endsWith("@g.us")) return;
        if (msg.key.remoteJid === "status@broadcast") return;

        const senderPhone =
          msg.key.remoteJid?.replace("@s.whatsapp.net", "") || "";
        const pushName = msg.pushName || undefined;
        
        let content = msg.message.conversation || msg.message.extendedTextMessage?.text;
        
        // --- NOUVEAU : Gestion des messages audio ---
        if (!content && msg.message.audioMessage) {
          try {
            logger.info(`[WhatsApp] Téléchargement d'un vocal de ${senderPhone}...`);
            const stream = await downloadContentFromMessage(msg.message.audioMessage, 'audio');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            
            // Transcription via Groq
            const transcription = await AudioService.transcribe(buffer);
            content = `(Vocal) : ${transcription}`;
            logger.info(`[WhatsApp] Transcription réussie et préparée: "${content}"`);
          } catch (audioErr) {
            logger.error({ audioErr }, "[WhatsApp] Échec de la transcription audio");
          }
        }

        if (!content) return;

        try {
          const contact = await ConversationRepository.getOrCreateContact(
            botInstanceId,
            senderPhone,
            pushName,
          );
          await ConversationRepository.saveMessage(
            botInstanceId,
            contact.id,
            "user",
            content,
          );

          logger.info(`[WhatsApp] Message mis en file d'attente pour l'IA. Contenu: "${content.substring(0, 50)}..."`);
          
          // Phase 3 : Déléguer à BullMQ pour le traitement asynchrone (IA + réponse)
          await messageQueue.add("processAI", {
            botInstanceId,
            contactId: contact.id,
            remoteJid: msg.key.remoteJid,
          });
        } catch (error) {
          logger.error(
            { error, botInstanceId },
            `[WhatsApp] Erreur réception message instance ${botInstanceId}`,
          );
        }
      });
    } catch (error) {
      logger.error(
        { error, botInstanceId },
        `[WhatsApp] Erreur initialisation instance ${botInstanceId}`,
      );
      this.updateInstanceState(botInstanceId, { status: "Disconnected" });
    }
  }

  private static updateInstanceState(
    botInstanceId: string,
    partialData: Partial<InstanceData>,
  ) {
    const current = this.instances.get(botInstanceId) || {
      socket: null,
      qrCode: null,
      status: "Disconnected",
    };
    const updated = { ...current, ...partialData };
    this.instances.set(botInstanceId, updated);

    // Émettre l'événement de mise à jour
    this.events.emit(`update:${botInstanceId}`, {
      status: updated.status,
      qrCode: updated.qrCode,
    });
  }

  static getInstanceStatus(botInstanceId: string) {
    return (
      this.instances.get(botInstanceId) || {
        status: "Disconnected",
        qrCode: null,
      }
    );
  }

  static async logoutInstance(botInstanceId: string) {
    const instance = this.instances.get(botInstanceId);
    if (instance?.socket) {
      await instance.socket.logout();
      this.instances.delete(botInstanceId);
    }
  }

  static async sendTextMessage(
    botInstanceId: string,
    remoteJid: string,
    text: string,
  ) {
    const instance = this.instances.get(botInstanceId);
    if (!instance || instance.status !== "Connected" || !instance.socket) {
      throw new Error(`Instance ${botInstanceId} is not connected`);
    }
    await instance.socket.sendMessage(remoteJid, { text });
  }

  static async sendStatusUpdate(botInstanceId: string, text: string, mediaUrl?: string, mediaType: "image" | "video" = "image") {
    const instance = this.instances.get(botInstanceId);
    if (!instance || instance.status !== "Connected" || !instance.socket) {
      throw new Error(`Instance ${botInstanceId} is not connected`);
    }

    // Récupérer tous les contacts pour s'assurer que le statut est visible par eux
    const contacts = await prisma.contact.findMany({
      where: { botInstanceId: botInstanceId },
      select: { phone: true }
    });
    // On s'assure que chaque téléphone a le bon suffixe WhatsApp
    const jids = contacts.map(c => c.phone.includes("@") ? c.phone : `${c.phone}@s.whatsapp.net`);

    if (mediaUrl) {
      try {
        let mediaContent: any;
        
        if (mediaUrl.startsWith("data:")) {
          // Si c'est déjà du Base64 (Data URI)
          mediaContent = { url: mediaUrl };
        } else if (mediaUrl.startsWith("/uploads/")) {
          // Résolution absolue pour éviter toute ambiguïté
          const fileName = mediaUrl.substring(9); // après /uploads/
          const absolutePath = path.join(process.cwd(), "public", "uploads", fileName);
          
          logger.info(`[WhatsApp] Lecture du fichier local: ${absolutePath}`);
          mediaContent = await fs.readFile(absolutePath);
        } else {
          // Si c'est une URL externe (http...)
          mediaContent = { url: mediaUrl };
        }

        await instance.socket.sendMessage("status@broadcast", {
          [mediaType]: mediaContent,
          caption: text,
        }, { statusJidList: jids });
      } catch (err) {
        logger.error(`[WhatsApp] Erreur média (${mediaUrl.substring(0, 50)}...): ${err}`);
        // Fallback: envoyer au moins le texte si le média échoue
        await instance.socket.sendMessage("status@broadcast", { 
          text,
          backgroundColor: "#075E54",
          font: 1
        }, { statusJidList: jids });
      }
    } else {
      await instance.socket.sendMessage("status@broadcast", { 
        text,
        backgroundColor: "#075E54",
        font: 1
      }, { statusJidList: jids });
    }
  }

  static async sendDirectMessage(
    instanceId: string,
    phone: string,
    text: string,
    mediaUrl?: string,
    mediaType: "image" | "video" | "none" = "none"
  ) {
    const instance = globalForBaileys.whatsappInstances.get(instanceId);
    if (!instance || instance.status !== "Connected") {
      throw new Error("Instance non connectée");
    }

    const jid = phone.includes("@") ? phone : `${phone}@s.whatsapp.net`;
    const messageOptions: any = {};

    if (mediaUrl && mediaType !== "none") {
      let mediaContent: any;
      if (mediaUrl.startsWith("data:")) {
        mediaContent = { url: mediaUrl };
      } else if (mediaUrl.startsWith("/uploads/")) {
        const fileName = mediaUrl.substring(9);
        const absolutePath = path.join(process.cwd(), "public", "uploads", fileName);
        mediaContent = await fs.readFile(absolutePath);
      } else {
        mediaContent = { url: mediaUrl };
      }
      messageOptions[mediaType] = mediaContent;
      messageOptions.caption = text;
    } else {
      messageOptions.text = text;
    }

    await instance.socket.sendMessage(jid, messageOptions);
  }
}
