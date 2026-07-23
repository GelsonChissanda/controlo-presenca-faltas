import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Define como a notificação aparece quando a app está aberta/em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Pede permissão ao utilizador para mostrar notificações.
 * Deve ser chamado uma vez, idealmente assim que o encarregado faz login.
 */
export async function pedirPermissaoNotificacoes() {
  if (!Device.isDevice) {
    console.log("Notificações locais precisam de um dispositivo físico ou emulador configurado.");
    return false;
  }

  const { status: statusAtual } = await Notifications.getPermissionsAsync();
  let statusFinal = statusAtual;

  if (statusAtual !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    statusFinal = status;
  }

  if (statusFinal !== "granted") {
    console.log("Permissão de notificações negada pelo utilizador.");
    return false;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  return true;
}

/**
 * Dispara uma notificação local imediatamente.
 */
async function dispararNotificacaoLocal({ titulo, mensagem, dados }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: titulo,
      body: mensagem,
      data: dados || {},
    },
    trigger: null, // null = dispara já
  });
}

/**
 * Liga um listener em tempo real à coleção "notificacoes" para um encarregado.
 * Só dispara notificação local para documentos NOVOS (criados depois de montar
 * o listener) — evita "bombardear" o utilizador com notificações antigas ao
 * abrir a app.
 *
 * @param {string} destinatarioId - uid do encarregado (user.uid)
 * @returns {function} unsubscribe - chamar no cleanup do useEffect
 */
export function escutarNotificacoes(destinatarioId) {
  if (!destinatarioId) return () => {};

  let primeiraCarga = true;

  const q = query(
    collection(db, "notificacoes"),
    where("destinatario_id", "==", destinatarioId),
    orderBy("data_envio", "desc")
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    // Na primeira leitura, o Firestore devolve todos os documentos existentes
    // como "added" — ignoramos essa primeira leva para não notificar o
    // histórico todo de uma vez.
    if (primeiraCarga) {
      primeiraCarga = false;
      return;
    }

    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const notificacao = change.doc.data();
        dispararNotificacaoLocal({
          titulo: notificacao.titulo,
          mensagem: notificacao.mensagem,
          dados: {
            tipo: notificacao.tipo,
            referenciaId: notificacao.referencia_id,
            notificacaoId: change.doc.id,
          },
        }).catch((erro) => console.log("Erro ao disparar notificação local:", erro));
      }
    });
  });

  return unsubscribe;
}