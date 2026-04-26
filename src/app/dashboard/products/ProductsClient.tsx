"use client";

import { useState, useEffect } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ExternalLink,
  Tag,
  DollarSign
} from "lucide-react";
import Link from "next/link";
import { DeleteModal } from "@/components/modals/DeleteModal";

export default function ProductsClient() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`/api/products/${deleteId}`, { method: "DELETE" });
      setProducts(products.filter(p => p.id !== deleteId));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Catalogue Produits
          </h1>
          <p className="text-gray-400 mt-1">Gérez vos produits et enrichissez le contexte de votre IA.</p>
        </div>
        <Link 
          href="/dashboard/products/new"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-blue-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau Produit
        </Link>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
        <input
          type="text"
          placeholder="Rechercher un produit ou une catégorie..."
          className="w-full bg-gray-900/50 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all text-gray-200"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-900/50 animate-pulse rounded-3xl border border-gray-800" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/30 rounded-3xl border border-dashed border-gray-800">
          <Package className="w-16 h-16 text-gray-700 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-300">Aucun produit trouvé</h3>
          <p className="text-gray-500 mt-2">Commencez par ajouter votre premier produit au catalogue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="group bg-gray-900/50 border border-gray-800 rounded-3xl overflow-hidden hover:border-gray-700 transition-all hover:shadow-2xl hover:shadow-blue-500/5"
            >
              <div className="relative h-48 bg-gray-800 overflow-hidden">
                {product.images?.[0] ? (
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-700">
                    <Package className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                   <Link 
                    href={`/dashboard/products/${product.id}`}
                    className="p-2 bg-gray-900/80 backdrop-blur-md text-gray-300 hover:text-blue-400 rounded-xl transition-colors shadow-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                  <button 
                    onClick={() => setDeleteId(product.id)}
                    className="p-2 bg-gray-900/80 backdrop-blur-md text-gray-300 hover:text-red-400 rounded-xl transition-colors shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {product.category && (
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-blue-500/20 backdrop-blur-md border border-blue-500/30 text-blue-400 text-xs font-bold rounded-lg uppercase tracking-wider">
                    {product.category}
                  </div>
                )}
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mt-2 leading-relaxed">
                    {product.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-lg">
                    <span>{product.price?.toLocaleString()}</span>
                    <span className="text-sm font-medium">{product.currency}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {product.features?.length || 0} caract.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <DeleteModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer le produit"
        description="Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible et l'IA ne pourra plus l'utiliser comme contexte."
      />
    </div>
  );
}
