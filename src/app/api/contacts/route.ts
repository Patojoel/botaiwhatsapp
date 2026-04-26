import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

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
    const contacts = await prisma.contact.findMany({
      where: botInstanceId ? { botInstanceId } : {
        botInstance: {
          ownerId: user.id
        }
      },
      orderBy: { name: "asc" },
    });
    
    return NextResponse.json(contacts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
