import { FACEPP_API_KEY, FACEPP_API_SECRET, FACEPP_FACESET_OUTER_ID, FACEPP_BASE_URL } from "../faceppConfig";

/**
 * Cria o FaceSet da escola (correr apenas uma vez).
 * Chama esta função manualmente (ex: num botão temporário) para inicializar.
 */
export async function criarFaceSetDaEscola() {
  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("outer_id", FACEPP_FACESET_OUTER_ID);
  params.append("display_name", "Alunos da Escola");

  const resposta = await fetch(`${FACEPP_BASE_URL}/faceset/create`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();
  console.log("Resultado da criação do FaceSet:", dados);
  return dados;
}