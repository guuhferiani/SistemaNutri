"use client";

import { useState, useEffect } from "react";
import { client } from "@/lib/neonClient";
import { Sparkles, Calendar, Apple, Download, Info } from "lucide-react";
// jsPDF and autoTable imported dynamically to avoid SSR issues if necessary, but we can import normally for now
// since it's a Client Component
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DIAS_DA_SEMANA = [
  "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
];

const REFEICOES_ORDEM = [
  { id: "cafe_da_manha", label: "Café da Manhã" },
  { id: "lanche_manha", label: "Lanche da Manhã" },
  { id: "almoco", label: "Almoço" },
  { id: "lanche_tarde", label: "Lanche da Tarde" },
  { id: "jantar", label: "Jantar" }
];

export default function MealPlanGenerator({ 
  patient, 
  existingPlans = [], 
  onPlanSaved 
}: { 
  patient: any;
  existingPlans?: any[];
  onPlanSaved?: () => void;
}) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [activeDay, setActiveDay] = useState(DIAS_DA_SEMANA[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Sort existing plans descending
    const sorted = [...existingPlans].sort((a, b) => {
      let da = a.created_at;
      if (typeof da === "string" && !da.includes("T")) da = da.replace(" ", "T");
      if (typeof da === "string" && !da.endsWith("Z") && !da.includes("+")) da += "Z";
      
      let db = b.created_at;
      if (typeof db === "string" && !db.includes("T")) db = db.replace(" ", "T");
      if (typeof db === "string" && !db.endsWith("Z") && !db.includes("+")) db += "Z";
      
      return new Date(db).getTime() - new Date(da).getTime();
    });
    setHistory(sorted);
    setLoading(false);
  }, [existingPlans]);

  const generateWithAI = async () => {
    setGenerating(true);
    setError("");
    try {
      const patientDataStr = `
        Nome: ${patient?.nome || "Paciente"}
        Idade: - 
        Peso: ${patient?.peso_inicial || "Não informado"}kg
        Objetivos: ${patient?.objetivo_texto || "Alimentação balanceada"}
        Alergias/Restrições: ${patient?.alergias?.join(", ") || "Nenhuma"}
      `;
      const res = await fetch("/api/gerar-plano", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dados_do_paciente: patientDataStr }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Falha na API.");

      const normalizedPlan = DIAS_DA_SEMANA.map((diaNome) => {
        return (
          data.plano_semanal?.find((d: any) => d.dia === diaNome) || {
            dia: diaNome,
            refeicoes: { cafe_da_manha: [""], lanche_manha: [""], almoco: [""], lanche_tarde: [""], jantar: [""] },
          }
        );
      });
      setCurrentPlan({ tipo: "ia", plano_semanal: normalizedPlan });
    } catch (err: any) {
      setError(err.message || "Não foi possível gerar com a IA.");
    } finally {
      setGenerating(false);
    }
  };

  const createManualPlan = () => {
    const emptyPlan = DIAS_DA_SEMANA.map((diaNome) => ({
      dia: diaNome,
      refeicoes: { cafe_da_manha: [""], lanche_manha: [""], almoco: [""], lanche_tarde: [""], jantar: [""] },
    }));
    setCurrentPlan({ tipo: "manual", plano_semanal: emptyPlan });
  };

  const handleInputChange = (diaAlvo: string, refeicaoKey: string, index: number, valor: string) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };
    const diaIndex = newPlan.plano_semanal.findIndex((d: any) => d.dia === diaAlvo);
    if (diaIndex !== -1) {
      if (!newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey]) {
        newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey] = [""];
      }
      newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey][index] = valor;
      setCurrentPlan(newPlan);
    }
  };

  const addOption = (diaAlvo: string, refeicaoKey: string) => {
    if (!currentPlan) return;
    const newPlan = { ...currentPlan };
    const diaIndex = newPlan.plano_semanal.findIndex((d: any) => d.dia === diaAlvo);
    if (diaIndex !== -1) {
      if (!newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey]) {
        newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey] = [];
      }
      newPlan.plano_semanal[diaIndex].refeicoes[refeicaoKey].push("");
      setCurrentPlan(newPlan);
    }
  };

  const savePlan = async () => {
    if (!currentPlan || !patient?.id) return;
    setSaving(true);
    try {
      if (currentPlan.id) {
        // Atualiza o plano existente
        const { error } = await client
          .from("planos_alimentares")
          .update({ conteudo: currentPlan })
          .eq("id", currentPlan.id);
        if (error) throw error;
        
        // Atualiza o histórico localmente
        setHistory((prev) => prev.map(p => p.id === currentPlan.id ? { ...p, conteudo: currentPlan } : p));
      } else {
        // Cria um novo plano
        const { data, error } = await client
          .from("planos_alimentares")
          .insert([{ paciente_id: patient.id, conteudo: currentPlan }])
          .select();
        if (error) throw error;
        setHistory((prev) => [data[0], ...prev]);
      }
      
      setCurrentPlan(null);
      if (onPlanSaved) onPlanSaved();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  };

  const openPlan = (plano: any) => {
    // Garantir que carregamos o formato correto
    const targetPlan = plano?.conteudo || plano;
    
    if (targetPlan && targetPlan.plano_semanal) {
      setCurrentPlan(targetPlan);
      // Se não tiver tipo, setamos como 'salvo' para identificação
      if (!targetPlan.tipo) {
        setCurrentPlan({ ...targetPlan, tipo: "salvo", id: plano.id });
      } else {
        setCurrentPlan({ ...targetPlan, id: plano.id });
      }
    } else {
      setError("Este plano está num formato antigo ou inválido.");
    }
  };

  const downloadPDF = (planObj: any) => {
    const targetPlan = planObj?.conteudo || planObj;
    if (!targetPlan?.plano_semanal) return;

    const doc = new jsPDF();
    const patientName = patient?.nome || "Paciente";

    doc.setFontSize(18);
    doc.text(`Plano Alimentar - ${patientName}`, 14, 20);

    let currentY = 30;

    targetPlan.plano_semanal.forEach((diaData: any, diaIndex: number) => {
      const hasContent = REFEICOES_ORDEM.some((refeicao) =>
        diaData.refeicoes[refeicao.id]?.some((o: string) => o.trim() !== "")
      );
      if (!hasContent) return;

      if (diaIndex > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // text-emerald-500
      doc.text(diaData.dia, 14, currentY);
      currentY += 8;

      const body: any[] = [];
      REFEICOES_ORDEM.forEach((refeicao) => {
        const options = diaData.refeicoes[refeicao.id] || [];
        const filteredOptions = options.filter((o: string) => o.trim() !== "");

        if (filteredOptions.length > 0) {
          body.push([{ content: refeicao.label, styles: { fontStyle: "bold", fillColor: [243, 244, 246], textColor: [55, 65, 81] } }]);
          filteredOptions.forEach((opt: string, i: number) => {
            body.push([`Opção ${i + 1}: ${opt}`]);
          });
        }
      });

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: body,
        theme: "grid",
        styles: { fontSize: 10, cellPadding: 5, lineColor: [229, 231, 235], lineWidth: 0.1 },
        columnStyles: { 0: { cellWidth: "auto" } },
        margin: { left: 14, right: 14 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    });

    doc.save(`Plano_${patientName.replace(/\s+/g, "_")}.pdf`);
  };

  return (
    <div className="space-y-6">
      {!currentPlan ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 items-center bg-white/40 dark:bg-[#141916]/80 p-6 rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm justify-between transition-colors duration-300">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Apple className="text-emerald-500" />
                Gerador de Dietas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Crie um novo plano alimentar manualmente ou com IA.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={createManualPlan}
                className="px-4 py-2 bg-white dark:bg-[#1a211d] hover:bg-gray-50 dark:hover:bg-[#2a342e] border border-gray-200 dark:border-[#2a342e] text-gray-700 dark:text-gray-300 rounded-xl font-medium shadow-sm transition-colors"
              >
                Criar Manualmente
              </button>
              <button
                onClick={generateWithAI}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium shadow-sm transition-colors disabled:opacity-50"
              >
                <Sparkles size={18} />
                {generating ? "Gerando IA..." : "Gerar com IA"}
              </button>
            </div>
          </div>
          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}

          <div className="bg-white/40 dark:bg-[#141916]/80 p-6 rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm transition-colors duration-300">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Planos Salvos</h4>
            {loading ? (
              <p className="text-gray-500 dark:text-gray-400">Carregando histórico...</p>
            ) : history.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">Nenhum plano salvo para este paciente.</p>
            ) : (
              <div className="space-y-3">
                {history.map((plano) => (
                  <div key={plano.id} className="flex items-center justify-between p-4 bg-white/60 dark:bg-[#1a211d]/80 rounded-xl border border-gray-100 dark:border-[#2a342e] shadow-sm transition-colors">
                    <div className="flex items-center gap-3">
                      <Calendar className="text-gray-400 dark:text-gray-500" size={20} />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          Plano de {(() => {
                            let d = plano.created_at;
                            if (typeof d === "string" && !d.includes("T")) d = d.replace(" ", "T");
                            if (typeof d === "string" && !d.endsWith("Z") && !d.includes("+")) d += "Z";
                            return new Date(d).toLocaleDateString("pt-BR");
                          })()}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Salvo em {(() => {
                            let d = plano.created_at;
                            if (typeof d === "string" && !d.includes("T")) d = d.replace(" ", "T");
                            if (typeof d === "string" && !d.endsWith("Z") && !d.includes("+")) d += "Z";
                            return new Date(d).toLocaleString("pt-BR");
                          })()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openPlan(plano)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Apple size={16} />
                        Abrir
                      </button>
                      <button
                        onClick={() => downloadPDF(plano)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-[#10b981] hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg text-sm font-medium transition-colors"
                      >
                        <Download size={16} />
                        Baixar PDF
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white/40 dark:bg-[#141916]/80 p-6 rounded-2xl border border-white/50 dark:border-[#2a342e] shadow-sm space-y-6 transition-colors duration-300">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#2a342e] pb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Editando Plano Alimentar</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPlan(null)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a211d] rounded-xl font-medium transition-colors"
              >
                Descartar
              </button>
              <button
                onClick={savePlan}
                disabled={saving}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
              >
                {saving ? "Salvando..." : "Salvar Plano"}
              </button>
            </div>
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2">
            {DIAS_DA_SEMANA.map((dia) => (
              <button
                key={dia}
                onClick={() => setActiveDay(dia)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeDay === dia ? "bg-emerald-500 text-white" : "bg-white/60 dark:bg-[#1a211d]/80 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a211d]"
                }`}
              >
                {dia}
              </button>
            ))}
          </div>

          <div className="bg-white/60 dark:bg-[#141916]/80 p-6 rounded-xl border border-gray-100 dark:border-[#2a342e] space-y-6 transition-colors">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg">
              <Info size={18} />
              <p className="text-sm">Edite as opções abaixo. Deixe em branco se não quiser incluir a refeição.</p>
            </div>
            {REFEICOES_ORDEM.map((refeicao) => {
              const diaAtualObj = currentPlan.plano_semanal.find((d: any) => d.dia === activeDay);
              const opcoes = diaAtualObj?.refeicoes[refeicao.id] || [""];
              return (
                <div key={refeicao.id} className="space-y-2 border-b border-gray-100 dark:border-[#2a342e] pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 dark:text-white">{refeicao.label}</h4>
                    <button
                      onClick={() => addOption(activeDay, refeicao.id)}
                      className="text-sm text-blue-600 dark:text-[#10b981] hover:underline"
                    >
                      + Adicionar Opção
                    </button>
                  </div>
                  {opcoes.map((opcao: string, index: number) => (
                    <div key={index} className="flex items-center relative">
                      <span className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center bg-gray-100 dark:bg-[#1a211d] text-gray-500 dark:text-gray-400 font-medium text-xs rounded-l-lg border border-r-0 border-gray-200 dark:border-[#2a342e]">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={opcao}
                        onChange={(e) => handleInputChange(activeDay, refeicao.id, index, e.target.value)}
                        placeholder="Ex: 2 fatias de pão integral, 1 ovo cozido..."
                        className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#141916] border border-gray-200 dark:border-[#2a342e] rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none dark:text-white transition-colors"
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
