import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AlunosDaTurmaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "alunos"), where("turma_id", "==", id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlunos(lista);
      setLoading(false);
    });
    return unsubscribe;
  }, [id]);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Alunos</Text>
      </View>

      <View className="px-6 pt-6 gap-3 pb-8">
        {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-6" />}

        {!loading && alunos.length === 0 && (
          <Text className="text-gray-400 text-center mt-6">
            Ainda não há alunos nesta turma.
          </Text>
        )}

        {alunos.map((aluno) => (
          <TouchableOpacity
            key={aluno.id}
            onPress={() => router.push(`/aluno/${aluno.id}`)}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base font-semibold text-slate-900">
                {aluno.nome}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Nº processo: {aluno.numero_processo}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}