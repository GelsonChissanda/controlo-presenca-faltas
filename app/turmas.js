import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebaseConfig";

export default function TurmasScreen() {
  const router = useRouter();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "turmas"), (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTurmas(lista);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Turmas</Text>
      </View>

      <View className="px-6 pt-6 gap-3 pb-8">
        {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-6" />}

        {!loading && turmas.length === 0 && (
          <Text className="text-gray-400 text-center mt-6">
            Ainda não há turmas criadas.
          </Text>
        )}

        {turmas.map((turma) => (
          <TouchableOpacity
            key={turma.id}
            onPress={() => router.push(`/turmas/${turma.id}`)}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base font-semibold text-slate-900">
                {turma.nome}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Sala {turma.sala} • Ano letivo {turma.ano_letivo}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}