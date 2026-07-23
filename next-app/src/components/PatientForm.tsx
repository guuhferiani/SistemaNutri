"use client";

import { useState } from "react";
import { client } from "@/lib/neonClient";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

const formatPhone = (value: string) => {
  if (!value) return "";
  value = value.replace(/\D/g, "");
  if (value.length > 11) value = value.slice(0, 11);
  if (value.length > 2) {
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  }
  if (value.length > 9) {
    value = `${value.slice(0, 10)}-${value.slice(10)}`;
  }
  return value;
};

const formatTimeOnBlur = (value: string) => {
  if (!value) return "";
  let digits = value.replace(/\D/g, "");
  if (digits.length === 0) return "";
  if (digits.length === 1) digits = `0${digits}00`;
  else if (digits.length === 2) digits = `${digits}00`;
  else if (digits.length === 3) digits = `0${digits[0]}${digits.slice(1)}`;
  else if (digits.length > 4) digits = digits.slice(0, 4);
  let h = parseInt(digits.slice(0, 2));
  let m = parseInt(digits.slice(2));
  if (h > 23) h = 23;
  if (m > 59) m = 59;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export default function PatientForm({ initialData = null, isInline = false }: { initialData?: any, isInline?: boolean }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("pessoal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    email: initialData?.email || "",
    whatsapp: initialData?.whatsapp || "",
    peso_inicial: initialData?.peso_inicial || "",
    altura: initialData?.altura ? initialData.altura * 100 : "",
    objetivo_texto: initialData?.objetivo_texto || "",
    observacoes: initialData?.observacoes || "",
    rotina: initialData?.rotina || "",
    restricoes_alimentares: initialData?.restricoes_alimentares || "",
    agua_diaria: initialData?.agua_diaria || "",
    sono: initialData?.sono || "",
    nivel_atividade_fisica: initialData?.nivel_atividade_fisica || "",
    patologias: initialData?.patologias || "",
    alergias_alimentares: initialData?.alergias_alimentares || "",
    medicamentos_continuos: initialData?.medicamentos_continuos || "",
    suplementos: initialData?.suplementos || "",
    objetivo_selecao: initialData?.objetivo_selecao || "",
    refeicoes_dia: initialData?.refeicoes_dia || "",
    horario_acorda: initialData?.horario_acorda || "",
    horario_dorme: initialData?.horario_dorme || "",
    pratica_atividade_fisica: initialData?.pratica_atividade_fisica || "Não",
    atividade_fisica_texto: initialData?.atividade_fisica_texto || "",
  });

  const calculateIMC = () => {
    if (!formData.peso_inicial || !formData.altura) return "";
    const peso = parseFloat(formData.peso_inicial as string);
    const alturaM = parseFloat(formData.altura as string) / 100;
    if (alturaM > 0) return (peso / (alturaM * alturaM)).toFixed(2);
    return "";
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) {
      setError("O nome é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const payload = {
        nome: formData.nome,
        email: formData.email,
        whatsapp: formData.whatsapp,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial as string) : null,
        altura: formData.altura ? parseFloat(formData.altura as string) / 100 : null,
        objetivo_texto: formData.objetivo_texto,
        observacoes: formData.observacoes,
        rotina: formData.rotina,
        restricoes_alimentares: formData.restricoes_alimentares,
        agua_diaria: formData.agua_diaria,
        sono: formData.sono,
        nivel_atividade_fisica: formData.nivel_atividade_fisica,
        patologias: formData.patologias,
        alergias_alimentares: formData.alergias_alimentares,
        medicamentos_continuos: formData.medicamentos_continuos,
        suplementos: formData.suplementos,
        objetivo_selecao: formData.objetivo_selecao,
        refeicoes_dia: formData.refeicoes_dia ? parseInt(formData.refeicoes_dia as string) : null,
        horario_acorda: formData.horario_acorda,
        horario_dorme: formData.horario_dorme,
        pratica_atividade_fisica: formData.pratica_atividade_fisica,
        atividade_fisica_texto: formData.atividade_fisica_texto,
      };

      if (initialData?.id) {
        await client.from("pacientes").update(payload).eq("id", initialData.id);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        if (!isInline) router.push(`/pacientes/${initialData.id}`);
      } else {
        const { data } = await client.from("pacientes").insert([payload]).select();
        if (data && data[0]) {
          router.push(`/pacientes/${data[0].id}`);
        }
      }
    } catch (err: any) {
      setError(err.message || "Erro ao salvar paciente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`bg-white/40 dark:bg-[#141916]/80 backdrop-blur-md rounded-2xl transition-colors duration-300 ${isInline ? 'p-0' : 'p-8 border border-white/50 dark:border-[#2a342e] shadow-sm max-w-3xl mx-auto'}`}>
      <div className="flex space-x-2 border-b border-gray-200 dark:border-[#2a342e] mb-6 flex-wrap gap-y-2">
        <button
          type="button"
          onClick={() => setActiveTab("pessoal")}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "pessoal" ? "border-b-2 border-blue-600 dark:border-[#10b981] text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Dados Pessoais
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("clinico")}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "clinico" ? "border-b-2 border-blue-600 dark:border-[#10b981] text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Clínico & Físico
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("habitos")}
          className={`pb-2 px-4 font-medium transition-colors ${
            activeTab === "habitos" ? "border-b-2 border-blue-600 dark:border-[#10b981] text-blue-600 dark:text-[#10b981]" : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          Hábitos
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm">{error}</div>}
        {success && (
          <div className="bg-green-50 text-green-700 p-3 rounded-xl text-sm flex items-center gap-2">
            <Check size={16} /> Dados salvos com sucesso!
          </div>
        )}

        {activeTab === "pessoal" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">WhatsApp</label>
              <input
                type="text"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: formatPhone(e.target.value) })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
        )}

        {activeTab === "clinico" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Peso Atual (kg)</label>
              <input
                type="number"
                step="0.1"
                value={formData.peso_inicial}
                onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Altura (cm)</label>
              <input
                type="number"
                value={formData.altura}
                onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IMC</label>
              <input
                type="text"
                readOnly
                value={calculateIMC()}
                className="w-full bg-gray-100 dark:bg-[#141916] border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 text-gray-500 dark:text-gray-400 cursor-not-allowed transition-colors"
              />
            </div>

            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Objetivo Principal</label>
                <select
                  value={formData.objetivo_selecao}
                  onChange={(e) => setFormData({ ...formData, objetivo_selecao: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="Emagrecer">Emagrecer</option>
                  <option value="Ganhar massa">Ganhar massa</option>
                  <option value="Controlar diabetes">Controlar diabetes</option>
                  <option value="Saúde geral">Saúde geral</option>
                  <option value="Performance esportiva">Performance esportiva</option>
                  <option value="Reeducação alimentar">Reeducação alimentar</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nível de Atividade Física</label>
                <select
                  value={formData.nivel_atividade_fisica}
                  onChange={(e) => setFormData({ ...formData, nivel_atividade_fisica: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                >
                  <option value="">Selecione...</option>
                  <option value="Sedentário">Sedentário</option>
                  <option value="Levemente ativo">Levemente ativo</option>
                  <option value="Moderadamente ativo">Moderadamente ativo</option>
                  <option value="Muito ativo">Muito ativo</option>
                  <option value="Extremamente ativo">Extremamente ativo</option>
                </select>
              </div>
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Detalhes Adicionais do Objetivo</label>
              <textarea
                rows={2}
                value={formData.objetivo_texto}
                onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>

            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Patologias ou Condições</label>
                <textarea
                  rows={2}
                  value={formData.patologias}
                  onChange={(e) => setFormData({ ...formData, patologias: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                  placeholder="Ex: Diabetes, Hipertensão, Nenhum..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alergias Alimentares</label>
                <textarea
                  rows={2}
                  value={formData.alergias_alimentares}
                  onChange={(e) => setFormData({ ...formData, alergias_alimentares: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                  placeholder="Ex: Amendoim, Leite, Nenhum..."
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Medicamentos Contínuos</label>
                <textarea
                  rows={2}
                  value={formData.medicamentos_continuos}
                  onChange={(e) => setFormData({ ...formData, medicamentos_continuos: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                  placeholder="Liste medicamentos se houver"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Suplementos em Uso</label>
                <textarea
                  rows={2}
                  value={formData.suplementos}
                  onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                  placeholder="Whey, Creatina, etc..."
                />
              </div>
            </div>

            <div className="col-span-1 md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações Clínicas Gerais</label>
              <textarea
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === "habitos" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantas refeições faz por dia?</label>
              <input
                type="number"
                value={formData.refeicoes_dia}
                onChange={(e) => setFormData({ ...formData, refeicoes_dia: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quantidade de água por dia</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  value={formData.agua_diaria}
                  onChange={(e) => setFormData({ ...formData, agua_diaria: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 pr-12 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                />
                <span className="absolute right-4 top-2 text-gray-500 dark:text-gray-400">litros</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário que acorda</label>
              <input
                type="text"
                value={formData.horario_acorda}
                onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, horario_acorda: formatTimeOnBlur(e.target.value) })}
                placeholder="Ex: 06:00"
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horário que dorme</label>
              <input
                type="text"
                value={formData.horario_dorme}
                onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                onBlur={(e) => setFormData({ ...formData, horario_dorme: formatTimeOnBlur(e.target.value) })}
                placeholder="Ex: 23:00"
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pratica atividade física?</label>
                <select
                  value={formData.pratica_atividade_fisica}
                  onChange={(e) => setFormData({ ...formData, pratica_atividade_fisica: e.target.value })}
                  className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>
              {formData.pratica_atividade_fisica === "Sim" && (
                <div className="animate-in fade-in">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Qual atividade e frequência?</label>
                  <input
                    type="text"
                    value={formData.atividade_fisica_texto}
                    onChange={(e) => setFormData({ ...formData, atividade_fisica_texto: e.target.value })}
                    className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
                    placeholder="Ex: Musculação 3x na semana"
                  />
                </div>
              )}
            </div>
            <div className="col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Observações gerais sobre a rotina</label>
              <textarea
                rows={3}
                value={formData.rotina}
                onChange={(e) => setFormData({ ...formData, rotina: e.target.value })}
                className="w-full bg-white/60 dark:bg-[#1a211d]/80 border border-gray-200 dark:border-[#2a342e] rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 dark:focus:ring-[#10b981] focus:outline-none dark:text-white transition-colors"
              />
            </div>
          </div>
        )}

        <div className={`flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-[#2a342e] mt-6`}>
          {!isInline && (
            <button
              type="button"
              onClick={() => router.back()}
              className="px-5 py-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a211d] hover:bg-gray-200 dark:hover:bg-[#2a342e] rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-[#10b981] dark:hover:bg-[#059669] text-white rounded-xl font-medium transition-colors"
          >
            {loading ? "Salvando..." : initialData ? "Salvar Alterações" : "Cadastrar Paciente"}
          </button>
        </div>
      </form>
    </div>
  );
}
