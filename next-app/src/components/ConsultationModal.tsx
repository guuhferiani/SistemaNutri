"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function ConsultationModal({
  isOpen,
  onClose,
  onSave,
  initialData = null,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  initialData?: any;
}) {
  const [formData, setFormData] = useState({
    data_consulta: new Date().toISOString().split("T")[0],
    peso: "",
    cintura: "",
    quadril: "",
    percentual_gordura: "",
    observacoes: "",
    proximo_retorno: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        data_consulta: initialData.data_consulta || new Date().toISOString().split("T")[0],
        peso: initialData.peso || "",
        cintura: initialData.cintura || "",
        quadril: initialData.quadril || "",
        percentual_gordura: initialData.percentual_gordura || "",
        observacoes: initialData.observacoes || "",
        proximo_retorno: initialData.proximo_retorno || "",
      });
    } else if (isOpen && !initialData) {
      setFormData({
        data_consulta: new Date().toISOString().split("T")[0],
        peso: "",
        cintura: "",
        quadril: "",
        percentual_gordura: "",
        observacoes: "",
        proximo_retorno: "",
      });
    }
    setError("");
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.data_consulta || !formData.peso) {
      setError("Data da consulta e Peso são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSave({ ...initialData, ...formData });
      onClose();
    } catch (err: any) {
      setError(err.message || "Erro ao salvar consulta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {initialData ? "Editar Consulta" : "Nova Consulta"}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {error && <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm">{error}</div>}
          
          <form id="consultation-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data da Consulta *</label>
                <input
                  type="date"
                  required
                  value={formData.data_consulta}
                  onChange={(e) => setFormData({ ...formData, data_consulta: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Próximo Retorno</label>
                <input
                  type="date"
                  value={formData.proximo_retorno}
                  onChange={(e) => setFormData({ ...formData, proximo_retorno: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.peso}
                  onChange={(e) => setFormData({ ...formData, peso: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gordura Corporal (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.percentual_gordura}
                  onChange={(e) => setFormData({ ...formData, percentual_gordura: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cintura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.cintura}
                  onChange={(e) => setFormData({ ...formData, cintura: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quadril (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.quadril}
                  onChange={(e) => setFormData({ ...formData, quadril: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
              <textarea
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl font-medium transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="consultation-form"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-sm"
          >
            {loading ? "Salvando..." : "Salvar Consulta"}
          </button>
        </div>
      </div>
    </div>
  );
}
