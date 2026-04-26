import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    userId = firstUser?.id;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const prompts = await prisma.systemPrompt.findMany({
      where: { ownerId: userId },
      include: { products: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(prompts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    userId = firstUser?.id;
  }

  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { name, content, rules, restrictToProducts, productIds } = body;

    if (!name || !content) {
      return NextResponse.json({ error: "Name and content are required" }, { status: 400 });
    }

    const prompt = await prisma.systemPrompt.create({
      data: {
        name,
        content,
        rules: rules || [],
        restrictToProducts: restrictToProducts ?? true,
        ownerId: userId,
        products: {
          connect: productIds?.map((id: string) => ({ id })) || [],
        },
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Prompt creation error:", error);
    return NextResponse.json({ error: "Failed to create prompt" }, { status: 500 });
  }
}
