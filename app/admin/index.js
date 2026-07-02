import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function AdminHomeScreen() {
  const router = useRouter();

  const opcoes = [
    { label: "Gerir Turmas", rota: "/admin/turmas" },
    { label: "Gerir Alunos", rota: "/admin/alunos" },
    { label: "Gerir Professores", rota: "/admin/professores" },
    { label: "Gerir Utilizadores", rota: "/admin/utilizadores" },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Administração</Text>
      </View>

      <View className="px-6 pt-6 gap-3">
        {opcoes.map((opcao) => (
          <TouchableOpacity
            key={opcao.rota}
            onPress={() => router.push(opcao.rota)}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">{opcao.label}</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}