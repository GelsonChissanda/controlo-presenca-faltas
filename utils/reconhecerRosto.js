import { FACEPP_API_KEY, FACEPP_API_SECRET, FACEPP_FACESET_OUTER_ID, FACEPP_BASE_URL } from "../faceppConfig";

/**
 * Procura, dentro do FaceSet da escola, a quem pertence o rosto na foto.
 * @param {string} base64Imagem - imagem em base64 (sem prefixo "data:image/...")
 * @returns {{ faceToken: string, confianca: number } | null}
 */
export async function reconhecerRosto(base64Imagem) {
  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("image_base64", base64Imagem);
  params.append("faceset_outer_id", FACEPP_FACESET_OUTER_ID);

  const resposta = await fetch(`${FACEPP_BASE_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();

  if (dados.error_message) {
    if (dados.error_message === "NO_FACE_FOUND") {
      throw new Error("Nenhum rosto detetado. Aproxima-te mais da câmara.");
    }
    throw new Error(dados.error_message);
  }

  if (!dados.results || dados.results.length === 0) {
    return null; // Rosto detetado, mas não corresponde a ninguém registado
  }

  const melhorResultado = dados.results[0];

  // Face++ devolve "confidence" de 0 a 100. Um limiar de 75+ costuma ser seguro.
  const LIMIAR_CONFIANCA = 75;
  if (melhorResultado.confidence < LIMIAR_CONFIANCA) {
    return null; // Confiança baixa demais, não arriscamos identificar
  }

  return {
    faceToken: melhorResultado.face_token,
    confianca: melhorResultado.confidence,
  };
}