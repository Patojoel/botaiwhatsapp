"use client";

import { useState } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Info,
  DollarSign,
  HelpCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ProductFormProps {
  initialData?: any;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    currency: initialData?.currency || "XAF",
    category: initialData?.category || "",
    images: initialData?.images || [],
    videos: initialData?.videos || [],
    features: initialData?.features || [],
    benefits: initialData?.benefits || [],
    predefinedFaq: initialData?.predefinedFaq || [],
  });

  const [newFeature, setNewFeature] = useState("");
  const [newBenefit, setNewBenefit] = useState("");
  const [newFaq, setNewFaq] = useState({ q: "", a: "" });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) newImages.push(data.url);
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
    setIsUploading(false);
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newVideos: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Limite 50MB pour les vidéos
      if (file.size > 50 * 1024 * 1024) {
        alert("La vidéo est trop lourde (max 50Mo)");
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.url) newVideos.push(data.url);
      } catch (err) {
        console.error("Video upload failed", err);
      }
    }

    setFormData(prev => ({
      ...prev,
      videos: [...prev.videos, ...newVideos]
    }));
    setIsUploading(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.description) {
      alert("Veuillez remplir les champs obligatoires (Nom et Description)");
      return;
    }

    setLoading(true);
    try {
      const url = initialData?.id ? `/api/products/${initialData.id}` : "/api/products";
      const method = initialData?.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/dashboard/products");
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Erreur lors de la sauvegarde");
      }
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  const addItem = (field: string, value: any) => {
    if (!value) return;
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev] as any[], value]
    }));
  };

  const removeItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as any[]).filter((_, i) => i !== index)
    }));
  };

  const steps = [
    { id: 1, name: "Infos de base", icon: Info },
    { id: 2, name: "Médias", icon: ImageIcon },
    { id: 3, name: "Détails & FAQ", icon: CheckCircle2 },
  ];

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-3xl overflow-hidden backdrop-blur-xl">
      {/* Progress Header */}
      <div className="flex border-b border-gray-800">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`flex-1 flex items-center justify-center gap-3 py-5 transition-all relative ${
              activeStep === step.id ? "text-blue-400 bg-blue-500/5" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <step.icon className={`w-5 h-5 ${activeStep === step.id ? "animate-pulse" : ""}`} />
            <span className="font-medium hidden md:inline">{step.name}</span>
            {activeStep === step.id && (
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent" />
            )}
          </button>
        ))}
      </div>

      <div className="p-8 space-y-8">
        {/* STEP 1: BASIC INFO */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Nom du produit *</label>
                <input
                  type="text"
                  placeholder="Ex: Formation Trading Pro"
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Catégorie</label>
                <input
                  type="text"
                  placeholder="Ex: Électronique, Service..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Prix</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="number"
                    placeholder="0.00"
                    className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 pl-11 pr-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400 ml-1">Devise</label>
                <input
                  type="text"
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                  value={formData.currency}
                  onChange={e => setFormData({ ...formData, currency: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 ml-1">Description détaillée *</label>
              <textarea
                rows={5}
                placeholder="Décrivez votre produit précisément. L'IA utilisera ce texte pour répondre."
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
        )}

        {/* STEP 2: MEDIAS */}
        {activeStep === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-400" />
                Images du produit
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                   <label className="block w-full cursor-pointer group">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-800 rounded-3xl group-hover:border-blue-500/50 group-hover:bg-blue-500/5 transition-all">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
                      ) : (
                        <>
                          <Plus className="w-8 h-8 text-gray-500 group-hover:text-blue-400 mb-2" />
                          <p className="text-sm text-gray-500 group-hover:text-blue-300">Cliquer pour uploader (PNG, JPG)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageUpload} />
                  </label>
                  <p className="text-[10px] text-gray-600 uppercase font-bold tracking-widest text-center">OU AJOUTER PAR URL</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="https://..."
                      className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl py-3 px-4 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                      value={newImageUrl}
                      onChange={e => setNewImageUrl(e.target.value)}
                    />
                    <button
                      onClick={() => { if(newImageUrl) { addItem("images", newImageUrl); setNewImageUrl(""); } }}
                      className="bg-gray-800 hover:bg-gray-700 text-white p-3 rounded-2xl transition-all"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-950/50 border border-gray-800 rounded-3xl p-4 min-h-[130px]">
                   <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest flex items-center gap-2">
                     Prévisualisation ({formData.images.length})
                   </p>
                   <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((url: string, i: number) => (
                      <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-800 bg-gray-950">
                        <img src={url} className="w-full h-full object-cover" alt="" />
                        <button
                          onClick={() => removeItem("images", i)}
                          className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length === 0 && (
                      <div className="col-span-3 h-20 flex items-center justify-center text-gray-700 text-xs italic">
                        Aucune image sélectionnée
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <label className="block w-full cursor-pointer group">
                    <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-800 rounded-3xl group-hover:border-purple-500/50 group-hover:bg-purple-500/5 transition-all">
                      {isUploading ? (
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                      ) : (
                        <>
                          <Video className="w-8 h-8 text-gray-500 group-hover:text-purple-400 mb-2" />
                          <p className="text-sm text-gray-500 group-hover:text-purple-300">Uploader une vidéo (MP4, MKV)</p>
                        </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="video/*" multiple onChange={handleVideoUpload} />
                  </label>
                </div>

                <div className="bg-gray-950/50 border border-gray-800 rounded-3xl p-4 min-h-[130px]">
                  <p className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
                    Vidéos ajoutées ({formData.videos.length})
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {formData.videos.map((url: string, i: number) => (
                      <div key={i} className="relative group aspect-video rounded-xl overflow-hidden border border-gray-800 bg-gray-950 flex items-center justify-center">
                        <Video className="w-8 h-8 text-purple-500/50" />
                        <button
                          onClick={() => removeItem("videos", i)}
                          className="absolute inset-0 flex items-center justify-center bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
          </div>
        )}

        {/* STEP 3: DETAILS & FAQ */}
        {activeStep === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Features & Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-300">Caractéristiques</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter une caractéristique..."
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 outline-none focus:border-blue-500"
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (addItem("features", newFeature), setNewFeature(""))}
                  />
                  <button onClick={() => { addItem("features", newFeature); setNewFeature(""); }} className="p-2 bg-gray-800 rounded-xl hover:bg-gray-700 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features.map((f: string, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-blue-500/5 border border-blue-500/20 rounded-xl p-3">
                      <span className="text-sm text-gray-300">{f}</span>
                      <button onClick={() => removeItem("features", i)} className="text-gray-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-gray-300">Bénéfices Clients</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ajouter un bénéfice..."
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl py-2 px-4 outline-none focus:border-emerald-500"
                    value={newBenefit}
                    onChange={e => setNewBenefit(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (addItem("benefits", newBenefit), setNewBenefit(""))}
                  />
                  <button onClick={() => { addItem("benefits", newBenefit); setNewBenefit(""); }} className="p-2 bg-gray-800 rounded-xl hover:bg-emerald-900/30 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.benefits.map((b: string, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                      <span className="text-sm text-gray-300">{b}</span>
                      <button onClick={() => removeItem("benefits", i)} className="text-gray-500 hover:text-red-400">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ */}
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-orange-400" />
                Questions Fréquentes (FAQ)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Question"
                  className="bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 outline-none focus:border-orange-500"
                  value={newFaq.q}
                  onChange={e => setNewFaq({ ...newFaq, q: e.target.value })}
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Réponse"
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-xl py-3 px-4 outline-none focus:border-orange-500"
                    value={newFaq.a}
                    onChange={e => setNewFaq({ ...newFaq, a: e.target.value })}
                  />
                  <button onClick={() => { addItem("predefinedFaq", newFaq); setNewFaq({ q: "", a: "" }); }} className="bg-orange-600 hover:bg-orange-500 p-3 rounded-xl transition-all">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <div className="space-y-3 mt-4">
                {formData.predefinedFaq.map((faq: any, i: number) => (
                  <div key={i} className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-2 group relative">
                    <p className="font-medium text-orange-400">Q: {faq.q}</p>
                    <p className="text-sm text-gray-400 italic">R: {faq.a}</p>
                    <button
                      onClick={() => removeItem("predefinedFaq", i)}
                      className="absolute top-4 right-4 p-1 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-800">
          <button
            onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
            disabled={activeStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeStep === 1 ? "opacity-0 pointer-events-none" : "bg-gray-800 hover:bg-gray-700 text-gray-300"
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Précédent
          </button>

          {activeStep < 3 ? (
            <button
              onClick={() => setActiveStep(prev => Math.min(3, prev + 1))}
              className="flex items-center gap-2 bg-gray-100 hover:bg-white text-gray-900 px-8 py-3 rounded-xl font-bold transition-all active:scale-95"
            >
              Suivant
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-10 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
            >
              {loading ? "Sauvegarde..." : initialData?.id ? "Mettre à jour" : "Enregistrer le produit"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
