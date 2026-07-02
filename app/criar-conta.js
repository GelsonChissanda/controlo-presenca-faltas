import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebaseConfig";

export default function CriarContaScreen() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const criarConta = async () => {
    if (!nome || !email || !password || !confirmarPassword) {
      Alert.alert("Atenção", "Preenche todos os campos.");
      return;
    }
    if (password !== confirmarPassword) {
      Alert.alert("Atenção", "As passwords não coincidem.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Atenção", "A password deve ter pelo menos 6 caracteres.");
      return;
    }

    setLoading(true);
    try {
      const credenciais = await createUserWithEmailAndPassword(auth, email, password);
      const utilizador = credenciais.user;

      await updateProfile(utilizador, { displayName: nome });

      await setDoc(doc(db, "users", utilizador.uid), {
        uid: utilizador.uid,
        nome,
        email,
        role: "encarregado",
        professor_id: "",
        encarregado_id: "",
        criado_em: new Date(),
      });

      router.replace("/dashboard");
    } catch (error) {
      console.log(error.code);
      if (error.code === "auth/email-already-in-use") {
        Alert.alert("Erro", "Já existe uma conta com este email.");
      } else {
        Alert.alert("Erro", "Não foi possível criar a conta.");
      }
    } finally {
      setLoading(false);
    }
  };

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
        value={nome}
        onChangeText={setNome}
        placeholder="O teu nome"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Email</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="o-teu-email@exemplo.com"
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
        className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
      />

      <Text className="text-sm text-gray-600 mb-1">Confirmar Password</Text>
      <TextInput
        value={confirmarPassword}
        onChangeText={setConfirmarPassword}
        placeholder="********"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <TouchableOpacity
        onPress={criarConta}
        disabled={loading}
        className="bg-slate-900 rounded-lg py-4"
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-white text-center font-semibold text-base">
            Criar Conta
          </Text>
        )}
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