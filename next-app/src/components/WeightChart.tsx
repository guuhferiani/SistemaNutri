"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function WeightChart({ consultations }: { consultations: any[] }) {
  if (!consultations || consultations.length === 0) {
    return (
      <div className="bg-white/40 border border-white/50 rounded-2xl p-8 text-center text-gray-500 shadow-sm">
        Nenhuma consulta registrada ainda
      </div>
    );
  }

  // Ordena do mais antigo para o mais novo no gráfico, para que o tempo "avança" da esquerda pra direita
  const sortedData = [...consultations].sort(
    (a, b) => new Date(a.data_consulta).getTime() - new Date(b.data_consulta).getTime()
  );

  const data = sortedData.map((c) => {
    // Format date properly (e.g. DD/MM)
    const dateObj = new Date(c.data_consulta);
    const day = String(dateObj.getDate() + 1).padStart(2, "0"); // simple timezone fix if needed
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");

    return {
      name: `${day}/${month}`,
      peso: parseFloat(c.peso) || 0,
      data_completa: c.data_consulta,
    };
  });

  return (
    <div className="bg-white/60 border border-white/50 rounded-2xl p-6 shadow-sm mb-8">
      <h3 className="text-lg font-bold text-gray-800 mb-4">Evolução de Peso (kg)</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
            <Tooltip
              contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#2563eb', fontWeight: 'bold' }}
            />
            <Line
              type="monotone"
              dataKey="peso"
              name="Peso"
              stroke="#2563eb"
              strokeWidth={3}
              activeDot={{ r: 6, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
