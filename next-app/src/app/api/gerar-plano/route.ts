import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { dados_do_paciente } = await req.json();

    if (!dados_do_paciente) {
      return NextResponse.json({ error: "Dados do paciente são necessários." }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Chave da API do Google não configurada." }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
Você é um assistente especializado em nutrição. Crie um plano alimentar de 7 dias com base no perfil abaixo.
Siga RIGOROSAMENTE este formato JSON. Não inclua markdown (como \`\`\`json), responda APENAS com o objeto JSON:

{
  "plano_semanal": [
    {
      "dia": "Segunda-feira",
      "refeicoes": {
        "cafe_da_manha": ["opção 1", "opção 2", "opção 3"],
        "lanche_manha": ["opção 1", "opção 2"],
        "almoco": ["opção 1", "opção 2"],
        "lanche_tarde": ["opção 1", "opção 2"],
        "jantar": ["opção 1", "opção 2"]
      }
    }
  ]
}

- Gere para todos os dias (Segunda a Domingo).
- Respeite as restrições alimentares.
- Use alimentos comuns do Brasil.

PERFIL DO PACIENTE:
${dados_do_paciente}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Limpar possíveis formatações markdown do retorno da IA
    let jsonString = responseText.trim();
    const match = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match) {
      jsonString = match[1];
    }

    let parsedPlan;
    try {
      parsedPlan = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error("Erro ao fazer parse do JSON:", responseText);
      throw new Error("O formato retornado pela IA não é um JSON válido.");
    }

    return NextResponse.json(parsedPlan);

  } catch (error: any) {
    console.error("Erro na API gerar-plano:", error);
    return NextResponse.json(
      { error: error.message || "Ocorreu um erro ao gerar o plano. Tente novamente mais tarde." },
      { status: 500 }
    );
  }
}
