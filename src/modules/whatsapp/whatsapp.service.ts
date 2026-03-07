import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import { logger } from "@/lib/logger";
import { ConversationRepository } from "../conversation/conversation.repository";
import { aiService } from "../ai/ai.service";
import fs from "fs";
import pino from "pino";

const globalForBaileys = global as unknown as { whatsappSocket: any };

export class WhatsAppService {
  private static get socket() {
    return globalForBaileys.whatsappSocket;
  }
  private static set socket(s: any) {
    globalForBaileys.whatsappSocket = s;
  }
  public static qrCode: string | null = null;
  public static status:
    | "Disconnected"
    | "Connecting"
    | "Connected"
    | "QR Ready" = "Disconnected";

  static async initialize() {
    if (this.socket) {
      this.status = "Connected";
      return;
    }
    this.status = "Connecting";

    try {
      const { state, saveCreds } =
        await useMultiFileAuthState("auth_info_baileys");
      const { version } = await fetchLatestBaileysVersion();

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }) as any,
      });

      sock.ev.on("connection.update", (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          this.qrCode = qr;
          this.status = "QR Ready";
          logger.info("[WhatsApp] QR Code prêt à être scanné");
        }

        if (connection === "close") {
          const shouldReconnect =
            (lastDisconnect?.error as Boom)?.output?.statusCode !==
            DisconnectReason.loggedOut;

          logger.warn(
            {
              error: lastDisconnect?.error,
            },
            `[WhatsApp] Déconnecté. Reconnexion: ${shouldReconnect}`,
          );

          this.socket = null;
          this.status = "Disconnected";

          if (shouldReconnect) {
            this.initialize();
          } else {
            // Logged out
            logger.info(
              "[WhatsApp] Déconnecté intentionnellement (logged out). Suppression des credentials...",
            );
            if (fs.existsSync("auth_info_baileys")) {
              fs.rmSync("auth_info_baileys", { recursive: true, force: true });
            }
          }
        } else if (connection === "open") {
          this.status = "Connected";
          this.qrCode = null;
          logger.info("[WhatsApp] Connecté avec succès !");
        }
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on("messages.upsert", async (m) => {
        if (m.type !== "notify") return;
        const msg = m.messages[0];

        if (!msg.message || msg.key.fromMe) return;
        if (msg.key.remoteJid?.endsWith("@g.us")) return; // Ignore les groupes
        if (msg.key.remoteJid === "status@broadcast") return; // Ignore les statuts

        const senderPhone =
          msg.key.remoteJid?.replace("@s.whatsapp.net", "") || "";
        const pushName = msg.pushName || undefined;

        // Extraction du texte (texte brut ou réponse à un message)
        const content =
          msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!content) return; // Ignore si pas de texte

        const maskedPhone = senderPhone.replace(
          /(\d{2})(\d+)(\d{4})/,
          "$1***$3",
        );
        logger.info(`[WhatsApp] Message reçu de ${maskedPhone}`);

        try {
          // 1. Récupérer ou créer l'utilisateur
          const user = await ConversationRepository.getOrCreateUser(
            senderPhone,
            pushName,
          );

          // 2. Sauvegarder le message de l'utilisateur
          await ConversationRepository.saveMessage(user.id, "user", content);

          // 3. Récupérer l'historique (10 messages max)
          const history = await ConversationRepository.getHistory(user.id, 10);
          const aiMessages = history.map((h: any) => ({
            role: h.role === "user" ? "user" : "assistant",
            content: h.content,
          })) as { role: "user" | "assistant"; content: string }[];

          // 4. Appeler l'IA
          const aiResponse = await aiService.generateResponse(aiMessages);

          // 5. Sauvegarder la réponse
          await ConversationRepository.saveMessage(
            user.id,
            "assistant",
            aiResponse,
          );

          // 6. Envoyer la réponse WhatsApp
          await sock.sendMessage(msg.key.remoteJid!, { text: aiResponse });
          logger.info(`[WhatsApp] Réponse envoyée à ${maskedPhone}`);
        } catch (error) {
          logger.error(
            { error },
            `[WhatsApp] Erreur traitement message de ${senderPhone}`,
          );
          await sock.sendMessage(msg.key.remoteJid!, {
            text: "Désolé, le service est momentanément indisponible. Veuillez réessayer plus tard.",
          });
        }
      });

      this.socket = sock;
    } catch (error) {
      logger.error({ error }, "[WhatsApp] Erreur initialisation");
      this.status = "Disconnected";
    }
  }

  static async reconnect() {
    logger.info("[WhatsApp] Demande de reconnexion manuelle...");
    this.status = "Disconnected";
    this.qrCode = null;
    if (this.socket) {
      this.socket.end(new Error("Manual reconnect"));
      this.socket = null;
    }

    // Attendre un peu avant de relancer
    setTimeout(() => {
      this.initialize();
    }, 2000);

    return true;
  }
}
