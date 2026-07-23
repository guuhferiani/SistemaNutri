"use client";

import { useState, useEffect } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { client } from "@/lib/neonClient";
import Link from "next/link";

export default function DashboardPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    // In a real app we'd get the session here and load patients
    // For now we simulate the load
    async function loadData() {
      try {
        const { data, error } = await client.from("pacientes").select("*");
        if (!error && data) {
          setPatients(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getPatientsWithoutReturn = () => {
    return patients.filter((patient) => {
      const consultations = patient.consultas || [];
      if (consultations.length === 0) return false;
      const latest = [...consultations].sort(
        (a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
      )[0];
      if (latest.proximo_retorno) return false;
      const diffTime = Math.abs(new Date().getTime() - new Date(latest.data_consulta).getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 30;
    });
  };

  const patientsWithoutReturn = getPatientsWithoutReturn();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <header className="bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md rounded-2xl p-8 border border-white/50 dark:border-[#2a342e] shadow-sm flex flex-col justify-center transition-colors duration-300">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá, {loading ? "Carregando..." : profile?.nome || "Nutricionista"}!
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-300 ml-11 text-lg">
          Acompanhe o status e agendamentos de seus pacientes em tempo real.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md p-6 rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Total de Pacientes</h3>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{patients.length}</p>
          <span className="text-sm text-gray-500 dark:text-gray-400">Pacientes cadastrados</span>
        </div>
        <div className="bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md p-6 rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm transition-colors duration-300">
          <h3 className="text-gray-500 dark:text-gray-400 font-medium mb-1">Sem Retorno Agendado</h3>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{patientsWithoutReturn.length}</p>
          <span className="text-sm text-gray-500 dark:text-gray-400">Atenção necessária</span>
        </div>
      </section>

      <section className="bg-red-50/50 dark:bg-red-900/10 backdrop-blur-md p-6 rounded-2xl border border-red-100 dark:border-red-900/30 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={24} className="text-red-500" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pacientes sem retorno</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6 ml-8">
          Lista de pacientes cuja última consulta foi há mais de 30 dias e não possuem retorno agendado.
        </p>

        {loading ? (
          <p className="text-gray-500 text-center py-4">Buscando dados no Supabase...</p>
        ) : patientsWithoutReturn.length > 0 ? (
          <div className="grid gap-3">
            {patientsWithoutReturn.map((patient) => {
              const latest = [...(patient.consultas || [])].sort(
                (a, b) => new Date(b.data_consulta).getTime() - new Date(a.data_consulta).getTime()
              )[0];

              return (
                <Link
                  key={patient.id}
                  href={`/pacientes/${patient.id}`}
                  className="flex items-center justify-between p-4 bg-white/60 dark:bg-[#1a211d]/80 rounded-xl hover:bg-white/80 dark:hover:bg-[#1a211d] transition-colors border border-white/50 dark:border-[#2a342e] shadow-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{patient.nome}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Última consulta: {latest.data_consulta}
                    </p>
                  </div>
                  <span className="text-blue-600 dark:text-[#10b981] font-medium hover:underline">Ver Perfil &rarr;</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/40 dark:bg-[#141916]/80 rounded-xl p-8 text-center border border-white/50 dark:border-[#2a342e] transition-colors duration-300">
            <p className="text-gray-500 dark:text-gray-400">Nenhum paciente sem retorno no momento</p>
          </div>
        )}
      </section>
    </div>
  );
}
