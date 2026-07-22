import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const CONFIG_TIPO = {
  falta: { emoji: "❌", cor: "border-l-red-500", corFundo: "bg-red-50" },
  atraso: { emoji: "⏰", cor: "border-l-amber-500", corFundo: "bg-amber-50" },
  presenca: { emoji: "✅", cor: "border-l-emerald-500", corFundo: "bg-emerald-50" },
  chamada_atencao: { emoji: "⚠️", cor: "border-l-orange-500", corFundo: "bg-orange-50" },
  reuniao: { emoji: "📅", cor: "border-l-blue-500", corFundo: "bg-blue-50" },
};

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const dataStr = data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = data.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return `${dataStr} às ${horaStr}`;
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, "notificacoes"),
      where("destinatario_id", "==", user.uid),
      orderBy("data_envio", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotificacoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (erro) => {
        console.log("Erro ao carregar notificações:", erro);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  const abrirNotificacao = (notificacao) => {
    router.push(`/notificacao/${notificacao.id}`);
  };

  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Notificações</Text>
        <Text className="text-gray-300 mt-1">
          {naoLidas > 0 ? `${naoLidas} por ler` : "Tudo em dia"}
        </Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-6" />}

      {!loading && notificacoes.length === 0 && (
        <View className="px-6 pt-12 items-center">
          <Text className="text-4xl mb-3">🔔</Text>
          <Text className="text-gray-400 text-center">
            Ainda não tens notificações.
          </Text>
        </View>
      )}

      <View className="px-6 pt-6 gap-3 pb-8">
        {notificacoes.map((notificacao) => {
          const config = CONFIG_TIPO[notificacao.tipo] || CONFIG_TIPO.reuniao;
          return (
            <TouchableOpacity
              key={notificacao.id}
              onPress={() => abrirNotificacao(notificacao)}
              activeOpacity={0.7}
              className={`rounded-xl p-4 border-l-4 ${config.cor} ${
                notificacao.lida ? "bg-white" : config.corFundo
              } border border-gray-200`}
            >
              <View className="flex-row items-start">
                <Text className="text-xl mr-3">{config.emoji}</Text>
                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-base ${
                        notificacao.lida ? "font-medium text-gray-700" : "font-bold text-slate-900"
                      }`}
                    >
                      {notificacao.titulo}
                    </Text>
                    {!notificacao.lida && (
                      <View className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
                    )}
                  </View>
                  <Text className="text-gray-600 text-sm mt-1">
                    {notificacao.mensagem}
                  </Text>
                  <Text className="text-gray-400 text-xs mt-2">
                    {formatarData(notificacao.data_envio)}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}