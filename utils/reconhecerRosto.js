import { FACEPP_API_KEY, FACEPP_API_SECRET, FACEPP_FACESET_OUTER_ID, FACEPP_BASE_URL } from "../faceppConfig";

const LIMIAR_CONFIANCA = 60;

export async function reconhecerRosto(base64Imagem) {
  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("image_base64", base64Imagem);
  params.append("outer_id", FACEPP_FACESET_OUTER_ID);

  const resposta = await fetch(`${FACEPP_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();
  console.log("Resposta completa do Face++ /search:", JSON.stringify(dados));

  if (dados.error_message) {
    if (dados.error_message === "NO_FACE_FOUND") {
      throw new Error("Nenhum rosto detetado. Aproxima-te mais da câmara.");
    }
    throw new Error(dados.error_message);
  }

  if (!dados.results || dados.results.length === 0) {
    return { faceToken: null, confianca: 0, reconhecido: false, facesetVazio: true };
  }

  const melhorResultado = dados.results[0];
  const reconhecido = melhorResultado.confidence >= LIMIAR_CONFIANCA;

  return {
    faceToken: reconhecido ? melhorResultado.face_token : null,
    confianca: melhorResultado.confidence,
    reconhecido,
    facesetVazio: false,
  };
}