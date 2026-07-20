import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Cria um único documento na coleção "notificacoes", para um destinatário.
 * Função interna — usar as funções específicas abaixo (notificarFalta, etc.)
 */
async function criarNotificacao({ destinatarioId, tipo, titulo, mensagem, referenciaId }) {
  await addDoc(collection(db, "notificacoes"), {
    destinatario_id: destinatarioId,
    tipo, // "falta" | "atraso" | "chamada_atencao" | "reuniao"
    titulo,
    mensagem,
    referencia_id: referenciaId || null,
    lida: false,
    data_envio: new Date(),
  });
}

/**
 * Envia a mesma notificação a TODOS os encarregados ligados ao aluno
 * (aluno.encarregados_ids pode ter mais que um uid).
 */
async function notificarEncarregados(aluno, dadosNotificacao) {
  const encarregadosIds = aluno?.encarregados_ids || [];

  if (encarregadosIds.length === 0) {
    console.log(`Aluno ${aluno?.nome || aluno?.id} não tem encarregados ligados — notificação não enviada.`);
    return;
  }

  await Promise.all(
    encarregadosIds.map((uid) =>
      criarNotificacao({ destinatarioId: uid, ...dadosNotificacao })
    )
  );
}

/**
 * Notifica os encarregados de uma FALTA.
 * @param {object} aluno - documento do aluno (precisa de nome + encarregados_ids)
 * @param {string} presencaId - id do documento em "presencas", para referência
 */
export async function notificarFalta(aluno, presencaId) {
  await notificarEncarregados(aluno, {
    tipo: "falta",
    titulo: "Falta registada",
    mensagem: `${aluno.nome} foi marcado(a) como falta hoje.`,
    referenciaId: presencaId,
  });
}

/**
 * Notifica os encarregados de um ATRASO.
 * @param {object} aluno - documento do aluno
 * @param {string} presencaId - id do documento em "presencas"
 */
export async function notificarAtraso(aluno, presencaId) {
  await notificarEncarregados(aluno, {
    tipo: "atraso",
    titulo: "Atraso registado",
    mensagem: `${aluno.nome} chegou atrasado(a) hoje.`,
    referenciaId: presencaId,
  });
}

/**
 * Notifica os encarregados de uma CHAMADA DE ATENÇÃO.
 * @param {object} aluno - documento do aluno
 * @param {string} gravidade - "leve" | "media" | "grave"
 * @param {string} motivo - motivo curto da chamada de atenção
 * @param {string} chamadaId - id do documento em "chamadas_atencao"
 */
export async function notificarChamadaAtencao(aluno, gravidade, motivo, chamadaId) {
  const gravidadeLabel = { leve: "Leve", media: "Média", grave: "Grave" }[gravidade] || gravidade;

  await notificarEncarregados(aluno, {
    tipo: "chamada_atencao",
    titulo: `Chamada de atenção (${gravidadeLabel})`,
    mensagem: `${aluno.nome}: ${motivo}`,
    referenciaId: chamadaId,
  });
}