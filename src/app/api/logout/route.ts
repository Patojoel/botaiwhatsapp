import { NextRequest, NextResponse } from "next/server";
import { WhatsAppService } from "@/modules/whatsapp/whatsapp.service";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { instanceId } = await req.json();

    if (!instanceId) {
      return NextResponse.json(
        { error: "Missing instanceId" },
        { status: 400 },
      );
    }

    // Vérifier si l'instance appartient bien à l'utilisateur
    const instance = await prisma.botInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await WhatsAppService.logoutInstance(instanceId);

    // Mettre à jour le statut en base de données
    await prisma.botInstance.update({
      where: { id: instanceId },
      data: { status: "DISCONNECTED", phone: null },
    });

    return NextResponse.json({ success: true, message: "Instance déconnectée" });
  } catch (error) {
    console.error("Logout Error:", error);
    return NextResponse.json(
      { error: "Failed to logout instance" },
      { status: 500 },
    );
  }
}
