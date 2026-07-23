import PatientForm from "@/components/PatientForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NovoPacientePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link 
          href="/pacientes"
          className="p-2 bg-white/60 dark:bg-[#141916]/80 hover:bg-white/90 dark:hover:bg-[#1a211d] rounded-full border border-gray-200 dark:border-[#2a342e] shadow-sm transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Novo Paciente</h1>
      </div>
      
      <p className="text-gray-600 dark:text-gray-400 ml-14">
        Preencha as informações abaixo para cadastrar um novo paciente no sistema.
      </p>

      <div className="mt-8">
        <PatientForm />
      </div>
    </div>
  );
}
