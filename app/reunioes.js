import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal } from "react-native";
import { useRouter } from "expo-router";

const reunioesMock = [
  { id: "1", titulo: "Reunião trimestral - 7ª A", tipo: "pais", data: "05 Jul, 14:00", local: "Sala 12", estado: "confirmada" },
  { id: "2", titulo: "Reunião sobre comportamento - Bruno Costa", tipo: "pais", data: "08 Jul, 10:00", local: "Gabinete", estado: "pendente" },
  { id: "3", titulo: "Reunião de professores - Fim de período", tipo: "pessoal", data: "10 Jul, 16:00", local: "Sala dos Professores", estado: "confirmada" },
];

const CONFIG_ESTADO = {
  confirmada: { label: "Confirmada", cor: "bg-emerald-100", corTexto: "text-emerald-700" },
  pendente: { label: "Pendente", cor: "bg-amber-100", corTexto: "text-amber-700" },
  recusada: { label: "Recusada", cor: "bg-red-100", corTexto: "text-red-700" },
};

export default function ReunioesScreen() {
  const router = useRouter();
  const [modalVisivel, setModalVisivel] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");

  const criarReuniao = () => {
    console.log("Nova reunião:", { titulo, data, local });
    // Mais à frente: gravar no Firebase + notificar participantes
    setModalVisivel(false);
    setTitulo("");
    setData("");
    setLocal("");
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Reuniões</Text>
      </View>

      <View className="px-6 pt-6">
        <TouchableOpacity
          onPress={() => setModalVisivel(true)}
          className="bg-slate-900 rounded-lg py-3 mb-6"
        >
          <Text className="text-white text-center font-semibold">
            + Agendar Reunião
          </Text>
        </TouchableOpacity>

        <View className="gap-3 pb-8">
          {reunioesMock.map((reuniao) => {
            const estado = CONFIG_ESTADO[reuniao.estado];
            return (
              <View
                key={reuniao.id}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                <View className="flex-row justify-between items-start mb-2">
                  <View className={`${estado.cor} rounded-full px-3 py-1`}>
                    <Text className={`${estado.corTexto} text-xs font-semibold`}>
                      {estado.label}
                    </Text>
                  </View>
                  <Text className="text-gray-400 text-xs">
                    {reuniao.tipo === "pais" ? "Encarregados" : "Pessoal"}
                  </Text>
                </View>
                <Text className="text-slate-900 font-semibold text-base mb-1">
                  {reuniao.titulo}
                </Text>
                <Text className="text-gray-500 text-sm">
                  📅 {reuniao.data} • 📍 {reuniao.local}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Modal para criar reunião */}
      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-xl font-bold text-slate-900 mb-4">
              Agendar Reunião
            </Text>

            <Text className="text-sm text-gray-600 mb-1">Título</Text>
            <TextInput
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Ex: Reunião trimestral"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Data e Hora</Text>
            <TextInput
              value={data}
              onChangeText={setData}
              placeholder="Ex: 10 Jul, 14:00"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Local</Text>
            <TextInput
              value={local}
              onChangeText={setLocal}
              placeholder="Ex: Sala 12"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
            />

            <TouchableOpacity onPress={criarReuniao} className="bg-slate-900 rounded-lg py-4 mb-3">
              <Text className="text-white text-center font-semibold">Agendar e Notificar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisivel(false)}>
              <Text className="text-center text-gray-500 py-2">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}