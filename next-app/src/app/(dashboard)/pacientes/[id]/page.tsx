"use client";

import { useState, useEffect, use } from "react";
import { client } from "@/lib/neonClient";
import Link from "next/link";
import { ArrowLeft, User, Calendar, Apple } from "lucide-react";
import PatientForm from "@/components/PatientForm";
import ConsultationList from "@/components/ConsultationList";
import ConsultationModal from "@/components/ConsultationModal";
import MealPlanGenerator from "@/components/MealPlanGenerator";
import WeightChart from "@/components/WeightChart";

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dados"); // 'dados', 'consultas', 'planos'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<any>(null);

  const fetchPatient = async () => {
    try {
      const { data, error } = await client
        .from("pacientes")
        .select(`*, consultas(*), planos_alimentares(*)`)
        .eq("id", unwrappedParams.id)
        .single();
        
      if (!error && data) {
        setPatient(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatient();
  }, [unwrappedParams.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Carregando perfil do paciente...</div>;
  }

  if (!patient) {
    return <div className="text-center py-12 text-red-500">Paciente não encontrado.</div>;
  }

  const handleSaveConsultation = async (consultationData: any) => {
    if (consultationData.id) {
      await client.from("consultas").update(consultationData).eq("id", consultationData.id);
    } else {
      await client.from("consultas").insert([{ ...consultationData, paciente_id: patient.id }]);
    }
    fetchPatient(); // Reload data
  };

  const handleDeleteConsultation = async (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta consulta?")) {
      await client.from("consultas").delete().eq("id", id);
      fetchPatient();
    }
  };

  // Ensure descending order (newest first)
  const sortedConsultations = [...(patient.consultas || [])].sort(
    (a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link 
          href="/pacientes"
          className="p-2 bg-white/60 dark:bg-[#141916]/80 hover:bg-white/90 dark:hover:bg-[#1a211d] rounded-full border border-gray-200 dark:border-[#2a342e] shadow-sm transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-700 dark:text-gray-300" />
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{patient.nome}</h1>
      </div>

      <div className="bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm overflow-hidden transition-colors duration-300">
        {/* Tabs */}
        <div className="flex border-b border-white/50 dark:border-[#2a342e] p-2 gap-2 overflow-x-auto bg-white/50 dark:bg-[#1a211d]/50">
          <button
            onClick={() => setActiveTab("dados")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "dados" ? "bg-white dark:bg-[#2a342e] shadow-sm text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-[#1a211d]/50"
            }`}
          >
            <User size={18} />
            Dados do Paciente
          </button>
          <button
            onClick={() => setActiveTab("consultas")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "consultas" ? "bg-white dark:bg-[#2a342e] shadow-sm text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-[#1a211d]/50"
            }`}
          >
            <Calendar size={18} />
            Consultas
          </button>
          <button
            onClick={() => setActiveTab("planos")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap ${
              activeTab === "planos" ? "bg-white dark:bg-[#2a342e] shadow-sm text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:bg-white/50 dark:text-gray-400 dark:hover:bg-[#1a211d]/50"
            }`}
          >
            <Apple size={18} />
            Planos Alimentares
          </button>
        </div>

        <div className="p-6">
          {activeTab === "dados" && (
            <div className="animate-in fade-in">
              <PatientForm initialData={patient} isInline={true} />
            </div>
          )}
          
          {activeTab === "consultas" && (
            <div className="animate-in fade-in">
              <WeightChart consultations={patient.consultas || []} />
              
              <div className="mt-8">
                <ConsultationList
                  consultations={sortedConsultations}
                  onAdd={() => {
                    setEditingConsultation(null);
                    setIsModalOpen(true);
                  }}
                  onEdit={(c) => {
                    setEditingConsultation(c);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteConsultation}
                />
              </div>
            </div>
          )}

          {activeTab === "planos" && (
            <div className="animate-in fade-in">
              <MealPlanGenerator patient={patient} existingPlans={patient.planos_alimentares || []} onPlanSaved={fetchPatient} />
            </div>
          )}
        </div>
      </div>

      <ConsultationModal
        isOpen={isModalOpen}
        initialData={editingConsultation}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveConsultation}
      />
    </div>
  );
}
