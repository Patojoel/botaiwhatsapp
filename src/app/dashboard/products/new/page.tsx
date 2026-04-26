import ProductForm from "@/components/ProductForm";
import { ChevronLeft, PackagePlus } from "lucide-react";
import Link from "next/link";

export default function NewProductPage() {
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
            <h1 className="text-2xl font-bold text-gray-100">Ajouter un produit</h1>
            <p className="text-gray-500 text-sm">Configurez les détails pour votre catalogue intelligent.</p>
          </div>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
          <PackagePlus className="w-6 h-6 text-blue-400" />
        </div>
      </div>

      <ProductForm />
    </div>
  );
}
