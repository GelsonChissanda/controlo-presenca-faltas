import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const CONFIG_TIPO = {
  falta: { emoji: "❌", cor: "#EF4444", label: "Falta" },
  atraso: { emoji: "⏰", cor: "#F59E0B", label: "Atraso" },
  chamada_atencao: { emoji: "⚠️", cor: "#F97316", label: "Chamada de Atenção" },
  reuniao: { emoji: "📅", cor: "#3B82F6", label: "Reunião" },
};

function formatarDataCompleta(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const dataStr = data.toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const horaStr = data.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return `${dataStr} às ${horaStr}`;
}

export default function NotificacaoDetalheScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [notificacao, setNotificacao] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const ref = doc(db, "notificacoes", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setNotificacao({ id: snap.id, ...snap.data() });

          // marca como lida automaticamente ao abrir o detalhe
          if (!snap.data().lida) {
            await updateDoc(ref, { lida: true });
          }
        }
      } catch (erro) {
        console.log("Erro ao carregar notificação:", erro);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!notificacao) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-6">
        <Text className="text-gray-400 text-center">
          Não foi possível encontrar esta notificação.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-medium">‹ Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const config = CONFIG_TIPO[notificacao.tipo] || CONFIG_TIPO.reuniao;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-8 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-6">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>

        <View className="items-center">
          <View
            className="rounded-full items-center justify-center mb-4"
            style={{ width: 72, height: 72, backgroundColor: `${config.cor}22` }}
          >
            <Text style={{ fontSize: 34 }}>{config.emoji}</Text>
          </View>
          <Text className="text-gray-300 text-xs font-semibold uppercase tracking-wide">
            {config.label}
          </Text>
        </View>
      </View>

      <View className="px-6 pt-8">
        <Text className="text-slate-900 text-2xl font-bold mb-3">
          {notificacao.titulo}
        </Text>

        <Text className="text-gray-700 text-base leading-6 mb-6">
          {notificacao.mensagem}
        </Text>

        <View className="bg-white rounded-xl p-4 border border-gray-200">
          <Text className="text-gray-400 text-xs uppercase tracking-wide mb-1">
            Recebida em
          </Text>
          <Text className="text-slate-700 text-sm">
            {formatarDataCompleta(notificacao.data_envio)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}