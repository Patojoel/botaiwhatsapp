import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const prompt = await prisma.systemPrompt.findUnique({
      where: { id },
      include: { products: true },
    });
    if (!prompt) return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    return NextResponse.json(prompt);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch prompt" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, content, rules, restrictToProducts, productIds } = body;

    const prompt = await prisma.systemPrompt.update({
      where: { id },
      data: {
        name,
        content,
        rules,
        restrictToProducts,
        products: productIds ? {
          set: productIds.map((pid: string) => ({ id: pid })),
        } : undefined,
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("Prompt update error:", error);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.systemPrompt.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete prompt" }, { status: 500 });
  }
}
