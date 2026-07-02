import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, orderBy, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const CONFIG_ESTADO = {
  confirmada: { label: "Confirmada", cor: "bg-emerald-100", corTexto: "text-emerald-700" },
  pendente: { label: "Pendente", cor: "bg-amber-100", corTexto: "text-amber-700" },
  recusada: { label: "Recusada", cor: "bg-red-100", corTexto: "text-red-700" },
};

function formatarData(timestamp) {
  if (!timestamp?.toDate) return "";
  return timestamp.toDate().toLocaleDateString("pt-PT", { day: "2-digit", month: "short" });
}

export default function ReunioesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [reunioes, setReunioes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [data, setData] = useState("");
  const [local, setLocal] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "reunioes"), orderBy("criado_em", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setReunioes(lista);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const criarReuniao = async () => {
    if (!titulo || !data || !local) {
      Alert.alert("Atenção", "Preenche todos os campos.");
      return;
    }
    setSalvando(true);
    try {
      await addDoc(collection(db, "reunioes"), {
        tipo: "pais",
        titulo,
        data,
        local,
        motivo: "",
        aluno_id: "",
        participantes_ids: [],
        estado: "pendente",
        criado_por: user?.uid || "",
        criado_em: new Date(),
      });
      setModalVisivel(false);
      setTitulo("");
      setData("");
      setLocal("");
      Alert.alert("Sucesso", "Reunião agendada!");
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível agendar a reunião.");
    } finally {
      setSalvando(false);
    }
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

        {loading && <ActivityIndicator size="large" color="#0f172a" className="mb-6" />}

        {!loading && reunioes.length === 0 && (
          <Text className="text-gray-400 text-center mb-6">
            Ainda não há reuniões agendadas.
          </Text>
        )}

        <View className="gap-3 pb-8">
          {reunioes.map((reuniao) => {
            const estado = CONFIG_ESTADO[reuniao.estado] || CONFIG_ESTADO.pendente;
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

            <TouchableOpacity
              onPress={criarReuniao}
              disabled={salvando}
              className="bg-slate-900 rounded-lg py-4 mb-3"
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">Agendar e Notificar</Text>
              )}
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