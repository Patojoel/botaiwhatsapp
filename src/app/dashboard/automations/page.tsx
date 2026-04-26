import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AutomationsClient from "./AutomationsClient";

export default async function AutomationsPage() {
  const session = await auth();
  
  // En mode dév on peut laisser passer ou utiliser un utilisateur par défaut
  let user: any = session?.user;
  if (!user) {
    user = await prisma.user.findFirst();
    if (!user) redirect("/login");
  }

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: user.id },
    include: {
      _count: {
        select: { contacts: true, messages: true }
      }
    }
  });

  return <AutomationsClient instances={instances as any} />;
}
