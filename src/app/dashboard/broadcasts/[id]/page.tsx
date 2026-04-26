import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import BroadcastForm from "../BroadcastForm";
import { notFound } from "next/navigation";

export default async function EditBroadcastPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  const broadcast = await (prisma as any).broadcastCampaign.findUnique({
    where: { id },
    include: {
      recipients: true
    }
  });

  if (!broadcast) notFound();

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: user?.id },
    select: { id: true, name: true }
  });

  return (
    <div className="p-8">
      <BroadcastForm instances={instances} initialData={broadcast} />
    </div>
  );
}
