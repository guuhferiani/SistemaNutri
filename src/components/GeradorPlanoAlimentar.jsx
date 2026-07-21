import React, { useState, useEffect } from 'react';
import { client } from '../neonClient';
import { Sparkles, Save, Calendar, Clock, AlertTriangle, ChevronRight, CheckCircle2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DIAS_DA_SEMANA = [
  'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'
];

const REFEICOES_ORDEM = [
  { id: 'cafe_da_manha', label: 'Café da Manhã' },
  { id: 'lanche_manha', label: 'Lanche da Manhã' },
  { id: 'almoco', label: 'Almoço' },
  { id: 'lanche_tarde', label: 'Lanche da Tarde' },
  { id: 'jantar', label: 'Jantar' }
];

export default function GeradorPlanoAlimentar({ pacienteId, pacienteDados, theme }) {
  const [historicoPlanos, setHistoricoPlanos] = useState([]);
  const [loadingHistorico, setLoadingHistorico] = useState(true);
  
  const [gerando, setGerando] = useState(false);
  const [mensagemLoading, setMensagemLoading] = useState('');
  const [planoAtual, setPlanoAtual] = useState(null); 
  
  const [diaAtivo, setDiaAtivo] = useState(DIAS_DA_SEMANA[0]);
  const [salvando, setSalvando] = useState(false);
  const [toast, setToast] = useState(null);
  
  const isDark = theme === 'dark';

  useEffect(() => {
    if (pacienteId) {
      buscarHistorico();
    }
  }, [pacienteId]);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const buscarHistorico = async () => {
    setLoadingHistorico(true);
    try {
      const { data, error } = await client
        .from('planos_alimentares')
        .select('*')
        .eq('paciente_id', pacienteId)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') {
           showToast('Aviso: Tabela planos_alimentares ainda não foi criada no banco de dados.', 'error');
        } else {
           throw error;
        }
      } else {
        setHistoricoPlanos(data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar planos:', err);
    } finally {
      setLoadingHistorico(false);
    }
  };

  const prepararDadosPrompt = () => {
    if (!pacienteDados) return 'Dados não fornecidos.';
    return `
      Nome: ${pacienteDados.nome || 'Não informado'}
      Idade: ${pacienteDados.idade || 'Não informada'}
      Gênero: ${pacienteDados.genero || 'Não informado'}
      Peso: ${pacienteDados.peso || 'Não informado'}kg
      Altura: ${pacienteDados.altura || 'Não informada'}cm
      Objetivo: ${pacienteDados.objetivo || 'Alimentação saudável'}
      Restrições/Alergias: ${pacienteDados.restricoes || 'Nenhuma informada'}
      Histórico Clínico: ${pacienteDados.historico_clinico || 'Nada consta'}
      Preferências Alimentares: ${pacienteDados.preferencias || 'Não informadas'}
    `;
  };

  const gerarPlanoComIA = async () => {
    setGerando(true);
    setMensagemLoading('Buscando dados...');
    
    try {
      const dadosDoPaciente = prepararDadosPrompt();
      
      setTimeout(() => setMensagemLoading('IA calculando...'), 1500);
      setTimeout(() => setMensagemLoading('Ajustando restrições...'), 3500);

      const res = await fetch('/api/gerar-plano', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dados_do_paciente: dadosDoPaciente })
      });

      if (!res.ok) throw new Error('Falha na API');

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (!data.plano_semanal) throw new Error('Formato retornado inválido.');

      const planoNormalizado = DIAS_DA_SEMANA.map(diaNome => {
         return data.plano_semanal.find(d => d.dia === diaNome) || {
            dia: diaNome,
            refeicoes: { cafe_da_manha: ['','','','',''], lanche_manha: ['','','','',''], almoco: ['','','','',''], lanche_tarde: ['','','','',''], jantar: ['','','','',''] }
         };
      });

      setPlanoAtual({ tipo: 'ia', plano_semanal: planoNormalizado });
      setDiaAtivo('Segunda-feira');
      showToast('Plano gerado!', 'success');
      
    } catch (err) {
      console.error(err);
      showToast('Não foi possível gerar o plano com IA no momento. Clique em "Plano Manual" se preferir.', 'error');
    } finally {
      setGerando(false);
    }
  };

  const criarPlanoManual = () => {
    const planoVazio = DIAS_DA_SEMANA.map(diaNome => ({
      dia: diaNome,
      refeicoes: { 
        cafe_da_manha: ['','','','',''], 
        lanche_manha: ['','','','',''], 
        almoco: ['','','','',''], 
        lanche_tarde: ['','','','',''], 
        jantar: ['','','','',''] 
      }
    }));
    setPlanoAtual({ tipo: 'manual', plano_semanal: planoVazio });
    setDiaAtivo('Segunda-feira');
  };

  const handleInputChange = (diaAlvo, refeicaoKey, index, valor) => {
    if (!planoAtual) return;
    const novoPlano = { ...planoAtual };
    const diaIndex = novoPlano.plano_semanal.findIndex(d => d.dia === diaAlvo);
    if (diaIndex !== -1) {
       novoPlano.plano_semanal[diaIndex].refeicoes[refeicaoKey][index] = valor;
       setPlanoAtual(novoPlano);
    }
  };

  const salvarPlano = async () => {
    if (!planoAtual) return;
    setSalvando(true);
    try {
      const { data, error } = await client
        .from('planos_alimentares')
        .insert([{ paciente_id: pacienteId, conteudo: planoAtual }])
        .select();

      if (error) throw error;
      showToast('Plano salvo!', 'success');
      setHistoricoPlanos(prev => [data[0], ...prev]);
      setPlanoAtual(null);
    } catch (err) {
      showToast('Erro ao salvar plano.', 'error');
    } finally {
      setSalvando(false);
    }
  };

  const gerarPDF = (planoObj) => {
    const planoRef = planoObj || planoAtual;
    if (!planoRef || !planoRef.plano_semanal) return;
    
    const doc = new jsPDF();
    const nomePaciente = pacienteDados?.nome || 'Paciente';
    
    doc.setFontSize(18);
    doc.text(`Plano Alimentar - ${nomePaciente}`, 14, 20);
    
    let currentY = 30;

    planoRef.plano_semanal.forEach((diaData, diaIndex) => {
      // Avoid printing days that are completely empty
      const temConteudo = REFEICOES_ORDEM.some(refeicao => {
         return diaData.refeicoes[refeicao.id]?.some(o => o.trim() !== '');
      });

      if (!temConteudo) return;

      if (diaIndex > 0 && currentY > 250) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.setFontSize(14);
      doc.setTextColor(16, 185, 129); // emerald-500
      doc.text(diaData.dia, 14, currentY);
      currentY += 8;

      const body = [];
      
      REFEICOES_ORDEM.forEach(refeicao => {
        const opcoes = diaData.refeicoes[refeicao.id] || [];
        const opcoesFiltradas = opcoes.filter(o => o.trim() !== '');
        
        if (opcoesFiltradas.length > 0) {
          body.push([{ content: refeicao.label, styles: { fontStyle: 'bold', fillColor: [243, 244, 246], textColor: [55, 65, 81] } }]);
          opcoesFiltradas.forEach((opcao, i) => {
            body.push([`Opção ${i + 1}: ${opcao}`]);
          });
        }
      });

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: body,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5, lineColor: [229, 231, 235], lineWidth: 0.1 },
        columnStyles: { 0: { cellWidth: 'auto' } },
        margin: { left: 14, right: 14 },
      });

      currentY = doc.lastAutoTable.finalY + 15;
    });

    doc.save(`Plano_Alimentar_${nomePaciente.replace(/\s+/g, '_')}.pdf`);
  };

  const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.5s' },
    headerCard: {
      padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      border: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      flexWrap: 'wrap', gap: '10px'
    },
    title: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.125rem', fontWeight: 600, margin: 0 },
    subtitle: { fontSize: '0.875rem', color: isDark ? '#9ca3af' : '#6b7280', marginTop: '4px' },
    btnPrimary: {
      padding: '10px 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '8px', color: '#fff',
      backgroundColor: '#10b981', transition: '0.2s'
    },
    btnDisabled: { backgroundColor: '#34d399', cursor: 'not-allowed', color: '#fff' },
    btnSecondary: {
      padding: '10px 20px', borderRadius: '12px', fontWeight: 600, border: 'none', cursor: 'pointer',
      backgroundColor: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#e5e7eb' : '#374151'
    },
    mainCard: {
      borderRadius: '16px', border: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      backgroundColor: isDark ? '#1f2937' : '#ffffff', overflow: 'hidden'
    },
    tabsContainer: {
      display: 'flex', overflowX: 'auto', padding: '12px', gap: '8px',
      borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      backgroundColor: isDark ? '#111827' : '#f9fafb'
    },
    tab: {
      padding: '8px 16px', borderRadius: '8px', border: 'none', fontWeight: 500, fontSize: '0.875rem',
      cursor: 'pointer', whiteSpace: 'nowrap', transition: '0.2s'
    },
    tabActive: { backgroundColor: '#10b981', color: '#fff' },
    tabInactive: { backgroundColor: 'transparent', color: isDark ? '#9ca3af' : '#4b5563' },
    editorContent: { padding: '24px', display: 'flex', flexDirection: 'column', gap: '32px' },
    mealSection: { display: 'flex', flexDirection: 'column', gap: '12px' },
    mealTitle: { display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '1rem', fontWeight: 500, margin: 0 },
    inputsGrid: { display: 'grid', gap: '12px' },
    inputWrapper: { display: 'flex', position: 'relative' },
    inputIndex: {
      position: 'absolute', left: 0, top: 0, bottom: 0, width: '36px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? '#374151' : '#f3f4f6', color: isDark ? '#9ca3af' : '#6b7280',
      borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', fontSize: '0.75rem', fontWeight: 600
    },
    input: {
      width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
      border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
      backgroundColor: isDark ? '#111827' : '#ffffff', color: isDark ? '#e5e7eb' : '#1f2937',
      fontSize: '0.875rem'
    },
    footer: {
      padding: '16px 24px', display: 'flex', justifyContent: 'flex-end',
      borderTop: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      backgroundColor: isDark ? '#1f2937' : '#f9fafb'
    },
    historyHeader: { padding: '16px 24px', borderBottom: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`, margin: 0 },
    historyList: { padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' },
    historyItem: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '16px', borderRadius: '12px', border: `1px solid ${isDark ? '#374151' : '#f3f4f6'}`,
      cursor: 'pointer', backgroundColor: 'transparent', transition: '0.2s', width: '100%'
    },
    emptyState: { textAlign: 'center', padding: '48px', color: isDark ? '#9ca3af' : '#6b7280' },
    toast: {
      position: 'fixed', bottom: '20px', right: '20px', padding: '16px 24px', borderRadius: '12px',
      backgroundColor: toast?.type === 'error' ? '#ef4444' : '#10b981', color: '#fff',
      display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1000,
      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)'
    }
  };

  return (
    <div style={styles.container}>
      {toast && (
        <div style={styles.toast}>
           {toast.type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
           <span>{toast.msg}</span>
        </div>
      )}

      <div style={styles.headerCard}>
        <div>
           <h3 style={styles.title}><Sparkles color="#10b981" size={24} /> Geração de Planos (IA)</h3>
           <p style={styles.subtitle}>Gere cardápios semanais personalizados com Inteligência Artificial.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {planoAtual && (
             <>
               <button onClick={() => gerarPDF(planoAtual)} style={{ ...styles.btnSecondary, color: '#10b981' }}>
                 <Download size={18} /> Exportar PDF
               </button>
               <button onClick={() => setPlanoAtual(null)} style={styles.btnSecondary}>
                 Voltar
               </button>
             </>
          )}
          {!planoAtual && (
            <button
              onClick={criarPlanoManual}
              disabled={gerando}
              style={{ ...styles.btnSecondary, ...(gerando ? styles.btnDisabled : {}) }}
            >
              ✍️ Criar Manual
            </button>
          )}
          {!planoAtual && (
            <button
              onClick={gerarPlanoComIA}
              disabled={gerando}
              style={{ ...styles.btnPrimary, ...(gerando ? styles.btnDisabled : {}) }}
            >
              {gerando ? `${mensagemLoading}` : '✨ Gerar Plano com IA'}
            </button>
          )}
        </div>
      </div>

      {planoAtual ? (
        <div style={styles.mainCard}>
           <div style={styles.tabsContainer}>
              {DIAS_DA_SEMANA.map(dia => (
                <button
                  key={dia}
                  onClick={() => setDiaAtivo(dia)}
                  style={{ ...styles.tab, ...(diaAtivo === dia ? styles.tabActive : styles.tabInactive) }}
                >
                  {dia}
                </button>
              ))}
           </div>
           <div style={styles.editorContent}>
              {planoAtual.plano_semanal.filter(d => d.dia === diaAtivo).map(diaData => (
                 <div key={diaData.dia} style={styles.mealSection}>
                    {REFEICOES_ORDEM.map(refeicao => (
                       <div key={refeicao.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                          <h4 style={styles.mealTitle}>
                             <Clock size={18} /> {refeicao.label}
                          </h4>
                          <div style={styles.inputsGrid}>
                             {diaData.refeicoes[refeicao.id]?.map((opcao, index) => (
                                <div key={index} style={styles.inputWrapper}>
                                   <div style={styles.inputIndex}>{index + 1}</div>
                                   <input
                                      type="text"
                                      value={opcao}
                                      onChange={(e) => handleInputChange(diaData.dia, refeicao.id, index, e.target.value)}
                                      style={styles.input}
                                      placeholder={`Opção ${index + 1}`}
                                   />
                                </div>
                             ))}
                          </div>
                       </div>
                    ))}
                 </div>
              ))}
           </div>
           <div style={styles.footer}>
              <button onClick={salvarPlano} disabled={salvando} style={{ ...styles.btnPrimary, ...(salvando ? styles.btnDisabled : {}) }}>
                 {salvando ? 'Salvando...' : <><Save size={18} /> Salvar Plano Alimentar</>}
              </button>
           </div>
        </div>
      ) : (
        <div style={styles.mainCard}>
           <h4 style={styles.historyHeader}>
             <Calendar size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'sub' }} color="#9ca3af" /> 
             Histórico de Planos
           </h4>
           <div style={styles.historyList}>
              {loadingHistorico ? (
                 <div style={styles.emptyState}>Carregando histórico...</div>
              ) : historicoPlanos.length === 0 ? (
                 <div style={styles.emptyState}>Nenhum plano gerado ainda.</div>
              ) : (
                 historicoPlanos.map(plano => (
                     <div
                        key={plano.id}
                        style={styles.historyItem}
                     >
                        <div style={{ textAlign: 'left', flex: 1, cursor: 'pointer' }} onClick={() => { setPlanoAtual(plano.conteudo); setDiaAtivo('Segunda-feira'); }}>
                           <p style={{ fontWeight: 500, margin: 0, color: isDark ? '#e5e7eb' : '#1f2937' }}>
                              {plano.conteudo?.tipo === 'manual' ? 'Plano Alimentar Manual' : 'Plano Alimentar Gerado com IA'}
                           </p>
                           <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: '4px 0 0 0' }}>
                              {new Date(plano.created_at).toLocaleString('pt-BR')}
                           </p>
                        </div>
                        <button 
                           onClick={(e) => { e.stopPropagation(); gerarPDF(plano.conteudo); }}
                           style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center' }}
                           title="Baixar PDF"
                        >
                           <Download size={20} color="#10b981" />
                        </button>
                     </div>
                 ))
              )}
           </div>
        </div>
      )}
    </div>
  );
}
