import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import BroadcastForm from "../BroadcastForm";

export default async function NewBroadcastPage() {
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: user?.id },
    select: { id: true, name: true }
  });

  return (
    <div className="p-8">
      <BroadcastForm instances={instances} />
    </div>
  );
}
