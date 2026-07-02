import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const GRAVIDADES = [
  { key: "leve", label: "Leve", cor: "bg-amber-500" },
  { key: "media", label: "Média", cor: "bg-orange-600" },
  { key: "grave", label: "Grave", cor: "bg-red-600" },
];

export default function NovaChamadaAtencaoScreen() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams();

  const [motivo, setMotivo] = useState("");
  const [gravidade, setGravidade] = useState("leve");
  const [descricao, setDescricao] = useState("");

  const guardar = () => {
    const registo = { alunoId, motivo, gravidade, descricao, data: new Date() };
    console.log("Chamada de atenção a guardar:", registo);
    // Mais à frente: gravar no Firebase + notificar o encarregado
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Chamada de Atenção</Text>
        <Text className="text-gray-300 mt-1">Aluno ID: {alunoId}</Text>
      </View>

      <View className="px-6 pt-6">
        <Text className="text-sm text-gray-600 mb-1">Motivo</Text>
        <TextInput
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Ex: Falta de material"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base bg-white"
        />

        <Text className="text-sm text-gray-600 mb-2">Gravidade</Text>
        <View className="flex-row gap-2 mb-4">
          {GRAVIDADES.map((g) => {
            const ativo = gravidade === g.key;
            return (
              <TouchableOpacity
                key={g.key}
                onPress={() => setGravidade(g.key)}
                className={`flex-1 rounded-lg py-3 items-center border ${
                  ativo ? `${g.cor} border-transparent` : "bg-white border-gray-300"
                }`}
              >
                <Text className={ativo ? "text-white font-medium text-sm" : "text-gray-600 text-sm"}>
                  {g.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text className="text-sm text-gray-600 mb-1">Descrição</Text>
        <TextInput
          value={descricao}
          onChangeText={setDescricao}
          placeholder="Descreve o que aconteceu..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base bg-white h-28"
        />

        <View className="bg-blue-50 rounded-lg p-3 mb-6">
          <Text className="text-blue-800 text-sm">
            ℹ️ O encarregado de educação será notificado automaticamente ao guardar.
          </Text>
        </View>

        <TouchableOpacity onPress={guardar} className="bg-slate-900 rounded-lg py-4 mb-8">
          <Text className="text-white text-center font-semibold text-base">
            Guardar e Notificar
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}