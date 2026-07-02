import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function CriarContaScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold text-slate-900 mb-2">
        Criar Conta
      </Text>
      <Text className="text-base text-gray-500 mb-8">
        Regista-te como encarregado de educação
      </Text>

      <Text className="text-sm text-gray-600 mb-1">Nome completo</Text>
      <TextInput
        placeholder="Ex: Gelson Chissanda"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Email</Text>
      <TextInput
        placeholder="Ex: gelsonchissanda@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Password</Text>
      <TextInput
        placeholder="********"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Confirmar Password</Text>
      <TextInput
        placeholder="********"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity className="bg-slate-900 rounded-lg py-4">
        <Text className="text-white text-center font-semibold text-base">
          Criar Conta
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()} className="mt-6">
        <Text className="text-center text-gray-500">
          Já tens conta?{" "}
          <Text className="text-slate-900 font-semibold">Iniciar sessão</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}