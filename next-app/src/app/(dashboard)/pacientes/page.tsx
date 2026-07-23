"use client";

import { useState, useEffect } from "react";
import { client } from "@/lib/neonClient";
import Link from "next/link";
import { Search, Plus } from "lucide-react";

export default function PacientesPage() {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchPatients() {
      try {
        const { data, error } = await client.from("pacientes").select("*").order("nome", { ascending: true });
        if (!error && data) {
          setPatients(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(
    (p) => p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pacientes</h1>
        <Link 
          href="/pacientes/novo"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#10b981] dark:hover:bg-[#059669] text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Plus size={20} />
          Novo Paciente
        </Link>
      </div>

      <div className="bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md rounded-2xl p-6 border border-white/50 dark:border-[#2a342e] shadow-sm space-y-6 transition-colors duration-300">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl focus:ring-blue-500 dark:focus:ring-[#10b981] focus:border-blue-500 dark:focus:border-[#10b981] dark:text-white transition-colors shadow-sm"
            placeholder="Buscar paciente por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List */}
        {loading ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Carregando pacientes...</p>
        ) : filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg">Nenhum paciente encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredPatients.map((patient) => (
              <Link
                key={patient.id}
                href={`/pacientes/${patient.id}`}
                className="flex items-center justify-between p-4 bg-white/60 dark:bg-[#1a211d]/80 rounded-xl hover:bg-white/90 dark:hover:bg-[#1a211d] border border-white/50 dark:border-[#2a342e] shadow-sm transition-all group"
              >
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{patient.nome}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {patient.email && <span>{patient.email}</span>}
                    {patient.telefone && <span>{patient.telefone}</span>}
                  </div>
                </div>
                <span className="text-blue-600 dark:text-[#10b981] font-medium group-hover:translate-x-1 transition-transform">
                  Visualizar &rarr;
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
