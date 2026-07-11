import { FACEPP_API_KEY, FACEPP_API_SECRET, FACEPP_FACESET_OUTER_ID, FACEPP_BASE_URL } from "../faceppConfig";

/**
 * Deteta um rosto numa imagem e devolve o face_token do Face++.
 * @param {string} base64Imagem - imagem em base64 (sem o prefixo "data:image/...")
 */
async function detetarRosto(base64Imagem) {
  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("image_base64", base64Imagem);

  const resposta = await fetch(`${FACEPP_BASE_URL}/detect`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();

  if (dados.error_message) {
    throw new Error(dados.error_message);
  }

  if (!dados.faces || dados.faces.length === 0) {
    throw new Error("Nenhum rosto detetado na imagem. Tenta novamente com boa iluminação.");
  }

  if (dados.faces.length > 1) {
    throw new Error("Mais que um rosto detetado. Certifica-te que só aparece uma pessoa na imagem.");
  }

  return dados.faces[0].face_token;
}

/**
 * Adiciona um face_token ao FaceSet da escola.
 */
async function adicionarAoFaceSet(faceToken) {
  const params = new URLSearchParams();
  params.append("api_key", FACEPP_API_KEY);
  params.append("api_secret", FACEPP_API_SECRET);
  params.append("outer_id", FACEPP_FACESET_OUTER_ID);
  params.append("face_tokens", faceToken);

  const resposta = await fetch(`${FACEPP_BASE_URL}/faceset/addface`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const dados = await resposta.json();
  if (dados.error_message) {
    throw new Error(dados.error_message);
  }
  return dados;
}

/**
 * Fluxo completo: deteta o rosto, adiciona ao FaceSet, devolve o face_token
 * para guardarmos no documento do aluno no Firestore.
 */
export async function registarRostoDoAluno(base64Imagem) {
  const faceToken = await detetarRosto(base64Imagem);
  await adicionarAoFaceSet(faceToken);
  return faceToken;
}