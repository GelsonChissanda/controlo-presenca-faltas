import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AdminTurmasScreen() {
  const router = useRouter();
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [nome, setNome] = useState("");
  const [anoLetivo, setAnoLetivo] = useState("");
  const [sala, setSala] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "turmas"), (snapshot) => {
      setTurmas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const abrirNovo = () => {
    setEditandoId(null);
    setNome("");
    setAnoLetivo("");
    setSala("");
    setModalVisivel(true);
  };

  const abrirEditar = (turma) => {
    setEditandoId(turma.id);
    setNome(turma.nome || "");
    setAnoLetivo(turma.ano_letivo || "");
    setSala(turma.sala || "");
    setModalVisivel(true);
  };

  const guardar = async () => {
    if (!nome || !anoLetivo) {
      Alert.alert("Atenção", "Preenche pelo menos o nome e o ano letivo.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await updateDoc(doc(db, "turmas", editandoId), {
          nome,
          ano_letivo: anoLetivo,
          sala,
        });
      } else {
        await addDoc(collection(db, "turmas"), {
          nome,
          ano_letivo: anoLetivo,
          sala,
          professor_titular_id: "",
          professores_ids: [],
          criado_em: new Date(),
        });
      }
      setModalVisivel(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível guardar a turma.");
    } finally {
      setSalvando(false);
    }
  };

  const apagar = (turma) => {
    Alert.alert(
      "Apagar turma",
      `Tens a certeza que queres apagar "${turma.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "turmas", turma.id));
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar a turma.");
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">Gerir Turmas</Text>
      </View>

      <View className="px-6 pt-6">
        <TouchableOpacity onPress={abrirNovo} className="bg-slate-900 rounded-lg py-3 mb-6">
          <Text className="text-white text-center font-semibold">+ Nova Turma</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#0f172a" className="mb-6" />}

        <View className="gap-3 pb-8">
          {turmas.map((turma) => (
            <View key={turma.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-slate-900">{turma.nome}</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Sala {turma.sala || "-"} • Ano letivo {turma.ano_letivo}
                  </Text>
                </View>
              </View>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => abrirEditar(turma)}
                  className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => apagar(turma)}
                  className="flex-1 bg-red-50 rounded-lg py-2 items-center"
                >
                  <Text className="text-red-600 text-sm font-medium">Apagar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-xl font-bold text-slate-900 mb-4">
              {editandoId ? "Editar Turma" : "Nova Turma"}
            </Text>

            <Text className="text-sm text-gray-600 mb-1">Nome</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Ex: 7ª A"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Ano Letivo</Text>
            <TextInput
              value={anoLetivo}
              onChangeText={setAnoLetivo}
              placeholder="Ex: 2026"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Sala</Text>
            <TextInput
              value={sala}
              onChangeText={setSala}
              placeholder="Ex: Sala 12"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
            />

            <TouchableOpacity
              onPress={guardar}
              disabled={salvando}
              className="bg-slate-900 rounded-lg py-4 mb-3"
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">Guardar</Text>
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