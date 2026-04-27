import ProductForm from "@/components/ProductForm";
import VideoPromoGenerator from "@/components/VideoPromoGenerator";
import { ChevronLeft, Edit3 } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  const botInstances = await prisma.botInstance.findMany({
    select: { id: true, name: true }
  });

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/products"
            className="p-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Modifier le produit</h1>
            <p className="text-gray-500 text-sm">Mettez à jour les informations du produit : {product.name}</p>
          </div>
        </div>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
          <Edit3 className="w-6 h-6 text-amber-400" />
        </div>
      </div>

      <VideoPromoGenerator productId={id} botInstances={botInstances} />

      <ProductForm initialData={product} />
    </div>
  );
}
