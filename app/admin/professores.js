import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AdminProfessoresScreen() {
  const router = useRouter();
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [disciplinasTexto, setDisciplinasTexto] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "professores"), (snapshot) => {
      setProfessores(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const abrirNovo = () => {
    setEditandoId(null);
    setNome("");
    setEmail("");
    setTelefone("");
    setDisciplinasTexto("");
    setModalVisivel(true);
  };

  const abrirEditar = (professor) => {
    setEditandoId(professor.id);
    setNome(professor.nome || "");
    setEmail(professor.email || "");
    setTelefone(professor.telefone || "");
    setDisciplinasTexto((professor.disciplinas || []).join(", "));
    setModalVisivel(true);
  };

  const guardar = async () => {
    if (!nome || !email) {
      Alert.alert("Atenção", "Preenche pelo menos o nome e o email.");
      return;
    }
    const disciplinas = disciplinasTexto
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    setSalvando(true);
    try {
      if (editandoId) {
        await updateDoc(doc(db, "professores", editandoId), {
          nome,
          email,
          telefone,
          disciplinas,
        });
      } else {
        await addDoc(collection(db, "professores"), {
          nome,
          email,
          telefone,
          disciplinas,
          criado_em: new Date(),
        });
      }
      setModalVisivel(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível guardar o professor.");
    } finally {
      setSalvando(false);
    }
  };

  const apagar = (professor) => {
    Alert.alert(
      "Apagar professor",
      `Tens a certeza que queres apagar "${professor.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "professores", professor.id));
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar o professor.");
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
        <Text className="text-white text-2xl font-bold">Gerir Professores</Text>
      </View>

      <View className="px-6 pt-6">
        <TouchableOpacity onPress={abrirNovo} className="bg-slate-900 rounded-lg py-3 mb-6">
          <Text className="text-white text-center font-semibold">+ Novo Professor</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator size="large" color="#0f172a" className="mb-6" />}

        {!loading && professores.length === 0 && (
          <Text className="text-gray-400 text-center mb-6">
            Ainda não há professores registados.
          </Text>
        )}

        <View className="gap-3 pb-8">
          {professores.map((professor) => (
            <View key={professor.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <Text className="text-base font-semibold text-slate-900">{professor.nome}</Text>
              <Text className="text-gray-500 text-sm mt-1">{professor.email}</Text>
              {professor.telefone ? (
                <Text className="text-gray-500 text-sm">{professor.telefone}</Text>
              ) : null}
              {professor.disciplinas?.length > 0 && (
                <View className="flex-row flex-wrap gap-1 mt-2">
                  {professor.disciplinas.map((d, i) => (
                    <View key={i} className="bg-gray-100 rounded-full px-3 py-1">
                      <Text className="text-gray-600 text-xs">{d}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => abrirEditar(professor)}
                  className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => apagar(professor)}
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
              {editandoId ? "Editar Professor" : "Novo Professor"}
            </Text>

            <Text className="text-sm text-gray-600 mb-1">Nome</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="professor@escola.com"
              keyboardType="email-address"
              autoCapitalize="none"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Telefone</Text>
            <TextInput
              value={telefone}
              onChangeText={setTelefone}
              placeholder="Ex: 923 456 789"
              keyboardType="phone-pad"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Disciplinas</Text>
            <TextInput
              value={disciplinasTexto}
              onChangeText={setDisciplinasTexto}
              placeholder="Ex: Matemática, Física"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-1 text-base"
            />
            <Text className="text-gray-400 text-xs mb-6">
              Separa várias disciplinas por vírgula.
            </Text>

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