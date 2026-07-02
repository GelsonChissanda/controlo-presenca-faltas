import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const alunosMock = [
  { id: "1", nome: "Ana Silva" },
  { id: "2", nome: "Bruno Costa" },
  { id: "3", nome: "Carla Mendes" },
];

const ESTADOS = [
  { key: "presente", label: "Presente", cor: "bg-emerald-600" },
  { key: "falta", label: "Falta", cor: "bg-red-600" },
  { key: "atraso", label: "Atraso", cor: "bg-amber-500" },
];

export default function ChamadaScreen() {
  const router = useRouter();
  const { turmaId } = useLocalSearchParams();

  // Guarda o estado de cada aluno: { "1": "presente", "2": "falta", ... }
  const [presencas, setPresencas] = useState({});

  const marcar = (alunoId, estado) => {
    setPresencas((prev) => ({ ...prev, [alunoId]: estado }));
  };

  const guardarChamada = () => {
    console.log("Presenças a guardar:", presencas);
    // Mais à frente: aqui vamos gravar isto no Firebase
    router.back();
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Chamada</Text>
        <Text className="text-gray-300 mt-1">Turma {turmaId} • Hoje</Text>
      </View>

      <View className="px-6 pt-6 gap-3">
        {alunosMock.map((aluno) => (
          <View
            key={aluno.id}
            className="bg-white rounded-xl p-4 border border-gray-200"
          >
            <Text className="text-base font-semibold text-slate-900 mb-3">
              {aluno.nome}
            </Text>
            <View className="flex-row gap-2">
              {ESTADOS.map((estado) => {
                const ativo = presencas[aluno.id] === estado.key;
                return (
                  <TouchableOpacity
                    key={estado.key}
                    onPress={() => marcar(aluno.id, estado.key)}
                    className={`flex-1 rounded-lg py-2 items-center border ${
                      ativo
                        ? `${estado.cor} border-transparent`
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={`text-sm font-medium ${
                        ativo ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {estado.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>

      <View className="px-6 py-6">
        <TouchableOpacity
          onPress={guardarChamada}
          className="bg-slate-900 rounded-lg py-4"
        >
          <Text className="text-white text-center font-semibold text-base">
            Guardar Chamada
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}