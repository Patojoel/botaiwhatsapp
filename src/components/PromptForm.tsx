"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  BrainCircuit,
  Package,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface PromptFormProps {
  initialData?: any;
}

export default function PromptForm({ initialData }: PromptFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    content: initialData?.content || "",
    rules: initialData?.rules || [],
    restrictToProducts: initialData?.restrictToProducts ?? true,
    productIds: initialData?.products?.map((p: any) => p.id) || [],
  });

  const [newRule, setNewRule] = useState("");

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
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.content) {
      alert("Nom et contenu sont obligatoires");
      return;
    }

    setLoading(true);
    try {
      const url = initialData?.id ? `/api/prompts/${initialData.id}` : "/api/prompts";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/prompts");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setFormData(prev => ({
      ...prev,
      productIds: prev.productIds.includes(id)
        ? prev.productIds.filter((pid: string) => pid !== id)
        : [...prev.productIds, id]
    }));
  };

  const addRule = () => {
    if (!newRule) return;
    setFormData({ ...formData, rules: [...formData.rules, newRule] });
    setNewRule("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-8 space-y-6 backdrop-blur-xl">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1">Nom du contexte</label>
            <input
              type="text"
              placeholder="Ex: Expert Vente Formations"
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400 ml-1 flex justify-between items-center">
              Prompt Système (Le Persona)
              <span className="text-[10px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded border border-purple-500/20 uppercase tracking-tighter font-bold">IA Brain</span>
            </label>
            <textarea
              rows={8}
              placeholder="Décrivez comment l'IA doit se comporter..."
              className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all resize-none leading-relaxed text-gray-200"
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800">
            <label className="text-sm font-medium text-gray-400 ml-1 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              Règles de comportement strictes
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ex: Ne jamais donner le numéro perso du patron"
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 outline-none focus:border-purple-500"
                value={newRule}
                onChange={e => setNewRule(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addRule()}
              />
              <button onClick={addRule} className="p-2 bg-gray-800 rounded-xl hover:bg-purple-900/30 transition-colors">
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {formData.rules.map((rule: string, i: number) => (
                <div key={i} className="flex items-center justify-between bg-purple-500/5 border border-purple-500/20 rounded-xl p-3 group">
                  <span className="text-sm text-gray-300">{rule}</span>
                  <button 
                    onClick={() => setFormData({ ...formData, rules: formData.rules.filter((_: any, idx: number) => idx !== i) })}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-orange-500/5 border border-orange-500/10 rounded-2xl p-4 flex gap-4 items-start">
          <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-1" />
          <p className="text-xs text-gray-400 leading-relaxed">
            <strong className="text-orange-400">Conseil :</strong> Plus vos règles sont précises, moins l'IA aura tendance à inventer des informations (hallucinations). Utilisez des phrases courtes et impératives.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-gray-900/40 border border-gray-800 rounded-3xl p-6 backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              Produits liés
            </h3>
            <span className="text-[10px] text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{formData.productIds.length}</span>
          </div>

          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {products.length === 0 ? (
              <p className="text-xs text-gray-500 italic text-center py-4">Aucun produit dans le catalogue.</p>
            ) : (
              products.map(product => (
                <button
                  key={product.id}
                  onClick={() => toggleProduct(product.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    formData.productIds.includes(product.id)
                      ? "bg-blue-500/10 border-blue-500/40 text-blue-100"
                      : "bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-4 h-4" />
                      )}
                    </div>
                    <span className="text-xs font-medium truncate max-w-[120px]">{product.name}</span>
                  </div>
                  {formData.productIds.includes(product.id) && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                </button>
              ))
            )}
          </div>

          <div className="pt-4 border-t border-gray-800">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.restrictToProducts}
                  onChange={e => setFormData({ ...formData, restrictToProducts: e.target.checked })}
                />
                <div className="w-10 h-6 bg-gray-800 rounded-full peer peer-checked:bg-purple-600 transition-all after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </div>
              <span className="text-xs font-medium text-gray-400 group-hover:text-gray-200 transition-colors">Restreindre strictement aux produits liés</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white py-4 rounded-3xl font-bold transition-all shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
        >
          {loading ? "Sauvegarde..." : initialData?.id ? "Mettre à jour" : "Créer le contexte"}
        </button>
      </div>
    </div>
  );
}
