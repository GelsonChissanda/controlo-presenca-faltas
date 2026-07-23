import { collection, addDoc, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../firebaseConfig";

/**
 * Cria um único documento na coleção "notificacoes", para um destinatário.
 * Função interna — usar as funções específicas abaixo (notificarFalta, etc.)
 */
async function criarNotificacao({ destinatarioId, alunoId, tipo, titulo, mensagem, referenciaId }) {
  await addDoc(collection(db, "notificacoes"), {
    destinatario_id: destinatarioId,
    aluno_id: alunoId || null,
    tipo, // "falta" | "atraso" | "presenca" | "chamada_atencao" | "reuniao"
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
      criarNotificacao({ destinatarioId: uid, alunoId: aluno.id, ...dadosNotificacao })
    )
  );
}

/**
 * Verifica se já foi enviada uma notificação de um determinado tipo,
 * para este aluno, hoje. Usado para evitar notificações duplicadas
 * (ex: presença marcada mais que uma vez no mesmo dia).
 */
async function jaNotificadoHoje(alunoId, tipo) {
  const inicioHoje = new Date();
  inicioHoje.setHours(0, 0, 0, 0);

  const q = query(
    collection(db, "notificacoes"),
    where("aluno_id", "==", alunoId),
    where("tipo", "==", tipo),
    where("data_envio", ">=", inicioHoje),
    limit(1)
  );

  const snap = await getDocs(q);
  return !snap.empty;
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
 * Notifica os encarregados de uma PRESENÇA.
 * Só envia UMA vez por dia por aluno, mesmo que a chamada seja
 * repetida ou corrigida várias vezes no mesmo dia.
 * @param {object} aluno - documento do aluno
 * @param {string} presencaId - id do documento em "presencas"
 */
export async function notificarPresenca(aluno, presencaId) {
  try {
    const jaEnviado = await jaNotificadoHoje(aluno.id, "presenca");
    if (jaEnviado) {
      console.log(`Presença de ${aluno.nome} já foi notificada hoje — a ignorar.`);
      return;
    }
  } catch (erro) {
    console.log("Erro ao verificar notificação de presença duplicada:", erro);
    // em caso de erro na verificação, seguimos em frente e notificamos
    // na mesma — é preferível notificar a mais do que falhar silenciosamente
  }

  await notificarEncarregados(aluno, {
    tipo: "presenca",
    titulo: "Presença confirmada",
    mensagem: `${aluno.nome} está presente na aula hoje.`,
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