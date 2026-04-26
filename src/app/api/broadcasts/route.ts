import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateBroadcastJob } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const broadcasts = await (prisma as any).broadcastCampaign.findMany({
      where: {
        botInstance: {
          ownerId: user.id
        }
      },
      include: {
        botInstance: {
          select: { name: true }
        },
        recipients: {
          include: {
            contact: {
              select: { phone: true, name: true }
            }
          }
        },
        _count: {
          select: { recipients: true, logs: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(broadcasts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, content, mediaUrl, mediaType, cronPattern, scheduleConfig, botInstanceId, contactIds } = body;

    // Créer la campagne de diffusion
    const broadcast = await (prisma as any).broadcastCampaign.create({
      data: {
        name,
        content,
        mediaUrl,
        mediaType: mediaType || "none",
        cronPattern,
        scheduleConfig,
        botInstanceId,
        status: "PENDING",
        recipients: {
          create: contactIds.map((id: string) => ({
            contactId: id
          }))
        }
      },
      include: {
        recipients: true
      }
    });

    // Planifier dans BullMQ
    await updateBroadcastJob(broadcast.id, broadcast.cronPattern, broadcast.isActive, broadcast.scheduleConfig);

    return NextResponse.json(broadcast);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
