import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let session = await auth();
  let userId = session?.user?.id;

  // Si pas de session, on peut soit rediriger, soit simuler un utilisateur pour le test
  if (!userId) {
    // redirect("/login"); // Décommenter pour forcer le login
    
    // Pour "enlever l'auth" comme demandé, on récupère le premier utilisateur dispo
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      redirect("/login");
    }
    userId = firstUser.id;
  }

  // Récupérer les instances du bot de l'utilisateur
  const instances = await prisma.botInstance.findMany({
    where: { ownerId: userId },
    include: {
      _count: {
        select: { contacts: true, messages: true },
      },
    },
  });

  // Récupérer les stats globales pour l'admin ou juste pour l'utilisateur
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

  // Passer les premières instances pour la démo dashboard
  // Dans un vrai SaaS, on choisirait une instance spécifique
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
    <div className="p-4">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tableau de bord SaaS</h1>
        <div className="text-sm text-gray-500">
          {session?.user ? `Connecté en tant que: ${session.user.email}` : "Mode Invité (Authentification désactivée)"}
        </div>
      </div>

      <DashboardClient
        users={contacts}
        stats={stats}
        instances={instances}
      />
    </div>
  );
}
