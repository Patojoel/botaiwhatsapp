import { prisma } from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  // Stats
  const usersCount = await prisma.user.count();
  const messagesCount = await prisma.message.count();

  // Users with message counts
  const users = await prisma.user.findMany({
    include: {
      _count: {
        select: { messages: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50, // limit per user for visualization
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    usersCount,
    messagesCount,
  };

  return <DashboardClient users={users} stats={stats} />;
}
