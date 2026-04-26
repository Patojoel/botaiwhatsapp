import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import BroadcastsClient from "./BroadcastsClient";

export default async function BroadcastsPage() {
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  // Récupérer les instances pour le filtrage ou l'affichage
  const instances = await prisma.botInstance.findMany({
    where: { ownerId: user?.id },
    select: { id: true, name: true }
  });

  return (
    <div className="p-8">
      <BroadcastsClient instances={instances} />
    </div>
  );
}
