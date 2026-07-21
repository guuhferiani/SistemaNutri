import React, { useEffect, useState } from 'react';
import { client } from '../neonClient';
import { LogOut, User, Mail, Calendar, Sparkles, Sun, Moon, LayoutDashboard, Users, MessageSquare, ArrowLeft, Phone, Target, AlertTriangle } from 'lucide-react';
import GeradorPlanoAlimentar from './GeradorPlanoAlimentar';

const getIMCCategory = (imc) => {
  if (!imc) return '';
  if (imc < 18.5) return 'Magreza';
  if (imc < 24.9) return 'Normal';
  if (imc < 29.9) return 'Sobrepeso';
  if (imc < 34.9) return 'Obesidade Grau I';
  if (imc < 39.9) return 'Obesidade Grau II';
  return 'Obesidade Grau III';
};

export default function Dashboard({ session, theme, toggleTheme }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [activeTab, setActiveTab] = useState('inicio'); // 'inicio' or 'pacientes'

  // Form states and search state for Prompt 4
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos'); // 'todos', 'ativos', 'inativos'
  const [filterGoal, setFilterGoal] = useState('todos');
  const [activeFormTab, setActiveFormTab] = useState('pessoal'); // 'pessoal', 'clinico', 'habitos'
  const [savingPatient, setSavingPatient] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingPatientId, setEditingPatientId] = useState(null);

  // Prompt 5 states
  const [profileSection, setProfileSection] = useState('dados'); // 'dados', 'consultas', 'planos'
  const [profileActiveFormTab, setProfileActiveFormTab] = useState('pessoal'); // 'pessoal', 'clinico', 'habitos'
  const [editFormData, setEditFormData] = useState(null);
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [editErrorMessage, setEditErrorMessage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const initialConsultationForm = {
    data_consulta: new Date().toISOString().split('T')[0],
    peso: '',
    cintura: '',
    quadril: '',
    massa_gorda: '',
    percentual_gordura: '',
    observacoes: '',
    proximo_retorno: '',
  };
  const [consultationForm, setConsultationForm] = useState(initialConsultationForm);
  const [editingConsultationId, setEditingConsultationId] = useState(null);
  const [savingConsultation, setSavingConsultation] = useState(false);
  const [consultationError, setConsultationError] = useState('');

  const [selectedPlanId, setSelectedPlanId] = useState(null);

  // Initialize editFormData for direct profile editing (Prompt 5)
  useEffect(() => {
    if (selectedPatient) {
      const standardPatologias = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
      const standardRestricoes = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
      const standardAlergias = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

      const pat = selectedPatient.patologias || [];
      const res = selectedPatient.restricoes_alimentares || [];
      const alg = selectedPatient.alergias || [];

      const patCheckbox = pat.filter(p => standardPatologias.includes(p) || p === 'Nenhum');
      const patOutro = pat.filter(p => !standardPatologias.includes(p) && p !== 'Nenhum').join(', ');

      const resCheckbox = res.filter(r => standardRestricoes.includes(r) || r === 'Nenhum');
      const resOutro = res.filter(r => !standardRestricoes.includes(r) && r !== 'Nenhum').join(', ');

      const algCheckbox = alg.filter(a => standardAlergias.includes(a) || a === 'Nenhum');
      const algOutro = alg.filter(a => !standardAlergias.includes(a) && a !== 'Nenhum').join(', ');

      const heightInCm = selectedPatient.altura ? Math.round(selectedPatient.altura * 100) : '';

      setEditFormData({
        nome: selectedPatient.nome || '',
        data_nascimento: selectedPatient.data_nascimento || '',
        sexo: selectedPatient.sexo || '',
        telefone: selectedPatient.telefone || '',
        whatsapp: selectedPatient.whatsapp || '',
        email: selectedPatient.email || '',
        peso_inicial: selectedPatient.peso_inicial || '',
        altura: heightInCm,
        objetivos: selectedPatient.objetivos || [],
        objective_texto: selectedPatient.objetivo_texto || '', // using objective_texto / objetivo_texto mapping
        objetivo_texto: selectedPatient.objetivo_texto || '',
        nivel_atividade: selectedPatient.nivel_atividade || '',
        patologias: patCheckbox,
        patologias_outro: patOutro,
        restricoes_alimentares: resCheckbox,
        restricoes_outro: resOutro,
        alergias: algCheckbox,
        alergias_outro: algOutro,
        medicamentos: selectedPatient.medicamentos || '',
        suplementos: selectedPatient.suplementos || '',
        refeicoes_por_dia: selectedPatient.refeicoes_por_dia || '',
        horario_acorda: selectedPatient.horario_acorda || '',
        horario_dorme: selectedPatient.horario_dorme || '',
        litros_agua: selectedPatient.litros_agua || '',
        atividade_fisica: selectedPatient.atividade_fisica || false,
        atividade_fisica_descricao: selectedPatient.atividade_fisica_descricao || '',
        observacoes: selectedPatient.observacoes || '',
      });
      setProfileActiveFormTab('pessoal');
      setEditSuccessMessage('');
      setEditErrorMessage('');
      setProfileSection('dados'); // Default section when opening a patient
    }
  }, [selectedPatientId, patients]);

  const initialFormState = {
    nome: '',
    data_nascimento: '',
    sexo: '',
    telefone: '',
    whatsapp: '',
    email: '',
    peso_inicial: '',
    altura: '',
    objetivos: [],
    objetivo_texto: '',
    nivel_atividade: '',
    patologias: [],
    patologias_outro: '',
    restricoes_alimentares: [],
    restricoes_outro: '',
    alergias: [],
    alergias_outro: '',
    medicamentos: '',
    suplementos: '',
    refeicoes_por_dia: '',
    horario_acorda: '',
    horario_dorme: '',
    litros_agua: '',
    atividade_fisica: false,
    atividade_fisica_descricao: '',
    observacoes: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  // Helper functions for Prompt 4
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : '';
  };

  const handlePhoneChange = (field, value) => {
    const rawDigits = value.replace(/\D/g, '');
    if (rawDigits.length > 11) return;
    let formatted = rawDigits;
    if (rawDigits.length > 2) {
      formatted = `(${rawDigits.slice(0, 2)}) `;
      if (rawDigits.length > 7) {
        formatted += `${rawDigits.slice(2, 7)}-${rawDigits.slice(7, 11)}`;
      } else {
        formatted += rawDigits.slice(2);
      }
    }
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const formatTimeInput = (value) => {
    if (!value) return '';
    const clean = value.replace(/\D/g, '');
    if (!clean) return '';
    let hours = 0;
    let minutes = 0;
    if (clean.length <= 2) {
      hours = parseInt(clean, 10);
    } else if (clean.length === 3) {
      hours = parseInt(clean.slice(0, 1), 10);
      minutes = parseInt(clean.slice(1), 10);
    } else {
      hours = parseInt(clean.slice(0, 2), 10);
      minutes = parseInt(clean.slice(2, 4), 10);
    }
    if (hours > 23) hours = 23;
    if (minutes > 59) minutes = 59;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const handleTimeBlur = (field) => {
    const rawVal = formData[field];
    if (!rawVal) return;
    const formatted = formatTimeInput(rawVal);
    setFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleCheckboxChange = (field, value) => {
    setFormData(prev => {
      let currentList = [...(prev[field] || [])];
      if (value === 'Nenhum') {
        if (currentList.includes('Nenhum')) {
          currentList = [];
        } else {
          currentList = ['Nenhum'];
        }
      } else {
        currentList = currentList.filter(item => item !== 'Nenhum');
        if (currentList.includes(value)) {
          currentList = currentList.filter(item => item !== value);
        } else {
          currentList.push(value);
        }
      }
      return { ...prev, [field]: currentList };
    });
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!formData.nome.trim()) {
      setErrorMessage('O nome completo é obrigatório.');
      return;
    }
    setSavingPatient(true);
    try {
      // Compile final lists by combining standard checklists and free-form entries
      const finalPatologias = [...formData.patologias];
      if (formData.patologias_outro.trim() && !finalPatologias.includes('Nenhum')) {
        finalPatologias.push(formData.patologias_outro.trim());
      }
      const finalRestricoes = [...formData.restricoes_alimentares];
      if (formData.restricoes_outro.trim() && !finalRestricoes.includes('Nenhum')) {
        finalRestricoes.push(formData.restricoes_outro.trim());
      }
      const finalAlergias = [...formData.alergias];
      if (formData.alergias_outro.trim() && !finalAlergias.includes('Nenhum')) {
        finalAlergias.push(formData.alergias_outro.trim());
      }

      // Convert height in cm to meters
      const heightInMeters = formData.altura ? parseFloat(formData.altura) / 100 : null;

      const payload = {
        nutricionista_id: session.user.id,
        nome: formData.nome.trim(),
        data_nascimento: formData.data_nascimento || null,
        sexo: formData.sexo || null,
        whatsapp: formData.whatsapp || null,
        email: formData.email || null,
        peso_inicial: formData.peso_inicial ? parseFloat(formData.peso_inicial) : null,
        altura: heightInMeters,
        objetivos: formData.objetivos,
        objetivo_texto: formData.objetivo_texto || null,
        nivel_atividade: formData.nivel_atividade || null,
        patologias: finalPatologias,
        restricoes_alimentares: finalRestricoes,
        alergias: finalAlergias,
        medicamentos: formData.medicamentos || null,
        suplementos: formData.suplementos || null,
        refeicoes_por_dia: formData.refeicoes_por_dia ? parseInt(formData.refeicoes_por_dia, 10) : null,
        horario_acorda: formData.horario_acorda || null,
        horario_dorme: formData.horario_dorme || null,
        litros_agua: formData.litros_agua ? parseFloat(formData.litros_agua) : null,
        atividade_fisica: formData.atividade_fisica,
        atividade_fisica_descricao: formData.atividade_fisica ? formData.atividade_fisica_descricao || null : null,
        observacoes: formData.observacoes || null,
      };

      let res;
      if (editingPatientId) {
        res = await client
          .from('pacientes')
          .update(payload)
          .eq('id', editingPatientId)
          .select();
      } else {
        res = await client
          .from('pacientes')
          .insert([payload])
          .select();
      }

      const { data, error } = res;

      if (error) throw error;

      setSuccessMessage(editingPatientId ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
      setFormData(initialFormState);
      setEditingPatientId(null);
      setActiveFormTab('pessoal');
      
      // Refetch patients to ensure local state is updated
      await fetchPatientsData();

      // Redirect to the newly created patient profile
      if (data && data[0]) {
        setSelectedPatientId(data[0].id);
        setActiveTab('pacientes');
      }
    } catch (err) {
      console.error('Erro ao salvar paciente:', err.message);
      setErrorMessage('Erro ao salvar paciente: ' + err.message);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleStartEdit = (patient) => {
    const standardPatologias = ['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'];
    const standardRestricoes = ['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'];
    const standardAlergias = ['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'];

    const pat = patient.patologias || [];
    const res = patient.restricoes_alimentares || [];
    const alg = patient.alergias || [];

    const patCheckbox = pat.filter(p => standardPatologias.includes(p) || p === 'Nenhum');
    const patOutro = pat.filter(p => !standardPatologias.includes(p) && p !== 'Nenhum').join(', ');

    const resCheckbox = res.filter(r => standardRestricoes.includes(r) || r === 'Nenhum');
    const resOutro = res.filter(r => !standardRestricoes.includes(r) && r !== 'Nenhum').join(', ');

    const algCheckbox = alg.filter(a => standardAlergias.includes(a) || a === 'Nenhum');
    const algOutro = alg.filter(a => !standardAlergias.includes(a) && a !== 'Nenhum').join(', ');

    const heightInCm = patient.altura ? Math.round(patient.altura * 100) : '';

    setFormData({
      nome: patient.nome || '',
      data_nascimento: patient.data_nascimento || '',
      sexo: patient.sexo || '',
      telefone: patient.telefone || '',
      whatsapp: patient.whatsapp || '',
      email: patient.email || '',
      peso_inicial: patient.peso_inicial || '',
      altura: heightInCm,
      objetivos: patient.objetivos || [],
      objetivo_texto: patient.objetivo_texto || '',
      nivel_atividade: patient.nivel_atividade || '',
      patologias: patCheckbox,
      patologias_outro: patOutro,
      restricoes_alimentares: resCheckbox,
      restricoes_outro: resOutro,
      alergias: algCheckbox,
      alergias_outro: algOutro,
      medicamentos: patient.medicamentos || '',
      suplementos: patient.suplementos || '',
      refeicoes_por_dia: patient.refeicoes_por_dia || '',
      horario_acorda: patient.horario_acorda || '',
      horario_dorme: patient.horario_dorme || '',
      litros_agua: patient.litros_agua || '',
      atividade_fisica: patient.atividade_fisica || false,
      atividade_fisica_descricao: patient.atividade_fisica_descricao || '',
      observacoes: patient.observacoes || '',
    });

    setEditingPatientId(patient.id);
    setErrorMessage('');
    setSuccessMessage('');
    setActiveFormTab('pessoal');
    setActiveTab('cadastro');
    setSelectedPatientId(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditErrorMessage('');
    setEditSuccessMessage('');
    if (!editFormData.nome.trim()) {
      setEditErrorMessage('O nome completo é obrigatório.');
      return;
    }
    setSavingEdit(true);
    try {
      const finalPatologias = [...editFormData.patologias];
      if (editFormData.patologias_outro.trim() && !finalPatologias.includes('Nenhum')) {
        finalPatologias.push(editFormData.patologias_outro.trim());
      }
      const finalRestricoes = [...editFormData.restricoes_alimentares];
      if (editFormData.restricoes_outro.trim() && !finalRestricoes.includes('Nenhum')) {
        finalRestricoes.push(editFormData.restricoes_outro.trim());
      }
      const finalAlergias = [...editFormData.alergias];
      if (editFormData.alergias_outro.trim() && !finalAlergias.includes('Nenhum')) {
        finalAlergias.push(editFormData.alergias_outro.trim());
      }

      const heightInMeters = editFormData.altura ? parseFloat(editFormData.altura) / 100 : null;

      const payload = {
        nome: editFormData.nome.trim(),
        data_nascimento: editFormData.data_nascimento || null,
        sexo: editFormData.sexo || null,
        whatsapp: editFormData.whatsapp || null,
        email: editFormData.email || null,
        peso_inicial: editFormData.peso_inicial ? parseFloat(editFormData.peso_inicial) : null,
        altura: heightInMeters,
        objetivos: editFormData.objetivos,
        objetivo_texto: editFormData.objetivo_texto || null,
        nivel_atividade: editFormData.nivel_atividade || null,
        patologias: finalPatologias,
        restricoes_alimentares: finalRestricoes,
        alergias: finalAlergias,
        medicamentos: editFormData.medicamentos || null,
        suplementos: editFormData.suplementos || null,
        refeicoes_por_dia: editFormData.refeicoes_por_dia ? parseInt(editFormData.refeicoes_por_dia, 10) : null,
        horario_acorda: editFormData.horario_acorda || null,
        horario_dorme: editFormData.horario_dorme || null,
        litros_agua: editFormData.litros_agua ? parseFloat(editFormData.litros_agua) : null,
        atividade_fisica: editFormData.atividade_fisica,
        atividade_fisica_descricao: editFormData.atividade_fisica ? editFormData.atividade_fisica_descricao || null : null,
        observacoes: editFormData.observacoes || null,
      };

      const { error } = await client
        .from('pacientes')
        .update(payload)
        .eq('id', selectedPatient.id);

      if (error) throw error;

      setEditSuccessMessage('Alterações salvas com sucesso!');
      await fetchPatientsData();
    } catch (err) {
      console.error('Erro ao editar paciente:', err.message);
      setEditErrorMessage('Erro ao salvar alterações: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    setConsultationError('');
    if (!consultationForm.peso) {
      setConsultationError('O peso é obrigatório.');
      return;
    }
    setSavingConsultation(true);
    try {
      const payload = {
        paciente_id: selectedPatient.id,
        data_consulta: consultationForm.data_consulta,
        peso: parseFloat(consultationForm.peso),
        cintura: consultationForm.cintura ? parseFloat(consultationForm.cintura) : null,
        quadril: consultationForm.quadril ? parseFloat(consultationForm.quadril) : null,
        percentual_gordura: consultationForm.percentual_gordura ? parseFloat(consultationForm.percentual_gordura) : null,
        observacoes: consultationForm.observacoes || null,
        proximo_retorno: consultationForm.proximo_retorno || null,
      };

      if (editingConsultationId) {
        const { error } = await client
          .from('consultas')
          .update(payload)
          .eq('id', editingConsultationId);
        if (error) throw error;
      } else {
        const { error } = await client
          .from('consultas')
          .insert([payload]);
        if (error) throw error;
      }

      setEditingConsultationId(null);
      setIsConsultationModalOpen(false);
      setConsultationForm(initialConsultationForm);

      await fetchPatientsData();
    } catch (err) {
      console.error('Erro ao salvar consulta:', err.message);
      setConsultationError('Erro ao salvar consulta: ' + err.message);
    } finally {
      setSavingConsultation(false);
    }
  };

  const renderPlanContent = (conteudo) => {
    if (!conteudo) return 'Sem conteúdo.';
    if (typeof conteudo === 'string') return conteudo;
    if (conteudo.plano) return conteudo.plano;
    if (conteudo.texto) return conteudo.texto;
    if (conteudo.conteudo) return renderPlanContent(conteudo.conteudo);
    return JSON.stringify(conteudo, null, 2);
  };

  const renderBodyCompositionChart = (patient) => {
    const consultations = patient.consultas || [];
    let validConsultations = [...consultations]
      .filter(c => c.percentual_gordura)
      .map(c => ({
        date: c.data_consulta,
        fat: parseFloat(c.percentual_gordura)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (validConsultations.length === 0) {
      return (
        <div style={styles.emptyChartContainer}>
          <AlertTriangle size={32} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 12 }} />
          <p style={styles.emptyText}>Nenhuma consulta com percentual de gordura registrado</p>
        </div>
      );
    }

    const svgWidth = 650;
    const svgHeight = 250;
    const paddingX = 60;
    const paddingY = 40;

    const fats = validConsultations.map(c => c.fat);
    let minW = Math.min(...fats);
    let maxW = Math.max(...fats);
    
    if (minW === maxW) {
      minW = Math.max(0, minW - 2);
      maxW = maxW + 2;
    } else {
      const margin = (maxW - minW) * 0.15;
      minW = Math.max(0, minW - margin);
      maxW = maxW + margin;
    }

    const points = validConsultations.map((c, i) => {
      const x = paddingX + (validConsultations.length > 1 
        ? (i * (svgWidth - 2 * paddingX) / (validConsultations.length - 1))
        : (svgWidth - 2 * paddingX) / 2);
      const y = svgHeight - paddingY - ((c.fat - minW) * (svgHeight - 2 * paddingY) / (maxW - minW));
      return { x, y, date: c.date, fat: c.fat };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div style={styles.chartWrapper}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={styles.chartSvg}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (svgHeight - 2 * paddingY);
            const wLabel = (maxW - ratio * (maxW - minW)).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="11"
                  textAnchor="end"
                >
                  {wLabel}%
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, i) => (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#ef4444"
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
              <text
                x={p.x}
                y={p.y - 12}
                fill="#ef4444"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
              >
                {p.fat}%
              </text>
              <text
                x={p.x}
                y={svgHeight - 15}
                fill="hsl(var(--muted-foreground))"
                fontSize="11"
                textAnchor="middle"
              >
                {p.date.split('-').reverse().slice(0,2).join('/')}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const renderWeightChart = (patient) => {
    const consultations = patient.consultas || [];
    let validConsultations = [...consultations]
      .filter(c => c.peso)
      .map(c => ({
        date: c.data_consulta,
        weight: parseFloat(c.peso)
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Incluir o peso inicial como o primeiro ponto do gráfico se existir
    if (patient.peso_inicial) {
      validConsultations.unshift({
        date: patient.created_at ? patient.created_at.split('T')[0] : 'Início',
        weight: parseFloat(patient.peso_inicial),
        isInitial: true
      });
    }

    if (validConsultations.length === 0) {
      return (
        <div style={styles.emptyChartContainer}>
          <AlertTriangle size={32} style={{ color: 'hsl(var(--muted-foreground))', marginBottom: 12 }} />
          <p style={styles.emptyText}>Nenhuma consulta com peso registrado ainda</p>
        </div>
      );
    }

    const svgWidth = 650;
    const svgHeight = 250;
    const paddingX = 60;
    const paddingY = 40;

    const weights = validConsultations.map(c => c.weight);
    let minW = Math.min(...weights);
    let maxW = Math.max(...weights);
    
    if (minW === maxW) {
      minW = minW - 5;
      maxW = maxW + 5;
    } else {
      const margin = (maxW - minW) * 0.15;
      minW = Math.max(0, minW - margin);
      maxW = maxW + margin;
    }

    const points = validConsultations.map((c, i) => {
      const x = paddingX + (validConsultations.length > 1 
        ? (i * (svgWidth - 2 * paddingX) / (validConsultations.length - 1))
        : (svgWidth - 2 * paddingX) / 2);
      const y = svgHeight - paddingY - ((c.weight - minW) * (svgHeight - 2 * paddingY) / (maxW - minW));
      return { x, y, date: c.date, weight: c.weight, isInitial: c.isInitial };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <div style={styles.chartWrapper}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={styles.chartSvg}>
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (svgHeight - 2 * paddingY);
            const wLabel = (maxW - ratio * (maxW - minW)).toFixed(1);
            return (
              <g key={idx}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={svgWidth - paddingX}
                  y2={y}
                  stroke="hsl(var(--border))"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="11"
                  textAnchor="end"
                >
                  {wLabel} kg
                </text>
              </g>
            );
          })}

          <path
            d={linePath}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {points.map((p, idx) => (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth="2.5"
              />
              <text
                x={p.x}
                y={p.y - 12}
                fill="hsl(var(--foreground))"
                fontSize="12"
                fontWeight="500"
                textAnchor="middle"
              >
                {parseFloat(p.weight).toFixed(1)} kg
              </text>
              <text
                x={p.x}
                y={p.y + 20}
                fill="hsl(var(--muted-foreground))"
                fontSize="10"
                textAnchor="middle"
              >
                {p.isInitial ? 'Início' : new Date(p.date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  const handleEditCheckboxChange = (field, value) => {
    setEditFormData(prev => {
      let currentList = [...(prev[field] || [])];
      if (value === 'Nenhum') {
        if (currentList.includes('Nenhum')) {
          currentList = [];
        } else {
          currentList = ['Nenhum'];
        }
      } else {
        currentList = currentList.filter(item => item !== 'Nenhum');
        if (currentList.includes(value)) {
          currentList = currentList.filter(item => item !== value);
        } else {
          currentList.push(value);
        }
      }
      return { ...prev, [field]: currentList };
    });
  };

  const handleEditPhoneChange = (field, value) => {
    const rawDigits = value.replace(/\D/g, '');
    if (rawDigits.length > 11) return;
    let formatted = rawDigits;
    if (rawDigits.length > 2) {
      formatted = `(${rawDigits.slice(0, 2)}) `;
      if (rawDigits.length > 7) {
        formatted += `${rawDigits.slice(2, 7)}-${rawDigits.slice(7, 11)}`;
      } else {
        formatted += rawDigits.slice(2);
      }
    }
    setEditFormData(prev => ({ ...prev, [field]: formatted }));
  };

  const handleEditTimeBlur = (field) => {
    const rawVal = editFormData[field];
    if (!rawVal) return;
    const formatted = formatTimeInput(rawVal);
    setEditFormData(prev => ({ ...prev, [field]: formatted }));
  };

  // Fetch nutritionist profile
  useEffect(() => {
    async function getProfile() {
      try {
        const { user } = session;
        const { data, error } = await client
          .from('nutricionistas')
          .select('nome, email')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (data) setProfile(data);
      } catch (error) {
        console.error('Erro ao buscar dados do nutricionista:', error.message);
      }
    }

    getProfile();
  }, [session]);

  // Fetch patients and their consultations in real-time
  const fetchPatientsData = async () => {
    try {
      setLoading(true);
      const { data, error } = await client
        .from('pacientes')
        .select(`
          *,
          consultas (
            id,
            data_consulta,
            peso,
            cintura,
            quadril,
            percentual_gordura,
            observacoes,
            proximo_retorno
          ),
          planos_alimentares (
            id,
            conteudo,
            created_at
          )
        `)
        .eq('nutricionista_id', session.user.id);

      if (error) throw error;
      setPatients(data || []);
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsData();
  }, [session]);

  const handleLogout = async () => {
    await client.auth.signOut();
    window.location.reload();
  };

  // Helper to filter "Pacientes sem retorno"
  const getPatientsWithoutReturn = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return patients.filter((patient) => {
      // Must have at least one consultation
      if (!patient.consultas || patient.consultas.length === 0) {
        return false;
      }

      // Find the latest consultation
      const consultations = [...patient.consultas].sort(
        (a, b) => new Date(b.data_consulta) - new Date(a.data_consulta)
      );
      const latestConsultation = consultations[0];
      const latestConsultationDate = new Date(latestConsultation.data_consulta);
      latestConsultationDate.setHours(0, 0, 0, 0);

      // Check if last consultation was > 30 days ago
      const diffTime = Math.abs(today - latestConsultationDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const isMoreThan30Days = diffDays > 30;

      // Check if there is any scheduled next return in the future or today
      const hasUpcomingReturn = patient.consultas.some((c) => {
        if (!c.proximo_retorno) return false;
        const returnDate = new Date(c.proximo_retorno);
        returnDate.setHours(0, 0, 0, 0);
        return returnDate >= today;
      });

      return isMoreThan30Days && !hasUpcomingReturn;
    });
  };

  const getLatestConsultationDate = (patient) => {
    if (!patient.consultas || patient.consultas.length === 0) return 'Sem consultas';
    const sorted = [...patient.consultas].sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta));
    const dateStr = sorted[0].data_consulta;
    if (!dateStr) return '';
    return dateStr.includes('-') ? dateStr.split('-').reverse().join('/') : dateStr;
  };

  const getPatientGoal = (patient) => {
    if (patient.objetivos && patient.objetivos.length > 0) {
      return patient.objetivos.join(', ');
    }
    return patient.objetivo_texto || 'Não informado';
  };

  const renderCadastroForm = () => {
    return (
      <div style={styles.formContainer}>
        <div style={styles.formHeader}>
          <button
            onClick={() => {
              if (editingPatientId) {
                setSelectedPatientId(editingPatientId);
                setActiveTab('pacientes');
              } else {
                setActiveTab('pacientes');
              }
              setFormData(initialFormState);
              setEditingPatientId(null);
              setActiveFormTab('pessoal');
            }}
            style={styles.backButton}
          >
            <ArrowLeft size={16} style={{ marginRight: 6 }} />
            <span>{editingPatientId ? 'Voltar para o prontuário' : 'Voltar para a lista'}</span>
          </button>
          <h1 style={styles.formTitle}>{editingPatientId ? `Editar Cadastro: ${formData.nome}` : 'Cadastrar Novo Paciente'}</h1>
        </div>

        {successMessage && (
          <div style={styles.successAlert}>
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div style={styles.errorAlert}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSavePatient} className="glass-card" style={styles.formCard}>
          {/* Tab Navigation */}
          <div style={styles.formTabsBar}>
            <button
              type="button"
              onClick={() => setActiveFormTab('pessoal')}
              style={{
                ...styles.formTabLink,
                ...(activeFormTab === 'pessoal' ? styles.formTabLinkActive : {}),
              }}
            >
              1. Dados Pessoais
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('clinico')}
              style={{
                ...styles.formTabLink,
                ...(activeFormTab === 'clinico' ? styles.formTabLinkActive : {}),
              }}
            >
              2. Dados Clínicos
            </button>
            <button
              type="button"
              onClick={() => setActiveFormTab('habitos')}
              style={{
                ...styles.formTabLink,
                ...(activeFormTab === 'habitos' ? styles.formTabLinkActive : {}),
              }}
            >
              3. Hábitos & Estilo de Vida
            </button>
          </div>

          <div style={styles.formTabContent}>
            {/* TAB 1: PESSOAL */}
            {activeFormTab === 'pessoal' && (
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome completo do paciente"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Data de Nascimento</label>
                  <input
                    type="date"
                    value={formData.data_nascimento}
                    onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                    style={styles.formInput}
                  />
                  {formData.data_nascimento && (
                    <span style={styles.formHelpText}>
                      Idade: {calculateAge(formData.data_nascimento)} anos
                    </span>
                  )}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Sexo</label>
                  <select
                    value={formData.sexo}
                    onChange={(e) => setFormData({ ...formData, sexo: e.target.value })}
                    style={styles.formInput}
                  >
                    <option value="">Selecione...</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Telefone</label>
                  <input
                    type="text"
                    placeholder="(99) 9999-9999"
                    value={formData.telefone}
                    onChange={(e) => handlePhoneChange('telefone', e.target.value)}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(99) 99999-9999"
                    value={formData.whatsapp}
                    onChange={(e) => handlePhoneChange('whatsapp', e.target.value)}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>E-mail</label>
                  <input
                    type="email"
                    placeholder="exemplo@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={styles.formInput}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: CLINICO */}
            {activeFormTab === 'clinico' && (
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Peso Atual (kg)</label>
                  <div style={styles.inputWithSuffix}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={formData.peso_inicial}
                      onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
                      style={styles.formInputSuffix}
                    />
                    <span style={styles.inputSuffix}>kg</span>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Altura (cm)</label>
                  <div style={styles.inputWithSuffix}>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData.altura}
                      onChange={(e) => setFormData({ ...formData, altura: e.target.value })}
                      style={styles.formInputSuffix}
                    />
                    <span style={styles.inputSuffix}>cm</span>
                  </div>
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>IMC (Índice de Massa Corporal)</label>
                  <input
                    type="text"
                    readOnly
                    value={
                      formData.peso_inicial && formData.altura
                        ? (parseFloat(formData.peso_inicial) / Math.pow(parseFloat(formData.altura) / 100, 2)).toFixed(1)
                        : 'Preencha peso e altura para calcular'
                    }
                    style={{ ...styles.formInput, backgroundColor: 'rgba(var(--muted), 0.1)', cursor: 'not-allowed' }}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Objetivo do Paciente (Múltipla escolha)</label>
                  <div style={styles.checkboxGrid}>
                    {['Emagrecer', 'Ganhar massa', 'Controlar diabetes', 'Saúde geral', 'Performance esportiva', 'Reeducação alimentar'].map((obj) => (
                      <label key={obj} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.objetivos.includes(obj)}
                          onChange={() => handleCheckboxChange('objetivos', obj)}
                          style={styles.checkboxInput}
                        />
                        <span>{obj}</span>
                      </label>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Outro objetivo ou observação adicional"
                    value={formData.objetivo_texto}
                    onChange={(e) => setFormData({ ...formData, objetivo_texto: e.target.value })}
                    style={{ ...styles.formInput, marginTop: 12 }}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Nível de Atividade Física</label>
                  <select
                    value={formData.nivel_atividade}
                    onChange={(e) => setFormData({ ...formData, nivel_atividade: e.target.value })}
                    style={styles.formInput}
                  >
                    <option value="">Selecione...</option>
                    <option value="Sedentário">Sedentário (pouco ou nenhum exercício)</option>
                    <option value="Levemente ativo">Levemente ativo (exercício leve 1-3 dias/semana)</option>
                    <option value="Moderadamente ativo">Moderadamente ativo (exercício moderado 3-5 dias/semana)</option>
                    <option value="Muito ativo">Muito ativo (exercício pesado 6-7 dias/semana)</option>
                    <option value="Extremamente ativo">Extremamente ativo (trabalho físico pesado ou treino intenso diário)</option>
                  </select>
                </div>

                {/* Patologias */}
                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Patologias ou condições de saúde</label>
                  <div style={styles.checkboxGrid}>
                    {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto'].map((pat) => (
                      <label key={pat} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.patologias.includes(pat)}
                          onChange={() => handleCheckboxChange('patologias', pat)}
                          style={styles.checkboxInput}
                        />
                        <span>{pat}</span>
                      </label>
                    ))}
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.patologias.includes('Nenhum')}
                        onChange={() => handleCheckboxChange('patologias', 'Nenhum')}
                        style={styles.checkboxInput}
                      />
                      <strong>Nenhum</strong>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Outra patologia ou condição adicional"
                    value={formData.patologias_outro}
                    onChange={(e) => setFormData({ ...formData, patologias_outro: e.target.value })}
                    style={{ ...styles.formInput, marginTop: 12 }}
                  />
                </div>

                {/* Restricoes */}
                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Restrições Alimentares</label>
                  <div style={styles.checkboxGrid}>
                    {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar'].map((rest) => (
                      <label key={rest} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.restricoes_alimentares.includes(rest)}
                          onChange={() => handleCheckboxChange('restricoes_alimentares', rest)}
                          style={styles.checkboxInput}
                        />
                        <span>{rest}</span>
                      </label>
                    ))}
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.restricoes_alimentares.includes('Nenhum')}
                        onChange={() => handleCheckboxChange('restricoes_alimentares', 'Nenhum')}
                        style={styles.checkboxInput}
                      />
                      <strong>Nenhum</strong>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Outra restrição alimentar adicional"
                    value={formData.restricoes_outro}
                    onChange={(e) => setFormData({ ...formData, restricoes_outro: e.target.value })}
                    style={{ ...styles.formInput, marginTop: 12 }}
                  />
                </div>

                {/* Alergias */}
                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Alergias Alimentares</label>
                  <div style={styles.checkboxGrid}>
                    {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar'].map((alerg) => (
                      <label key={alerg} style={styles.checkboxLabel}>
                        <input
                          type="checkbox"
                          checked={formData.alergias.includes(alerg)}
                          onChange={() => handleCheckboxChange('alergias', alerg)}
                          style={styles.checkboxInput}
                        />
                        <span>{alerg}</span>
                      </label>
                    ))}
                    <label style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={formData.alergias.includes('Nenhum')}
                        onChange={() => handleCheckboxChange('alergias', 'Nenhum')}
                        style={styles.checkboxInput}
                      />
                      <strong>Nenhum</strong>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Outra alergia alimentar adicional"
                    value={formData.alergias_outro}
                    onChange={(e) => setFormData({ ...formData, alergias_outro: e.target.value })}
                    style={{ ...styles.formInput, marginTop: 12 }}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Medicamentos Contínuos</label>
                  <textarea
                    placeholder="Descreva medicamentos de uso contínuo, se houver"
                    value={formData.medicamentos}
                    onChange={(e) => setFormData({ ...formData, medicamentos: e.target.value })}
                    style={styles.formTextarea}
                  />
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Suplementos em Uso</label>
                  <textarea
                    placeholder="Descreva suplementos utilizados atualmente, se houver"
                    value={formData.suplementos}
                    onChange={(e) => setFormData({ ...formData, suplementos: e.target.value })}
                    style={styles.formTextarea}
                  />
                </div>
              </div>
            )}

            {/* TAB 3: HABITOS */}
            {activeFormTab === 'habitos' && (
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Número de refeições por dia</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ex: 5"
                    value={formData.refeicoes_por_dia}
                    onChange={(e) => setFormData({ ...formData, refeicoes_por_dia: e.target.value })}
                    style={styles.formInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Quantidade de água por dia</label>
                  <div style={styles.inputWithSuffix}>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 3.5"
                      value={formData.litros_agua}
                      onChange={(e) => setFormData({ ...formData, litros_agua: e.target.value })}
                      style={styles.formInputSuffix}
                    />
                    <span style={styles.inputSuffix}>litros</span>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Horário que acorda</label>
                  <input
                    type="text"
                    placeholder="Ex: 6 ou 06:30"
                    value={formData.horario_acorda}
                    onChange={(e) => setFormData({ ...formData, horario_acorda: e.target.value })}
                    onBlur={() => handleTimeBlur('horario_acorda')}
                    style={styles.formInput}
                  />
                  <span style={styles.formHelpText}>Digite e saia do campo para formatar</span>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Horário que dorme</label>
                  <input
                    type="text"
                    placeholder="Ex: 23 ou 22:30"
                    value={formData.horario_dorme}
                    onChange={(e) => setFormData({ ...formData, horario_dorme: e.target.value })}
                    onBlur={() => handleTimeBlur('horario_dorme')}
                    style={styles.formInput}
                  />
                  <span style={styles.formHelpText}>Digite e saia do campo para formatar</span>
                </div>

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Pratica atividade física?</label>
                  <select
                    value={formData.atividade_fisica ? 'Sim' : 'Não'}
                    onChange={(e) => setFormData({ ...formData, atividade_fisica: e.target.value === 'Sim' })}
                    style={styles.formInput}
                  >
                    <option value="Não">Não</option>
                    <option value="Sim">Sim</option>
                  </select>
                </div>

                {formData.atividade_fisica && (
                  <div style={styles.formGroupFull}>
                    <label style={styles.formLabel}>Qual atividade e frequência semanal?</label>
                    <input
                      type="text"
                      placeholder="Ex: Musculação, 5x na semana"
                      value={formData.atividade_fisica_descricao}
                      onChange={(e) => setFormData({ ...formData, atividade_fisica_descricao: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>
                )}

                <div style={styles.formGroupFull}>
                  <label style={styles.formLabel}>Observações Gerais</label>
                  <textarea
                    placeholder="Observações complementares sobre a rotina e hábitos do paciente"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    style={styles.formTextarea}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div style={styles.formActions}>
            <button
              type="button"
              onClick={() => {
                if (editingPatientId) {
                  setSelectedPatientId(editingPatientId);
                  setActiveTab('pacientes');
                } else {
                  setActiveTab('pacientes');
                }
                setFormData(initialFormState);
                setEditingPatientId(null);
                setActiveFormTab('pessoal');
              }}
              style={styles.cancelButton}
            >
              Cancelar
            </button>
 
            <div style={styles.wizardNav}>
              {activeFormTab === 'clinico' && (
                <button type="button" onClick={() => setActiveFormTab('pessoal')} style={styles.prevTabButton}>
                  &larr; Voltar
                </button>
              )}
              {activeFormTab === 'habitos' && (
                <button type="button" onClick={() => setActiveFormTab('clinico')} style={styles.prevTabButton}>
                  &larr; Voltar
                </button>
              )}
              {activeFormTab !== 'habitos' ? (
                <button
                  key="btn-next"
                  type="button"
                  onClick={() => {
                    if (activeFormTab === 'pessoal') setActiveFormTab('clinico');
                    else if (activeFormTab === 'clinico') setActiveFormTab('habitos');
                  }}
                  style={styles.nextTabButton}
                >
                  Avançar &rarr;
                </button>
              ) : (
                <button key="btn-submit" type="submit" disabled={savingPatient} style={styles.submitButton}>
                  {savingPatient ? 'Salvando...' : editingPatientId ? 'Salvar Alterações' : 'Salvar Paciente'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    );
  };

  const patientsWithoutReturn = getPatientsWithoutReturn();
  const selectedPatient = patients.find((p) => p.id === selectedPatientId);

  return (
    <div style={styles.container}>
      {/* Sidebar - Menu Lateral Fixo */}
      <aside className="glass-card" style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <span style={styles.logoText}>Feriani Nutri</span>
        </div>

        <nav style={styles.sidebarNav}>
          <button
            onClick={() => { setActiveTab('inicio'); setSelectedPatientId(null); }}
            style={{
              ...styles.navItem,
              ...(activeTab === 'inicio' ? styles.navItemActive : {}),
            }}
          >
            <LayoutDashboard size={20} style={styles.navIcon} />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => { setActiveTab('pacientes'); setSelectedPatientId(null); }}
            style={{
              ...styles.navItem,
              ...((activeTab === 'pacientes' || activeTab === 'cadastro') ? styles.navItemActive : {}),
            }}
          >
            <Users size={20} style={styles.navIcon} />
            <span>Pacientes</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={{ ...styles.userInfo, marginBottom: '8px', padding: '0 8px' }}>
            <div style={styles.userAvatar}>
              {(profile?.nome || 'N').charAt(0).toUpperCase()}
            </div>
            <div style={styles.userDetailsSidebar}>
              <span style={styles.userName}>{profile?.nome || 'Nutricionista'}</span>
              <span style={styles.userEmail}>{session.user.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button onClick={toggleTheme} style={styles.navItem} title="Alternar tema">
              {theme === 'dark' ? <Sun size={20} style={styles.navIcon} /> : <Moon size={20} style={styles.navIcon} />}
              <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </button>
            <button onClick={handleLogout} style={{ ...styles.navItem, color: 'hsl(var(--error))' }} title="Sair da conta">
              <LogOut size={20} style={styles.navIcon} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.mainContent}>
        {/* Render Patient Detail View if Selected */}
        {selectedPatient ? (
<div style={styles.detailContainer}>
            <button
              onClick={() => setSelectedPatientId(null)}
              style={styles.backButton}
            >
              <ArrowLeft size={16} style={{ marginRight: 6 }} />
              <span>Voltar para o painel</span>
            </button>

            <div style={styles.profileSectionTabs}>
              <button
                type="button"
                onClick={() => { setProfileSection('dados'); setSelectedPlanId(null); }}
                style={{
                  ...styles.profileSectionTab,
                  ...(profileSection === 'dados' ? styles.profileSectionTabActive : {}),
                }}
              >
                Dados do Paciente
              </button>
              <button
                type="button"
                onClick={() => { setProfileSection('consultas'); setSelectedPlanId(null); }}
                style={{
                  ...styles.profileSectionTab,
                  ...(profileSection === 'consultas' ? styles.profileSectionTabActive : {}),
                }}
              >
                Consultas
              </button>
              <button
                type="button"
                onClick={() => { setProfileSection('planos'); setSelectedPlanId(null); }}
                style={{
                  ...styles.profileSectionTab,
                  ...(profileSection === 'planos' ? styles.profileSectionTabActive : {}),
                }}
              >
                Planos Alimentares
              </button>
            </div>

            {profileSection === 'dados' && editFormData && (
              <form onSubmit={handleSaveEdit} className="glass-card" style={styles.patientProfileCard}>
                <div style={styles.profileHeader}>
                  <div style={styles.profileAvatar}>
                    {selectedPatient.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h1 style={styles.patientName}>{selectedPatient.nome}</h1>
                    <span style={styles.patientMeta}>Visualizando e editando prontuário</span>
                  </div>
                </div>

                {editSuccessMessage && (
                  <div style={styles.successAlert}>
                    {editSuccessMessage}
                  </div>
                )}
                {editErrorMessage && (
                  <div style={styles.errorAlert}>
                    {editErrorMessage}
                  </div>
                )}

                {/* Internal tabs for edit mode */}
                <div style={styles.formTabsBar}>
                  <button
                    type="button"
                    onClick={() => setProfileActiveFormTab('pessoal')}
                    style={{
                      ...styles.formTabLink,
                      ...(profileActiveFormTab === 'pessoal' ? styles.formTabLinkActive : {}),
                    }}
                  >
                    1. Dados Pessoais
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveFormTab('clinico')}
                    style={{
                      ...styles.formTabLink,
                      ...(profileActiveFormTab === 'clinico' ? styles.formTabLinkActive : {}),
                    }}
                  >
                    2. Dados Clínicos
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileActiveFormTab('habitos')}
                    style={{
                      ...styles.formTabLink,
                      ...(profileActiveFormTab === 'habitos' ? styles.formTabLinkActive : {}),
                    }}
                  >
                    3. Hábitos e Rotina
                  </button>
                </div>

                {/* Tab 1: Pessoal */}
                {profileActiveFormTab === 'pessoal' && (
                  <div style={styles.formTabContent}>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nome Completo *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: João da Silva"
                          value={editFormData.nome}
                          onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>E-mail</label>
                        <input
                          type="email"
                          placeholder="Ex: joao@exemplo.com"
                          value={editFormData.email}
                          onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>WhatsApp/Telefone *</label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: (11) 99999-9999"
                          value={editFormData.whatsapp}
                          onChange={(e) => handleEditPhoneChange('whatsapp', e.target.value)}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Data de Nascimento</label>
                        <input
                          type="date"
                          value={editFormData.data_nascimento}
                          onChange={(e) => setEditFormData({ ...editFormData, data_nascimento: e.target.value })}
                          style={styles.formInput}
                        />
                        {editFormData.data_nascimento && (
                          <span style={styles.formHelpText}>
                            Idade: {calculateAge(editFormData.data_nascimento)} anos
                          </span>
                        )}
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Sexo</label>
                        <select
                          value={editFormData.sexo}
                          onChange={(e) => setEditFormData({ ...editFormData, sexo: e.target.value })}
                          style={styles.formInput}
                        >
                          <option value="">Selecione...</option>
                          <option value="Masculino">Masculino</option>
                          <option value="Feminino">Feminino</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: Clínico */}
                {profileActiveFormTab === 'clinico' && (
                  <div style={styles.formTabContent}>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Peso Inicial (kg)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 75.5"
                          value={editFormData.peso_inicial}
                          onChange={(e) => setEditFormData({ ...editFormData, peso_inicial: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Altura (cm)</label>
                        <input
                          type="number"
                          placeholder="Ex: 175"
                          value={editFormData.altura}
                          onChange={(e) => setEditFormData({ ...editFormData, altura: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>IMC Inicial (Calculado)</label>
                        <div style={styles.inputWithSuffix}>
                          <input
                            type="text"
                            readOnly
                            value={
                              editFormData.peso_inicial && editFormData.altura
                                ? (parseFloat(editFormData.peso_inicial) / Math.pow(parseFloat(editFormData.altura) / 100, 2)).toFixed(1)
                                : ''
                            }
                            style={styles.formInputSuffix}
                            placeholder="Peso e altura necessários"
                          />
                          <span style={styles.inputSuffix}>
                            {editFormData.peso_inicial && editFormData.altura
                              ? getIMCCategory(parseFloat(editFormData.peso_inicial) / Math.pow(parseFloat(editFormData.altura) / 100, 2))
                              : ''}
                          </span>
                        </div>
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Nível de Atividade Física</label>
                        <select
                          value={editFormData.nivel_atividade}
                          onChange={(e) => setEditFormData({ ...editFormData, nivel_atividade: e.target.value })}
                          style={styles.formInput}
                        >
                          <option value="">Selecione...</option>
                          <option value="Sedentário">Sedentário</option>
                          <option value="Levemente Ativo">Levemente Ativo</option>
                          <option value="Moderadamente Ativo">Moderadamente Ativo</option>
                          <option value="Altamente Ativo">Altamente Ativo</option>
                          <option value="Extremamente Ativo">Extremamente Ativo</option>
                        </select>
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Objetivos Nutricionais</label>
                        <div style={styles.checkboxGrid}>
                          {['Emagrecer', 'Ganhar Massa Magra', 'Melhorar Disposição', 'Tratar Patologia', 'Performance Esportiva', 'Reeducação Alimentar'].map((obj) => (
                            <label key={obj} style={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={editFormData.objetivos.includes(obj)}
                                onChange={() => {
                                  const current = [...editFormData.objetivos];
                                  if (current.includes(obj)) {
                                    setEditFormData({ ...editFormData, objetivos: current.filter(x => x !== obj) });
                                  } else {
                                    setEditFormData({ ...editFormData, objetivos: [...current, obj] });
                                  }
                                }}
                                style={styles.checkboxInput}
                              />
                              {obj}
                            </label>
                          ))}
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <label style={styles.formLabel}>Outros detalhes do objetivo</label>
                          <input
                            type="text"
                            placeholder="Digite mais informações se necessário..."
                            value={editFormData.objetivo_texto}
                            onChange={(e) => setEditFormData({ ...editFormData, objetivo_texto: e.target.value })}
                            style={styles.formInput}
                          />
                        </div>
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Patologias conhecidas</label>
                        <div style={styles.checkboxGrid}>
                          {['Diabetes', 'Hipertensão', 'Hipotireoidismo', 'Hipertireoidismo', 'Síndrome do ovário policístico', 'Doença celíaca', 'Colesterol alto', 'Nenhum'].map((pat) => (
                            <label key={pat} style={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={editFormData.patologias.includes(pat)}
                                onChange={() => handleEditCheckboxChange('patologias', pat)}
                                style={styles.checkboxInput}
                              />
                              {pat}
                            </label>
                          ))}
                        </div>
                        {!editFormData.patologias.includes('Nenhum') && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={styles.formLabel}>Outra patologia não listada (separe por vírgula)</label>
                            <input
                              type="text"
                              placeholder="Ex: Gastrite, Refluxo..."
                              value={editFormData.patologias_outro}
                              onChange={(e) => setEditFormData({ ...editFormData, patologias_outro: e.target.value })}
                              style={styles.formInput}
                            />
                          </div>
                        )}
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Restrições alimentares</label>
                        <div style={styles.checkboxGrid}>
                          {['Lactose', 'Glúten', 'Açúcar', 'Carne vermelha', 'Frutos do mar', 'Nenhum'].map((rest) => (
                            <label key={rest} style={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={editFormData.restricoes_alimentares.includes(rest)}
                                onChange={() => handleEditCheckboxChange('restricoes_alimentares', rest)}
                                style={styles.checkboxInput}
                              />
                              {rest}
                            </label>
                          ))}
                        </div>
                        {!editFormData.restricoes_alimentares.includes('Nenhum') && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={styles.formLabel}>Outra restrição não listada (separe por vírgula)</label>
                            <input
                              type="text"
                              placeholder="Ex: Ovo, Aves..."
                              value={editFormData.restricoes_outro}
                              onChange={(e) => setEditFormData({ ...editFormData, restricoes_outro: e.target.value })}
                              style={styles.formInput}
                            />
                          </div>
                        )}
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Alergias conhecidas</label>
                        <div style={styles.checkboxGrid}>
                          {['Amendoim', 'Leite', 'Ovo', 'Soja', 'Trigo', 'Frutos do mar', 'Nenhum'].map((alerg) => (
                            <label key={alerg} style={styles.checkboxLabel}>
                              <input
                                type="checkbox"
                                checked={editFormData.alergias.includes(alerg)}
                                onChange={() => handleEditCheckboxChange('alergias', alerg)}
                                style={styles.checkboxInput}
                              />
                              {alerg}
                            </label>
                          ))}
                        </div>
                        {!editFormData.alergias.includes('Nenhum') && (
                          <div style={{ marginTop: '12px' }}>
                            <label style={styles.formLabel}>Outra alergia não listada (separe por vírgula)</label>
                            <input
                              type="text"
                              placeholder="Ex: Corante amarelo, Nozes..."
                              value={editFormData.alergias_outro}
                              onChange={(e) => setEditFormData({ ...editFormData, alergias_outro: e.target.value })}
                              style={styles.formInput}
                            />
                          </div>
                        )}
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Medicamentos de uso contínuo</label>
                        <textarea
                          placeholder="Ex: Puran T4 50mcg pela manhã..."
                          value={editFormData.medicamentos}
                          onChange={(e) => setEditFormData({ ...editFormData, medicamentos: e.target.value })}
                          style={styles.formTextarea}
                        />
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Suplementação atual</label>
                        <textarea
                          placeholder="Ex: Creatina 5g ao dia, Whey protein pós-treino..."
                          value={editFormData.suplementos}
                          onChange={(e) => setEditFormData({ ...editFormData, suplementos: e.target.value })}
                          style={styles.formTextarea}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 3: Hábitos */}
                {profileActiveFormTab === 'habitos' && (
                  <div style={styles.formTabContent}>
                    <div style={styles.formGrid}>
                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Refeições por dia</label>
                        <input
                          type="number"
                          placeholder="Ex: 4"
                          value={editFormData.refeicoes_por_dia}
                          onChange={(e) => setEditFormData({ ...editFormData, refeicoes_por_dia: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Água por dia (litros)</label>
                        <input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 2.5"
                          value={editFormData.litros_agua}
                          onChange={(e) => setEditFormData({ ...editFormData, litros_agua: e.target.value })}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Horário que acorda</label>
                        <input
                          type="text"
                          placeholder="Ex: 06:00"
                          value={editFormData.horario_acorda}
                          onChange={(e) => setEditFormData({ ...editFormData, horario_acorda: e.target.value })}
                          onBlur={() => handleEditTimeBlur('horario_acorda')}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroup}>
                        <label style={styles.formLabel}>Horário que dorme</label>
                        <input
                          type="text"
                          placeholder="Ex: 22:30"
                          value={editFormData.horario_dorme}
                          onChange={(e) => setEditFormData({ ...editFormData, horario_dorme: e.target.value })}
                          onBlur={() => handleEditTimeBlur('horario_dorme')}
                          style={styles.formInput}
                        />
                      </div>

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Pratica atividade física?</label>
                        <select
                          value={editFormData.atividade_fisica ? 'Sim' : 'Não'}
                          onChange={(e) => setEditFormData({ ...editFormData, atividade_fisica: e.target.value === 'Sim' })}
                          style={styles.formInput}
                        >
                          <option value="Não">Não</option>
                          <option value="Sim">Sim</option>
                        </select>
                      </div>

                      {editFormData.atividade_fisica && (
                        <div style={styles.formGroupFull}>
                          <label style={styles.formLabel}>Frequência e tipo de atividade física</label>
                          <input
                            type="text"
                            placeholder="Ex: Musculação 5x na semana, Corrida aos sábados..."
                            value={editFormData.atividade_fisica_descricao}
                            onChange={(e) => setEditFormData({ ...editFormData, atividade_fisica_descricao: e.target.value })}
                            style={styles.formInput}
                          />
                        </div>
                      )}

                      <div style={styles.formGroupFull}>
                        <label style={styles.formLabel}>Observações Gerais</label>
                        <textarea
                          placeholder="Informações sobre sono, rotina de trabalho, estresse ou observações nutricionais adicionais..."
                          value={editFormData.observacoes}
                          onChange={(e) => setEditFormData({ ...editFormData, observacoes: e.target.value })}
                          style={styles.formTextarea}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ ...styles.formActions, marginTop: '24px' }}>
                  <button type="submit" disabled={savingEdit} style={styles.submitButton}>
                    {savingEdit ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            )}

            {profileSection === 'consultas' && (
              <div style={styles.sectionContainer}>
                {/* Weight Chart Card */}
                <div className="glass-card" style={{ ...styles.consultationsCard, marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', width: '100%' }}>
                     <div style={{ width: '100%' }}>
                       <h4 style={styles.cardTitle}>Evolução de Peso</h4>
                       {renderWeightChart(selectedPatient)}
                     </div>
                     <div style={{ width: '100%' }}>
                       <h4 style={styles.cardTitle}>Composição Corporal (% Gordura)</h4>
                       {renderBodyCompositionChart(selectedPatient)}
                     </div>
                  </div>
                </div>

                {/* Consultations List Card */}
                <div className="glass-card" style={styles.consultationsCard}>
                  <div style={styles.listHeader}>
                    <h2 style={styles.cardTitle}>Histórico de Consultas</h2>
                    <button
                      onClick={() => {
                        setEditingConsultationId(null);
                        setConsultationForm(initialConsultationForm);
                        setIsConsultationModalOpen(true);
                      }}
                      style={styles.newPatientButton}
                    >
                      Nova Consulta
                    </button>
                  </div>

                  {selectedPatient.consultas && selectedPatient.consultas.length > 0 ? (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Peso (kg)</th>
                            <th>Cintura (cm)</th>
                            <th>Quadril (cm)</th>
                            <th>% Gordura</th>
                            <th>Observações</th>
                            <th>Próximo Retorno</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...selectedPatient.consultas]
                            .sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta))
                            .map((c) => (
                              <tr 
                                key={c.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                  setEditingConsultationId(c.id);
                                  setConsultationForm({
                                    data_consulta: c.data_consulta || new Date().toISOString().split('T')[0],
                                    peso: c.peso || '',
                                    massa_gorda: c.massa_gorda || '',
                                    cintura: c.cintura || '',
                                    quadril: c.quadril || '',
                                    percentual_gordura: c.percentual_gordura || '',
                                    observacoes: c.observacoes || '',
                                    proximo_retorno: c.proximo_retorno || '',
                                  });
                                  setIsConsultationModalOpen(true);
                                }}
                                title="Clique para editar esta consulta"
                                className="patientListItemLink"
                              >
                                <td>{new Date(c.data_consulta + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                                <td>{c.peso ? `${c.peso} kg` : '-'}</td>
                                <td>{c.cintura ? `${c.cintura} cm` : '-'}</td>
                                <td>{c.quadril ? `${c.quadril} cm` : '-'}</td>
                                <td>{c.percentual_gordura ? `${c.percentual_gordura}%` : '-'}</td>
                                <td style={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.observacoes}>
                                  {c.observacoes || '-'}
                                </td>
                                <td>
                                  {c.proximo_retorno 
                                    ? new Date(c.proximo_retorno + 'T00:00:00').toLocaleDateString('pt-BR') 
                                    : 'Não agendado'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={styles.emptyText}>Nenhuma consulta registrada para este paciente.</p>
                  )}
                </div>
              </div>
            )}

            {profileSection === 'planos' && (
              <div style={styles.sectionContainer}>
                <GeradorPlanoAlimentar 
                   pacienteId={selectedPatient.id} 
                   pacienteDados={selectedPatient} 
                   theme={theme} 
                />
              </div>
            )}
          </div>
        ) : activeTab === 'inicio' ? (
          <div style={styles.dashboardContainer}>
            <header className="glass-card" style={styles.welcomeCard}>
              <div style={styles.welcomeHeader}>
                <Sparkles size={32} style={{ color: 'hsl(var(--primary))' }} />
                <h1 style={styles.welcomeTitle}>
                  Olá, {loading ? 'Carregando...' : profile?.nome || 'Nutricionista'}!
                </h1>
              </div>
              <p style={styles.welcomeSubtitle}>
                Acompanhe o status e agendamentos de seus pacientes em tempo real.
              </p>
            </header>

            {/* Stats row */}
            <section style={styles.statsRow}>
              <div className="glass-card" style={styles.statCard}>
                <h3>Total de Pacientes</h3>
                <p style={styles.statValue}>{patients.length}</p>
                <span>Pacientes cadastrados</span>
              </div>
              <div className="glass-card" style={styles.statCard}>
                <h3>Sem Retorno Agendado</h3>
                <p style={styles.statValue}>{patientsWithoutReturn.length}</p>
                <span>Atenção necessária</span>
              </div>
            </section>

            {/* Pacientes sem Retorno Card */}
            <section className="glass-card" style={styles.warningCard}>
              <div style={styles.cardHeader}>
                <AlertTriangle size={24} style={{ color: 'hsl(var(--error))', marginRight: 10 }} />
                <h2 style={styles.cardTitle}>Pacientes sem retorno</h2>
              </div>
              <p style={styles.cardSubtitle}>
                Lista de pacientes cuja última consulta foi há mais de 30 dias e não possuem retorno agendado.
              </p>

              {loading ? (
                <p style={styles.emptyText}>Buscando dados no Supabase...</p>
              ) : patientsWithoutReturn.length > 0 ? (
                <div style={styles.patientList}>
                  {patientsWithoutReturn.map((patient) => {
                    // Find latest consultation date
                    const latest = [...patient.consultas].sort(
                      (a, b) => new Date(b.data_consulta) - new Date(a.data_consulta)
                    )[0];

                    return (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        style={styles.patientListItemLink}
                      >
                        <div style={styles.patientListItemInfo}>
                          <span style={styles.patientItemName}>{patient.nome}</span>
                          <span style={styles.patientItemSub}>
                            Última consulta: {latest.data_consulta}
                          </span>
                        </div>
                        <span style={styles.viewLink}>Ver Perfil &rarr;</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyContainer}>
                  <p style={styles.emptyText}>Nenhum paciente sem retorno no momento</p>
                </div>
              )}
            </section>
          </div>
        ) : activeTab === 'cadastro' ? (
          /* Cadastro de Paciente Tab */
          renderCadastroForm()
        ) : (
          /* Pacientes Tab */
          <div style={styles.patientsTabContainer}>
            <div className="glass-card" style={styles.tableCard}>
              <div style={styles.listHeader}>
                <h2 style={styles.cardTitle}>Lista Geral de Pacientes</h2>
                <button
                  onClick={() => {
                    setFormData(initialFormState);
                    setActiveFormTab('pessoal');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setActiveTab('cadastro');
                  }}
                  style={styles.newPatientButton}
                >
                  Novo Paciente
                </button>
              </div>
              
              {(() => {
                 const getIsActive = (patient) => {
                    if (!patient.consultas || patient.consultas.length === 0) return true;
                    const today = new Date(); today.setHours(0, 0, 0, 0);
                    const validConsultations = patient.consultas.filter(c => c && c.data_consulta);
                    if (validConsultations.length === 0) return true;
                    const latestConsultation = [...validConsultations].sort((a, b) => new Date(b.data_consulta) - new Date(a.data_consulta))[0];
                    const diffDays = Math.ceil(Math.abs(today - new Date(latestConsultation.data_consulta)) / (1000 * 60 * 60 * 24));
                    const hasUpcomingReturn = patient.consultas.some((c) => {
                       if (!c || !c.proximo_retorno) return false;
                       const rDate = new Date(c.proximo_retorno); rDate.setHours(0,0,0,0);
                       return rDate >= today;
                    });
                    return diffDays <= 60 || hasUpcomingReturn;
                 };

                 const processedPatients = patients
                    .filter(p => p.nome && p.nome.toLowerCase().includes(searchTerm.toLowerCase()))
                    .filter(p => filterStatus === 'todos' ? true : filterStatus === 'ativos' ? getIsActive(p) : !getIsActive(p))
                    .filter(p => {
                       if (filterGoal === 'todos') return true;
                       const goal = getPatientGoal(p);
                       return goal && goal.toLowerCase().includes(filterGoal.toLowerCase());
                    });

                 return (
                   <>
              {patients.length > 0 && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                     <div style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        <h4 style={{ margin: 0, color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>Pacientes Ativos</h4>
                        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#10b981' }}>{patients.filter(getIsActive).length}</p>
                     </div>
                     <div style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        <h4 style={{ margin: 0, color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>Retornos em 7 Dias</h4>
                        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                           {patients.filter(p => p.consultas?.some(c => {
                              if(!c || !c.proximo_retorno) return false;
                              const retDate = new Date(c.proximo_retorno);
                              const today = new Date(); today.setHours(0,0,0,0);
                              const in7Days = new Date(today); in7Days.setDate(today.getDate() + 7);
                              return retDate >= today && retDate <= in7Days;
                           })).length}
                        </p>
                     </div>
                     <div style={{ backgroundColor: theme === 'dark' ? '#374151' : '#f3f4f6', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                        <h4 style={{ margin: 0, color: theme === 'dark' ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>Pacientes Inativos</h4>
                        <p style={{ margin: '8px 0 0 0', fontSize: '1.5rem', fontWeight: 'bold', color: '#ef4444' }}>{patients.filter(p => !getIsActive(p)).length}</p>
                     </div>
                  </div>

                  <div style={{ ...styles.searchBarContainer, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="text"
                      placeholder="Buscar paciente por nome..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ ...styles.searchInput, flex: '1 1 250px' }}
                    />
                    <select 
                      value={filterStatus} 
                      onChange={(e) => setFilterStatus(e.target.value)}
                      style={{ ...styles.searchInput, flex: '0 0 auto', width: 'auto' }}
                    >
                      <option value="todos">Status: Todos</option>
                      <option value="ativos">Status: Ativos</option>
                      <option value="inativos">Status: Inativos</option>
                    </select>
                    <select 
                      value={filterGoal} 
                      onChange={(e) => setFilterGoal(e.target.value)}
                      style={{ ...styles.searchInput, flex: '0 0 auto', width: 'auto' }}
                    >
                      <option value="todos">Objetivo: Todos</option>
                      <option value="emagrecimento">Emagrecimento</option>
                      <option value="hipertrofia">Hipertrofia</option>
                      <option value="saude">Saúde / Qualidade de Vida</option>
                    </select>
                  </div>
                </>
              )}

              {loading ? (
                <p style={styles.emptyText}>Buscando dados no Supabase...</p>
              ) : patients.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <p style={styles.emptyText}>Nenhum paciente cadastrado ainda</p>
                </div>
              ) : processedPatients.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <p style={styles.emptyText}>Nenhum paciente encontrado para os filtros atuais</p>
                </div>
              ) : (
                <div style={styles.patientGridList}>
                  {processedPatients
                    .map((patient) => (
                      <div
                        key={patient.id}
                        onClick={() => setSelectedPatientId(patient.id)}
                        style={styles.patientCardItem}
                      >
                        <div style={styles.cardItemAvatar}>
                          {patient.nome.charAt(0).toUpperCase()}
                        </div>
                        <h4 style={styles.cardItemName}>{patient.nome}</h4>
                        <p style={styles.cardItemGoal}>
                          <strong>Objetivo:</strong> {getPatientGoal(patient)}
                        </p>
                        <p style={styles.cardItemLastConsultation}>
                          <strong>Última consulta:</strong> {getLatestConsultationDate(patient)}
                        </p>
                        <span style={{ ...styles.cardItemLink, marginTop: 'auto', paddingTop: '12px' }}>
                          Abrir prontuário &rarr;
                        </span>
                      </div>
                    ))}
                </div>
              )}
              </>
              )
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Modal Nova Consulta (Prompt 5) */}
      {isConsultationModalOpen && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingConsultationId ? 'Editar Consulta' : 'Registrar Nova Consulta'}
              </h2>
              <button
                type="button"
                onClick={() => setIsConsultationModalOpen(false)}
                style={styles.modalCloseBtn}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveConsultation}>
              <div style={styles.modalBody}>
                {consultationError && (
                  <div style={{ ...styles.errorAlert, marginBottom: '16px' }}>
                    {consultationError}
                  </div>
                )}

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Data da Consulta *</label>
                    <input
                      type="date"
                      required
                      value={consultationForm.data_consulta}
                      onChange={(e) => setConsultationForm({ ...consultationForm, data_consulta: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Peso (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Ex: 73.2"
                      value={consultationForm.peso}
                      onChange={(e) => {
                        const newPeso = e.target.value;
                        let newPercentual = consultationForm.percentual_gordura;
                        if (consultationForm.massa_gorda && newPeso && parseFloat(newPeso) > 0) {
                           newPercentual = ((parseFloat(consultationForm.massa_gorda) / parseFloat(newPeso)) * 100).toFixed(1);
                        }
                        setConsultationForm({ ...consultationForm, peso: newPeso, percentual_gordura: newPercentual });
                      }}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Massa Gorda (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Opcional para autocalcular %"
                      value={consultationForm.massa_gorda}
                      onChange={(e) => {
                        const newMassa = e.target.value;
                        let newPercentual = consultationForm.percentual_gordura;
                        if (newMassa && consultationForm.peso && parseFloat(consultationForm.peso) > 0) {
                           newPercentual = ((parseFloat(newMassa) / parseFloat(consultationForm.peso)) * 100).toFixed(1);
                        }
                        setConsultationForm({ ...consultationForm, massa_gorda: newMassa, percentual_gordura: newPercentual });
                      }}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>% de Gordura</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Ex: 18.5"
                      value={consultationForm.percentual_gordura}
                      onChange={(e) => setConsultationForm({ ...consultationForm, percentual_gordura: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Cintura (cm) - Opcional</label>
                    <input
                      type="number"
                      placeholder="Ex: 82"
                      value={consultationForm.cintura}
                      onChange={(e) => setConsultationForm({ ...consultationForm, cintura: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Quadril (cm) - Opcional</label>
                    <input
                      type="number"
                      placeholder="Ex: 96"
                      value={consultationForm.quadril}
                      onChange={(e) => setConsultationForm({ ...consultationForm, quadril: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Próximo Retorno</label>
                    <input
                      type="date"
                      value={consultationForm.proximo_retorno}
                      onChange={(e) => setConsultationForm({ ...consultationForm, proximo_retorno: e.target.value })}
                      style={styles.formInput}
                    />
                  </div>

                  <div style={{ ...styles.formGroupFull }}>
                    <label style={styles.formLabel}>Observações da Consulta</label>
                    <textarea
                      placeholder="Evolução, queixas, metas acordadas para o próximo período..."
                      value={consultationForm.observacoes}
                      onChange={(e) => setConsultationForm({ ...consultationForm, observacoes: e.target.value })}
                      style={styles.formTextarea}
                    />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setIsConsultationModalOpen(false)}
                  style={styles.cancelButton}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingConsultation}
                  style={styles.submitButton}
                >
                  {savingConsultation ? 'Salvando...' : 'Salvar Consulta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: 'hsl(var(--background))',
  },
  sidebar: {
    width: '280px',
    height: 'calc(100vh - 32px)',
    position: 'fixed',
    top: '16px',
    left: '16px',
    borderRadius: 'var(--radius)',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 100,
  },
  sidebarHeader: {
    marginBottom: '40px',
  },
  logoText: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'hsl(var(--primary))',
    letterSpacing: '-0.5px',
  },
  sidebarNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    border: 'none',
    backgroundColor: 'transparent',
    color: 'hsl(var(--muted-foreground))',
    fontSize: '15px',
    fontWeight: '600',
    textAlign: 'left',
    width: '100%',
  },
  navItemActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
  },
  navIcon: {
    marginRight: '12px',
  },
  sidebarFooter: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    paddingTop: '20px',
    borderTop: '1px solid hsl(var(--border))',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userAvatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
  },
  userDetailsSidebar: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'hsl(var(--foreground))',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userEmail: {
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  sidebarActions: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
  },
  themeToggle: {
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    flex: 1,
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'hsl(var(--foreground))',
  },
  logoutButton: {
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'hsl(var(--muted-foreground))',
  },
  mainContent: {
    marginLeft: '312px', // sidebar width (280) + gap spacing (32)
    flex: 1,
    padding: '32px 32px 32px 0',
  },
  dashboardContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  welcomeCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  welcomeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '8px',
  },
  welcomeTitle: {
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  welcomeSubtitle: {
    color: 'hsl(var(--muted-foreground))',
  },
  statsRow: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  statCard: {
    flex: 1,
    minWidth: '240px',
    padding: '24px',
    borderRadius: 'var(--radius)',
  },
  statValue: {
    fontSize: '36px',
    fontWeight: '800',
    color: 'hsl(var(--primary))',
    margin: '8px 0',
  },
  warningCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '24px',
  },
  patientList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  patientListItemLink: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'rgba(var(--card), 0.5)',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  patientListItemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  patientItemName: {
    fontWeight: '600',
    color: 'hsl(var(--foreground))',
  },
  patientItemSub: {
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
  },
  viewLink: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'hsl(var(--primary))',
  },
  emptyContainer: {
    padding: '32px',
    textAlign: 'center',
    border: '2px dashed hsl(var(--border))',
    borderRadius: 'var(--radius)',
  },
  emptyText: {
    color: 'hsl(var(--muted-foreground))',
    fontSize: '15px',
  },
  /* Patient Profile Styles */
  detailContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    background: 'none',
    border: 'none',
    color: 'hsl(var(--primary))',
    fontWeight: '600',
    fontSize: '15px',
    alignSelf: 'flex-start',
  },
  patientProfileCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  profileHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    paddingBottom: '24px',
    borderBottom: '1px solid hsl(var(--border))',
    marginBottom: '24px',
  },
  profileAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: '700',
  },
  patientName: {
    fontSize: '24px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  patientMeta: {
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
  },
  patientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '24px',
  },
  gridSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'hsl(var(--foreground))',
    borderLeft: '4px solid hsl(var(--primary))',
    paddingLeft: '8px',
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
  },
  detailListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  detailIcon: {
    color: 'hsl(var(--primary))',
  },
  consultationsCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  tableWrapper: {
    overflowX: 'auto',
    marginTop: '16px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '14px',
  },
  patientsTabContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  patientGridList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  patientCardItem: {
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  cardItemAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '700',
    fontSize: '18px',
    marginBottom: '12px',
  },
  cardItemName: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '4px',
  },
  cardItemEmail: {
    fontSize: '13px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '16px',
  },
  cardItemLink: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'hsl(var(--primary))',
  },
  cardItemGoal: {
    fontSize: '13px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '4px',
  },
  cardItemLastConsultation: {
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '12px',
  },
  listHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  newPatientButton: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  searchBarContainer: {
    marginBottom: '24px',
    width: '100%',
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
    fontSize: '15px',
    outline: 'none',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  formTitle: {
    fontSize: '26px',
    fontWeight: '700',
    letterSpacing: '-0.5px',
  },
  successAlert: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
    padding: '16px',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(22, 163, 74, 0.2)',
    fontWeight: '600',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: 'hsl(var(--error))',
    padding: '16px',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    fontWeight: '600',
  },
  formCard: {
    padding: '32px',
    borderRadius: 'var(--radius)',
  },
  formTabsBar: {
    display: 'flex',
    borderBottom: '1px solid hsl(var(--border))',
    marginBottom: '24px',
    gap: '16px',
    overflowX: 'auto',
  },
  formTabLink: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    padding: '12px 8px',
    color: 'hsl(var(--muted-foreground))',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'var(--transition)',
  },
  formTabLinkActive: {
    color: 'hsl(var(--primary))',
    borderBottomColor: 'hsl(var(--primary))',
  },
  formTabContent: {
    marginBottom: '32px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  formGroupFull: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    gridColumn: '1 / -1',
  },
  formLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'hsl(var(--foreground))',
  },
  formInput: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
    fontSize: '15px',
    outline: 'none',
  },
  inputWithSuffix: {
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  },
  formInputSuffix: {
    width: '100%',
    padding: '10px 48px 10px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
    fontSize: '15px',
    outline: 'none',
  },
  inputSuffix: {
    position: 'absolute',
    right: '14px',
    color: 'hsl(var(--muted-foreground))',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  checkboxGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
    marginTop: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
  },
  checkboxInput: {
    width: '16px',
    height: '16px',
    accentColor: 'hsl(var(--primary))',
  },
  formTextarea: {
    width: '100%',
    minHeight: '100px',
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'transparent',
    color: 'hsl(var(--foreground))',
    fontSize: '15px',
    outline: 'none',
    resize: 'vertical',
  },
  formHelpText: {
    fontSize: '12px',
    color: 'hsl(var(--muted-foreground))',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid hsl(var(--border))',
    paddingTop: '24px',
    marginTop: '24px',
  },
  cancelButton: {
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
  },
  wizardNav: {
    display: 'flex',
    gap: '12px',
  },
  prevTabButton: {
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius)',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: 'hsl(var(--foreground))',
    cursor: 'pointer',
  },
  nextTabButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButton: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    borderRadius: 'var(--radius)',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  editPatientProfileButton: {
    marginLeft: 'auto',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    color: 'hsl(var(--primary))',
    border: '1px solid hsl(var(--primary))',
    borderRadius: 'var(--radius)',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'var(--transition)',
  },
  profileSectionTabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px',
    borderBottom: '1px solid hsl(var(--border))',
    paddingBottom: '12px',
  },
  profileSectionTab: {
    backgroundColor: 'transparent',
    border: 'none',
    color: 'hsl(var(--muted-foreground))',
    fontSize: '16px',
    fontWeight: '600',
    padding: '8px 16px',
    cursor: 'pointer',
    borderRadius: 'var(--radius)',
    transition: 'var(--transition)',
  },
  profileSectionTabActive: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
  },
  chartWrapper: {
    width: '100%',
    padding: '16px',
    display: 'flex',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    marginTop: '16px',
  },
  chartSvg: {
    width: '100%',
    maxHeight: '250px',
  },
  emptyChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalCard: {
    width: '100%',
    maxWidth: '650px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '24px',
    borderRadius: 'var(--radius)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid hsl(var(--border))',
    paddingBottom: '16px',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: 'hsl(var(--foreground))',
    margin: 0,
  },
  modalCloseBtn: {
    background: 'none',
    border: 'none',
    fontSize: '28px',
    color: 'hsl(var(--muted-foreground))',
    cursor: 'pointer',
    lineHeight: '1',
  },
  modalBody: {
    marginBottom: '20px',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid hsl(var(--border))',
    paddingTop: '16px',
    marginTop: '20px',
  },
  sectionContainer: {
    width: '100%',
  },
  planHistoryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginTop: '16px',
  },
  planContentCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    padding: '20px',
    marginTop: '16px',
    overflowX: 'auto',
  },
  planContentText: {
    margin: 0,
    fontSize: '14px',
    fontFamily: 'monospace',
    color: 'hsl(var(--foreground))',
    whiteSpace: 'pre-wrap',
  },
};

// Insert custom global style rules for transitions and layout
const styleSheet = typeof document !== 'undefined' ? document.styleSheets[0] : null;

if (styleSheet) {
  try {
    styleSheet.insertRule(`
      aside button:hover {
        background-color: hsl(var(--muted)) !important;
        color: hsl(var(--foreground)) !important;
      }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
      .patientListItemLink:hover {
        border-color: hsl(var(--primary)) !important;
        transform: translateY(-2px);
      }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
      .patientCardItem:hover {
        border-color: hsl(var(--primary)) !important;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
      table th {
        padding: 12px;
        border-bottom: 2px solid hsl(var(--border));
        font-weight: 700;
        color: hsl(var(--foreground));
      }
    `, styleSheet.cssRules.length);
    styleSheet.insertRule(`
      table td {
        padding: 12px;
        border-bottom: 1px solid hsl(var(--border));
        color: hsl(var(--muted-foreground));
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Fail silently
  }
}
