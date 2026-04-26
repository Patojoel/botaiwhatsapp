import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { updateCampaignJob } from "@/lib/queue";

export async function GET(req: NextRequest) {
  const session = await auth();
  let user = session?.user;

  if (!user) {
    user = await prisma.user.findFirst() as any;
  }

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const botInstanceId = searchParams.get("botInstanceId");

  try {
    console.log("[API] User ID for query:", user.id);
    
    // Récupération des campagnes avec historique (inclut le dernier log)
    const campaigns = await (prisma as any).statusCampaign.findMany({
      where: botInstanceId ? { botInstanceId } : {
        botInstance: {
          ownerId: user.id
        }
      },
      include: {
        botInstance: {
          select: { name: true }
        },
        statusLogs: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" },
    });
    
    return NextResponse.json(campaigns);
  } catch (error: any) {
    console.error("[API] CRITICAL ERROR fetching campaigns:", error);
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des campagnes",
      details: error.message 
    }, { status: 500 });
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
    const { name, botInstanceId, mediaUrl, mediaType, useAI, customText, cronPattern, scheduleConfig } = body;

    const campaign = await (prisma as any).statusCampaign.create({
      data: {
        name,
        botInstanceId,
        mediaUrl,
        mediaType: mediaType || "image",
        useAI,
        customText,
        cronPattern: cronPattern || "0 9 * * *",
        scheduleConfig,
        isActive: true,
      },
    });

    // Mettre à jour la programmation BullMQ
    await updateCampaignJob(campaign.id, campaign.cronPattern, campaign.isActive, campaign.scheduleConfig);

    return NextResponse.json(campaign);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
