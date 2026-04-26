import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "../DashboardClient";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  let session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) redirect("/login");
    userId = firstUser.id;
  }

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { contacts: true, messages: true },
      },
    },
  });

  const totalMessages = await prisma.message.count({
    where: { botInstance: { ownerId: userId } },
  });

  const totalContacts = await prisma.contact.count({
    where: { botInstance: { ownerId: userId } },
  });

  const stats = {
    usersCount: totalContacts,
    messagesCount: totalMessages,
  };

  const defaultInstance = instances[0];

  const contacts = defaultInstance
    ? await prisma.contact.findMany({
        where: { botInstanceId: defaultInstance.id },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
        take: 20,
      })
    : [];

  return (
    <DashboardClient
      users={contacts}
      stats={stats}
      instances={instances as any}
    />
  );
}
