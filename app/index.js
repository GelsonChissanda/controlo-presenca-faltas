import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebaseConfig";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const entrar = async () => {
    if (!email || !password) {
      Alert.alert("Atenção", "Preenche o email e a password.");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace("/dashboard");
    } catch (error) {
      console.log(error.code);
      Alert.alert("Erro ao entrar", "Email ou password incorretos.");
    } finally {
      setLoading(false);
    }
  };

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
        value={email}
        onChangeText={setEmail}
        placeholder="Ex: gelsonchissanda@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Password</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="********"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity
        onPress={entrar}
        disabled={loading}
        className="bg-slate-900 rounded-lg py-4"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Entrar
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/criar-conta")} className="mt-6">
        <Text className="text-center text-gray-500">
          Não tens conta?{" "}
          <Text className="text-slate-900 font-semibold">Criar conta</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}