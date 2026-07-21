export const config = {
  runtime: 'edge', // Vercel Edge function (faster, lightweight)
};

import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { dados_do_paciente } = await req.json();

    if (!dados_do_paciente) {
      return new Response(JSON.stringify({ error: 'Faltam os dados do paciente' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return new Response(JSON.stringify({ error: 'API Key não configurada no servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Inicializa o SDK
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    
    // Configura o modelo. gemini-1.5-flash é excelente para tasks estruturadas e JSON
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2, // Temperatura mais baixa para garantir a estrutura
      }
    });

    const prompt = `Você é um nutricionista clínico profissional especialista na culinária e rotina brasileira.
Gere um plano alimentar semanal completo, saudável e diversificado com base nos dados do paciente fornecidos abaixo.

Dados do Paciente (Metas, Alergias, Restrições e Histórico):
${dados_do_paciente}

# Regras Críticas de Execução:
- Você deve responder APENAS e estritamente o objeto JSON solicitado.
- Não inclua blocos de código markdown (como \`\`\`json ... \`\`\`), explicações, introduções ou textos complementares.
- Adapte o cardápio rigorosamente a quaisquer alergias ou restrições descritas nos dados.
- Utilize alimentos comuns, acessíveis e culturalmente aceitos no Brasil.
- Evite repetições monótonas de alimentos nos dias seguidos.

O formato do JSON retornado deve seguir exatamente esta estrutura:
{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_manha": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "almoco": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "lanche_tarde": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"],
        "jantar": ["Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5"]
      }
    }
  ]
}`;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();
    
    // Prevenção extra caso o modelo ainda assim retorne markdown tags ````json ````
    responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();

    // Valida se o retorno é um JSON parsing correto
    const parsedData = JSON.parse(responseText);

    return new Response(JSON.stringify(parsedData), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na geração com IA:', error);
    return new Response(JSON.stringify({ 
      error: 'Falha ao processar requisição com a IA. Tente novamente mais tarde.', 
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
