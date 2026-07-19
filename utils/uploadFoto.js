const CLOUDINARY_CLOUD_NAME = "dw8t6gigw";
const CLOUDINARY_UPLOAD_PRESET = "alunos-escola";

/**
 * Faz upload de uma foto (base64, sem prefixo "data:image/...") para o
 * Cloudinary, na pasta "alunos", e devolve o URL público (https, já otimizado
 * pelo CDN do Cloudinary).
 *
 * Cada upload gera um nome único (alunoId + timestamp) — o URL antigo deixa
 * de ser usado (fica só o novo gravado no Firestore), mas o ficheiro anterior
 * continua a existir no Cloudinary. Para um projeto deste tamanho isso não é
 * problema (estás muito longe do limite gratuito), mas fica registado caso um
 * dia seja preciso limpar fotos antigas.
 */
export async function uploadFotoAluno(alunoId, base64Imagem) {
  if (!alunoId) throw new Error("alunoId em falta para upload da foto.");
  if (!base64Imagem) throw new Error("Imagem em falta para upload.");

  const dataUri = `data:image/jpeg;base64,${base64Imagem}`;

  const formData = new FormData();
  formData.append("file", dataUri);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("public_id", `alunos/${alunoId}_${Date.now()}`);

  const resposta = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  const dados = await resposta.json();

  if (dados.error) {
    throw new Error(dados.error.message || "Erro ao enviar a foto para o Cloudinary.");
  }

  return dados.secure_url;
}