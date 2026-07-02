import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const turmasMock = [
  { id: "1", nome: "7ª A", anoLetivo: "2026", totalAlunos: 24 },
  { id: "2", nome: "8ª B", anoLetivo: "2026", totalAlunos: 21 },
  { id: "3", nome: "9ª C", anoLetivo: "2026", totalAlunos: 26 },
];

export default function TurmasScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Turmas</Text>
      </View>

      <View className="px-6 pt-6 gap-3">
        {turmasMock.map((turma) => (
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
                {turma.totalAlunos} alunos • Ano letivo {turma.anoLetivo}
              </Text>
            </View>
            <Text className="text-gray-400 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}