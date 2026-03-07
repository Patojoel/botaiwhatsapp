import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { Role } from "@prisma/client/wasm";

export class ConversationRepository {
  static async getOrCreateUser(phone: string, name?: string) {
    try {
      let user = await prisma.user.findUnique({
        where: { phone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: { phone, name },
        });
        logger.info({ phone }, `[Conversation] Nouvel utilisateur créé`);
      }

      return user;
    } catch (error) {
      logger.error({ phone, error }, `[Conversation] Erreur getOrCreateUser`);
      throw error;
    }
  }

  static async getHistory(userId: string, limit: number = 10) {
    try {
      const messages = await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      // Remettre dans l'ordre chronologique
      return messages.reverse();
    } catch (error) {
      logger.error({ userId, error }, `[Conversation] Erreur getHistory`);
      throw error;
    }
  }

  static async saveMessage(userId: string, role: Role, content: string) {
    try {
      const message = await prisma.message.create({
        data: {
          userId,
          role,
          content,
        },
      });
      return message;
    } catch (error) {
      logger.error(
        {
          userId,
          role,
          error,
        },
        `[Conversation] Erreur saveMessage`,
      );
      throw error;
    }
  }
}
