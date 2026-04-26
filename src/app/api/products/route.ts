import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;

  // Fallback dev
  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    userId = firstUser?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const products = await prisma.product.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  let userId = session?.user?.id;

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    userId = firstUser?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, description, price, currency, category, images, videos, features, benefits, predefinedFaq } = body;

    if (!name || !description) {
      return NextResponse.json({ error: "Name and description are required" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: price ? parseFloat(price) : null,
        currency: currency || "XAF",
        category,
        images: images || [],
        videos: videos || [],
        features: features || [],
        benefits: benefits || [],
        predefinedFaq: predefinedFaq || [],
        ownerId: userId,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
