import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateBroadcastJob } from "@/lib/queue";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const broadcast = await (prisma as any).broadcastCampaign.findUnique({
      where: { id },
      include: {
        recipients: true,
        logs: { orderBy: { sentAt: "desc" } }
      }
    });
    return NextResponse.json(broadcast);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, content, mediaUrl, mediaType, cronPattern, scheduleConfig, botInstanceId, contactIds, isActive } = body;

    const data: any = {};
    if (name !== undefined) data.name = name;
    if (content !== undefined) data.content = content;
    if (mediaUrl !== undefined) data.mediaUrl = mediaUrl;
    if (mediaType !== undefined) data.mediaType = mediaType;
    if (cronPattern !== undefined) data.cronPattern = cronPattern;
    if (scheduleConfig !== undefined) data.scheduleConfig = scheduleConfig;
    if (botInstanceId !== undefined) data.botInstanceId = botInstanceId;
    if (isActive !== undefined) data.isActive = isActive;

    const broadcast = await (prisma as any).broadcastCampaign.update({
      where: { id },
      data: {
        ...data,
        ...(contactIds ? {
          recipients: {
            deleteMany: {},
            create: contactIds.map((id: string) => ({ contactId: id }))
          }
        } : {})
      }
    });

    // Mettre à jour la planification
    await updateBroadcastJob(broadcast.id, broadcast.cronPattern, broadcast.isActive, broadcast.scheduleConfig);

    return NextResponse.json(broadcast);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Annuler la planification
    await updateBroadcastJob(id, null, false);
    
    await (prisma as any).broadcastCampaign.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
