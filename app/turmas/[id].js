import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const alunosMock = [
  { id: "1", nome: "Ana Silva", numeroProcesso: "2026001" },
  { id: "2", nome: "Bruno Costa", numeroProcesso: "2026002" },
  { id: "3", nome: "Carla Mendes", numeroProcesso: "2026003" },
];

export default function AlunosDaTurmaScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Alunos</Text>
        <Text className="text-gray-300 mt-1">Turma ID: {id}</Text>
      </View>

      <View className="px-6 pt-6 gap-3">
        {alunosMock.map((aluno) => (
          <TouchableOpacity
            key={aluno.id}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <View>
              <Text className="text-base font-semibold text-slate-900">
                {aluno.nome}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                Nº processo: {aluno.numeroProcesso}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}