import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateBotStatusSchedule } from "@/lib/queue";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  /*
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  */

  const { id: instanceId } = await params;
  if (!instanceId) {
    return NextResponse.json(
      { error: "Instance ID is required" },
      { status: 400 },
    );
  }

  try {
    const body = await req.json();
    const { systemPrompt, statusMediaUrl, statusMediaType } = body;

    // Vérifier si l'instance appartient à l'utilisateur
    const instance = await prisma.botInstance.findUnique({
      where: { id: instanceId },
    });

    if (!instance || instance.ownerId !== session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const updateData: any = {};
    if (systemPrompt !== undefined) updateData.systemPrompt = systemPrompt;
    if (statusMediaUrl !== undefined) updateData.statusMediaUrl = statusMediaUrl;
    if (statusMediaType !== undefined) updateData.statusMediaType = statusMediaType;
    if (statusSchedule !== undefined) updateData.statusSchedule = statusSchedule;

    // Si on a un nouveau prompt, on sauvegarde l'historique
    if (systemPrompt) {
      if (instance.systemPrompt !== systemPrompt) {
        await (prisma as any).promptHistory.create({
          data: {
            botInstanceId: instanceId,
            prompt: instance.systemPrompt,
          },
        });
      }
    }

    const updated = await prisma.botInstance.update({
      where: { id: instanceId },
      data: updateData,
    });

    // Si le calendrier a changé, on met à jour BullMQ
    if (statusSchedule !== undefined) {
      await updateBotStatusSchedule(instanceId, statusSchedule);
    }

    return NextResponse.json({ success: true, instance: updated });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du prompt:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
