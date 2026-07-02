import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Cabeçalho */}
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <Text className="text-white text-2xl font-bold">Gestão Escolar</Text>
        <Text className="text-gray-300 mt-1">Bem-vindo de volta</Text>
      </View>

      {/* Conteúdo */}
      <View className="px-6 pt-6">
        <Text className="text-lg font-semibold text-slate-900 mb-4">
          Resumo de hoje
        </Text>

        <View className="flex-row gap-4 mb-6">
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-3xl font-bold text-slate-900">0</Text>
            <Text className="text-gray-500 text-sm mt-1">Faltas hoje</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 border border-gray-200">
            <Text className="text-3xl font-bold text-slate-900">0</Text>
            <Text className="text-gray-500 text-sm mt-1">Avisos</Text>
          </View>
        </View>

        <Text className="text-lg font-semibold text-slate-900 mb-4">
          Acesso rápido
        </Text>

        <View className="gap-3">
          <TouchableOpacity
            onPress={() => router.push("/turmas")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">
              Turmas e Alunos
            </Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/chamada/1")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">
              Registar Presença
            </Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/chamadas-atencao")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">
              Chamadas de Atenção
            </Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/reunioes")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">
              Reuniões
            </Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
