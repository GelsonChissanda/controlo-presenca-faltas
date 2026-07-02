import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const CONFIG_GRAVIDADE = {
  leve: { label: "Leve", cor: "bg-amber-100", corTexto: "text-amber-700" },
  media: { label: "Média", cor: "bg-orange-100", corTexto: "text-orange-700" },
  grave: { label: "Grave", cor: "bg-red-100", corTexto: "text-red-700" },
};

const FILTROS = [
  { key: "todos", label: "Todas" },
  { key: "leve", label: "Leves" },
  { key: "media", label: "Médias" },
  { key: "grave", label: "Graves" },
];

function formatarData(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function ChamadasAtencaoScreen() {
  const router = useRouter();
  const [filtro, setFiltro] = useState("todos");
  const [chamadas, setChamadas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "chamadas_atencao"), orderBy("data", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const lista = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const dados = docSnap.data();
          let nomeAluno = "Aluno";
          try {
            const alunoSnap = await getDoc(doc(db, "alunos", dados.aluno_id));
            if (alunoSnap.exists()) nomeAluno = alunoSnap.data().nome;
          } catch (e) {}
          return { id: docSnap.id, ...dados, nomeAluno };
        })
      );
      setChamadas(lista);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const chamadasFiltradas =
    filtro === "todos" ? chamadas : chamadas.filter((c) => c.gravidade === filtro);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Chamadas de Atenção</Text>
      </View>

      <View className="flex-row flex-wrap gap-2 px-6 pt-6">
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

      <View className="px-6 pt-6 pb-8 gap-3">
        {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-6" />}

        {!loading && chamadasFiltradas.length === 0 && (
          <Text className="text-gray-400 text-center mt-6">
            Sem chamadas de atenção para este filtro.
          </Text>
        )}

        {chamadasFiltradas.map((c) => {
          const gravidade = CONFIG_GRAVIDADE[c.gravidade];
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => router.push(`/aluno/${c.aluno_id}`)}
              className="bg-white rounded-xl p-4 border border-gray-200"
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className={`${gravidade.cor} rounded-full px-3 py-1`}>
                  <Text className={`${gravidade.corTexto} text-xs font-semibold`}>
                    {gravidade.label}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs">{formatarData(c.data)}</Text>
              </View>
              <Text className="text-slate-900 font-semibold text-base">{c.nomeAluno}</Text>
              <Text className="text-gray-500 text-sm mt-1">{c.motivo}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}