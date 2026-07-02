import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-slate-900 mb-2">
        Controlo de Presença
      </Text>
      <Text className="text-base text-gray-500 mb-8">
        Inicia sessão para continuar
      </Text>

      <Text className="text-sm text-gray-600 mb-1">Email</Text>
      <TextInput
        placeholder="o-teu-email@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Password</Text>
      <TextInput
        placeholder="********"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity
        onPress={() => router.push("/dashboard")}
        className="bg-slate-900 rounded-lg py-4"
      >
        <Text className="text-white text-center font-semibold text-base">
          Entrar
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => router.push("/criar-conta")}
        className="mt-6"
      >
        <Text className="text-center text-gray-500">
          Não tens conta?{" "}
          <Text className="text-slate-900 font-semibold">Criar conta</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
