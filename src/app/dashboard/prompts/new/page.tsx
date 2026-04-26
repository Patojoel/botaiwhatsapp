import PromptForm from "@/components/PromptForm";
import { ChevronLeft, BrainCircuit } from "lucide-react";
import Link from "next/link";

export default function NewPromptPage() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/prompts"
            className="p-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-100">Nouveau Contexte IA</h1>
            <p className="text-gray-500 text-sm">Définissez comment votre assistant doit interagir avec vos clients.</p>
          </div>
        </div>
        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl">
          <BrainCircuit className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      <PromptForm />
    </div>
  );
}
