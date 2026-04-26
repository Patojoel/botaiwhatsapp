import {
  AuthenticationState,
  AuthenticationCreds,
  SignalDataTypeMap,
  initAuthCreds,
  BufferJSON,
  proto,
} from "@whiskeysockets/baileys";
import { prisma } from "@/lib/prisma";

export const usePrismaAuthState = async (
  botInstanceId: string,
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, key: string) => {
    const value = JSON.stringify(data, BufferJSON.replacer);
      await prisma.whatsappSession.upsert({
        where: {
          botInstanceId_key: {
            botInstanceId,
            key,
          },
        },
        update: { value },
        create: {
          botInstanceId,
          key,
          value,
        },
      });
    };
  
    const readData = async (key: string) => {
      try {
        const session = await prisma.whatsappSession.findUnique({
          where: {
            botInstanceId_key: {
              botInstanceId,
              key,
            },
          },
        });
        return session ? JSON.parse(session.value, BufferJSON.reviver) : null;
      } catch (error) {
        return null;
      }
    };
  
    const removeData = async (key: string) => {
      try {
        await prisma.whatsappSession.delete({
          where: {
            botInstanceId_key: {
              botInstanceId,
              key,
            },
          },
        });
    } catch (error) {
      // Ignorer si déjà supprimé
    }
  };

  const creds: AuthenticationCreds = (await readData("creds")) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: any = {};
          await Promise.all(
            ids.map(async (id) => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
              data[id] = value;
            }),
          );
          return data;
        },
        set: async (data) => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            const categoryData = data[category as keyof SignalDataTypeMap];
            if (categoryData) {
              for (const id in categoryData) {
                const value = categoryData[id];
                const key = `${category}-${id}`;
                tasks.push(value ? writeData(value, key) : removeData(key));
              }
            }
          }
          await Promise.all(tasks);
        },
      },
    },
    saveCreds: () => writeData(creds, "creds"),
  };
};
