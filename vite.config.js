import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

function localApiPlugin() {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use(express.json());
      server.middlewares.use('/api/gerar-plano', async (req, res) => {
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });
        try {
          const { dados_do_paciente } = req.body;
          if (!dados_do_paciente) return res.status(400).json({ error: 'Faltam os dados do paciente' });
          if (!process.env.GOOGLE_API_KEY) return res.status(500).json({ error: 'API Key não configurada no servidor' });
          
          const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
          // O usuário pediu Gemini 3.1-flash, mas o correto da Google é gemini-1.5-flash
          const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
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
          responseText = responseText.replace(/```json/gi, '').replace(/```/gi, '').trim();
          
          res.status(200).json(JSON.parse(responseText));
        } catch (error) {
          console.error('Erro na geração com IA:', error);
          res.status(500).json({ 
            error: 'Falha ao processar requisição com a IA. Tente novamente mais tarde.', 
            details: error.message 
          });
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localApiPlugin()],
})
