import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import StatusManagerClient from "./StatusManagerClient";

export default async function StatusManagerPage() {
  const session = await auth();
  let user: any = session?.user;

  if (!user) {
    user = await prisma.user.findFirst();
    if (!user) redirect("/login");
  }

  const instances = await prisma.botInstance.findMany({
    where: { ownerId: user.id },
  });

  return (
    <div className="p-8">
      <StatusManagerClient instances={instances as any} />
    </div>
  );
}
