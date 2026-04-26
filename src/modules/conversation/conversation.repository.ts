import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Role } from "@prisma/client/wasm";

export class ConversationRepository {
  static async getOrCreateContact(
    botInstanceId: string,
    phone: string,
    name?: string,
  ) {
    try {
      let contact = await prisma.contact.findUnique({
        where: {
          phone_botInstanceId: {
            phone,
            botInstanceId,
          },
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            phone,
            name,
            botInstanceId,
          },
        });
        logger.info(
          { phone, botInstanceId },
          `[Conversation] Nouveau contact créé`,
        );
      }

      return contact;
    } catch (error) {
      logger.error(
        { phone, botInstanceId, error },
        `[Conversation] Erreur getOrCreateContact`,
      );
      throw error;
    }
  }

  static async getHistory(contactId: string, limit: number = 10) {
    try {
      const messages = await prisma.message.findMany({
        where: { contactId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return messages.reverse();
    } catch (error) {
      logger.error({ contactId, error }, `[Conversation] Erreur getHistory`);
      throw error;
    }
  }

  static async saveMessage(
    botInstanceId: string,
    contactId: string,
    role: Role,
    content: string,
  ) {
    try {
      const message = await prisma.message.create({
        data: {
          contactId,
          botInstanceId,
          role,
          content,
        },
      });
      return message;
    } catch (error) {
      logger.error(
        {
          botInstanceId,
          contactId,
          role,
          error,
        },
        `[Conversation] Erreur saveMessage`,
      );
      throw error;
    }
  }
}
