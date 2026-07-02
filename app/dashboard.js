import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const ROLE_LABEL = {
  admin: "Administrador",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user]);

  const terminarSessao = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Cabeçalho */}
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <View className="flex-row justify-between items-start gap-3">
  <View className="flex-1">
    <Text className="text-white text-xl font-bold" numberOfLines={1}>
      Olá, {userData?.nome || user.email}! 👋
    </Text>
    <Text className="text-gray-300 mt-1">
      {ROLE_LABEL[userData?.role] || "Utilizador"}
    </Text>
  </View>
  <TouchableOpacity onPress={terminarSessao} className="shrink-0">
    <Text className="text-gray-300 text-sm">Sair</Text>
  </TouchableOpacity>
</View>
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

        <View className="gap-3 pb-8">
          <TouchableOpacity
            onPress={() => router.push("/turmas")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">Turmas e Alunos</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/chamada/VwkrDqLo53XAG14E3rpP")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">Registar Presença</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/chamadas-atencao")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">Chamadas de Atenção</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/reunioes")}
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row justify-between items-center"
          >
            <Text className="text-base text-slate-900 font-medium">Reuniões</Text>
            <Text className="text-gray-400">›</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}