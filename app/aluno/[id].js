import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

const alunoMock = {
  nome: "Ana Silva",
  numeroProcesso: "2026001",
  turma: "7ª A",
};

const historicoMock = [
  { id: "1", tipo: "falta", data: "28 Jun", descricao: "Falta não justificada" },
  { id: "2", tipo: "chamada_atencao", data: "25 Jun", descricao: "Conversa em sala de aula", gravidade: "leve" },
  { id: "3", tipo: "presente", data: "24 Jun", descricao: "Presente" },
  { id: "4", tipo: "atraso", data: "20 Jun", descricao: "Chegou 15 min atrasada" },
  { id: "5", tipo: "chamada_atencao", data: "15 Jun", descricao: "Falta de material escolar", gravidade: "media" },
];

const CONFIG_TIPO = {
  presente: { label: "Presença", cor: "bg-emerald-100", corTexto: "text-emerald-700" },
  falta: { label: "Falta", cor: "bg-red-100", corTexto: "text-red-700" },
  atraso: { label: "Atraso", cor: "bg-amber-100", corTexto: "text-amber-700" },
  chamada_atencao: { label: "Chamada de Atenção", cor: "bg-purple-100", corTexto: "text-purple-700" },
};

const FILTROS = [
  { key: "todos", label: "Todos" },
  { key: "falta", label: "Faltas" },
  { key: "chamada_atencao", label: "Chamadas" },
];

export default function HistoricoAlunoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [filtro, setFiltro] = useState("todos");

  const historicoFiltrado =
    filtro === "todos"
      ? historicoMock
      : historicoMock.filter((item) => item.tipo === filtro);

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">{alunoMock.nome}</Text>
        <Text className="text-gray-300 mt-1">
          {alunoMock.turma} • Nº {alunoMock.numeroProcesso} (ID: {id})
        </Text>
      </View>

      {/* Filtros */}
      <View className="flex-row gap-2 px-6 pt-6">
        {FILTROS.map((f) => {
          const ativo = filtro === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFiltro(f.key)}
              className={`px-4 py-2 rounded-full border ${
                ativo ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
              }`}
            >
              <Text className={ativo ? "text-white text-sm font-medium" : "text-gray-600 text-sm"}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Botão adicionar chamada de atenção */}
      <View className="px-6 pt-4">
        <TouchableOpacity
          onPress={() => router.push(`/chamada-atencao/${id}`)}
          className="bg-white border border-slate-900 rounded-lg py-3"
        >
          <Text className="text-slate-900 text-center font-semibold">
            + Nova Chamada de Atenção
          </Text>
        </TouchableOpacity>
      </View>

      {/* Linha do tempo */}
      <View className="px-6 pt-6 pb-8 gap-3">
        {historicoFiltrado.map((item) => {
          const config = CONFIG_TIPO[item.tipo];
          return (
            <View
              key={item.id}
              className="bg-white rounded-xl p-4 border border-gray-200"
            >
              <View className="flex-row justify-between items-start">
                <View
                  className={`${config.cor} rounded-full px-3 py-1 self-start`}
                >
                  <Text className={`${config.corTexto} text-xs font-semibold`}>
                    {config.label}
                  </Text>
                </View>
                <Text className="text-gray-400 text-xs">{item.data}</Text>
              </View>
              <Text className="text-slate-900 text-sm mt-2">{item.descricao}</Text>
            </View>
          );
        })}

        {historicoFiltrado.length === 0 && (
          <Text className="text-gray-400 text-center mt-4">
            Sem registos para este filtro.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}