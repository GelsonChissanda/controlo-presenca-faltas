import { getApp } from "firebase/app";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";

// Usa a app Firebase já inicializada pelo firebaseConfig.js — não precisa
// de saber que nomes esse ficheiro exporta.
const storage = getStorage(getApp());

/**
 * Faz upload de uma foto (base64, sem prefixo "data:image/...") para o
 * Storage, no caminho fotos_alunos/{alunoId}.jpg, e devolve o URL público.
 *
 * Reutilizar o mesmo alunoId substitui a foto anterior automaticamente
 * (mesmo caminho = mesmo ficheiro).
 */
export async function uploadFotoAluno(alunoId, base64Imagem) {
  if (!alunoId) throw new Error("alunoId em falta para upload da foto.");
  if (!base64Imagem) throw new Error("Imagem em falta para upload.");

  const caminho = `fotos_alunos/${alunoId}.jpg`;
  const storageRef = ref(storage, caminho);

  await uploadString(storageRef, base64Imagem, "base64", {
    contentType: "image/jpeg",
  });

  const url = await getDownloadURL(storageRef);
  return url;
}