"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";

export default function ConsultationList({
  consultations,
  onAdd,
  onEdit,
  onDelete
}: {
  consultations: any[];
  onAdd: () => void;
  onEdit: (consultation: any) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-4">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Calendar size={24} className="text-blue-600" />
          Histórico de Consultas
        </h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm text-sm"
        >
          <Plus size={18} />
          Nova Consulta
        </button>
      </div>

      {consultations.length === 0 ? (
        <div className="text-center py-12 bg-white/40 rounded-xl border border-white/50">
          <p className="text-gray-500">Nenhuma consulta registrada para este paciente.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50/50">
              <tr>
                <th className="px-6 py-3 rounded-tl-xl">Data</th>
                <th className="px-6 py-3">Peso (kg)</th>
                <th className="px-6 py-3">Gordura (%)</th>
                <th className="px-6 py-3">Próximo Retorno</th>
                <th className="px-6 py-3 text-right rounded-tr-xl">Ações</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((c) => (
                <tr key={c.id} className="bg-white/60 border-b border-white/50 hover:bg-white/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{c.data_consulta}</td>
                  <td className="px-6 py-4">{c.peso || "-"}</td>
                  <td className="px-6 py-4">{c.percentual_gordura || "-"}</td>
                  <td className="px-6 py-4">{c.proximo_retorno || "-"}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(c)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
