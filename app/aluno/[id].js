import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot, collection, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const CONFIG_TIPO = {
  presente: { label: "Presença", cor: "bg-emerald-100", corTexto: "text-emerald-700" },
  falta: { label: "Falta", cor: "bg-red-100", corTexto: "text-red-700" },
  atraso: { label: "Atraso", cor: "bg-amber-100", corTexto: "text-amber-700" },
  chamada_atencao: { label: "Chamada de Atenção", cor: "bg-purple-100", corTexto: "text-purple-700" },
};

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "falta", label: "Faltas" },
  { key: "chamada_atencao", label: "Chamadas" },
];

function formatarData(timestamp) {
  if (!timestamp?.toDate) return "";
  const data = timestamp.toDate();
  return data.toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function HistoricoAlunoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [filtro, setFiltro] = useState("todos");
  const [aluno, setAluno] = useState(null);
  const [presencas, setPresencas] = useState([]);
  const [chamadas, setChamadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAluno = onSnapshot(doc(db, "alunos", id), (docSnap) => {
      if (docSnap.exists()) setAluno({ id: docSnap.id, ...docSnap.data() });
    });
    return unsubAluno;
  }, [id]);

  useEffect(() => {
    const qPresencas = query(collection(db, "presencas"), where("aluno_id", "==", id));
    const unsubPresencas = onSnapshot(qPresencas, (snapshot) => {
      setPresencas(snapshot.docs.map((d) => ({ id: d.id, tipo: d.data().estado, ...d.data() })));
    });

    const qChamadas = query(collection(db, "chamadas_atencao"), where("aluno_id", "==", id));
    const unsubChamadas = onSnapshot(qChamadas, (snapshot) => {
      setChamadas(snapshot.docs.map((d) => ({ id: d.id, tipo: "chamada_atencao", descricao: d.data().motivo, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubPresencas();
      unsubChamadas();
    };
  }, [id]);

  const historico = [...presencas, ...chamadas].sort((a, b) => {
    const dataA = a.data?.toDate ? a.data.toDate() : new Date(0);
    const dataB = b.data?.toDate ? b.data.toDate() : new Date(0);
    return dataB - dataA;
  });

  const historicoFiltrado =
    filtro === "todos" ? historico : historico.filter((item) => item.tipo === filtro);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{aluno?.nome || "..."}</Text>
        <Text className="text-gray-300 mt-1">
          Nº {aluno?.numero_processo || "-"}
        </Text>
      </View>

      <View className="flex-row gap-2 px-6 pt-6">
        {FILTROS.map((f) => {
          const ativo = filtro === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFiltro(f.key)}
              className={`px-4 py-2 rounded-full border ${
                ativo ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
              }`}
            >
              <Text className={ativo ? "text-white text-sm font-medium" : "text-gray-600 text-sm"}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View className="px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.push(`/chamada-atencao/${id}`)}
          className="bg-white border border-slate-900 rounded-lg py-3"
        >
          <Text className="text-slate-900 text-center font-semibold">
            + Nova Chamada de Atenção
          </Text>
        </TouchableOpacity>
      </View>

      <View className="px-6 pt-6 pb-8 gap-3">
        {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-4" />}

        {!loading && historicoFiltrado.length === 0 && (
          <Text className="text-gray-400 text-center mt-4">
            Sem registos para este filtro.
          </Text>
        )}

        {historicoFiltrado.map((item) => {
          const config = CONFIG_TIPO[item.tipo];
          return (
            <View key={item.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <View className="flex-row justify-between items-start">
                <View className={`${config.cor} rounded-full px-3 py-1 self-start`}>
                  <Text className={`${config.corTexto} text-xs font-semibold`}>
                    {config.label}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs">{formatarData(item.data)}</Text>
              </View>
              <Text className="text-slate-900 text-sm mt-2">
                {item.descricao || config.label}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}