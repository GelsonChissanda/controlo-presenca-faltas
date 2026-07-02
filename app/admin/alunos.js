import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

export default function AdminAlunosScreen() {
  const router = useRouter();
  const [alunos, setAlunos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [nome, setNome] = useState("");
  const [numeroProcesso, setNumeroProcesso] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubAlunos = onSnapshot(collection(db, "alunos"), (snapshot) => {
      setAlunos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubTurmas = onSnapshot(collection(db, "turmas"), (snapshot) => {
      setTurmas(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubAlunos();
      unsubTurmas();
    };
  }, []);

  const nomeTurma = (id) => turmas.find((t) => t.id === id)?.nome || "Sem turma";

  const abrirNovo = () => {
    setEditandoId(null);
    setNome("");
    setNumeroProcesso("");
    setTurmaId(turmas[0]?.id || "");
    setModalVisivel(true);
  };

  const abrirEditar = (aluno) => {
    setEditandoId(aluno.id);
    setNome(aluno.nome || "");
    setNumeroProcesso(aluno.numero_processo || "");
    setTurmaId(aluno.turma_id || "");
    setModalVisivel(true);
  };

  const guardar = async () => {
    if (!nome || !numeroProcesso || !turmaId) {
      Alert.alert("Atenção", "Preenche todos os campos, incluindo a turma.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        await updateDoc(doc(db, "alunos", editandoId), {
          nome,
          numero_processo: numeroProcesso,
          turma_id: turmaId,
        });
      } else {
        await addDoc(collection(db, "alunos"), {
          nome,
          numero_processo: numeroProcesso,
          turma_id: turmaId,
          data_nascimento: null,
          foto: "",
          encarregados_ids: [],
          estado: "ativo",
          criado_em: new Date(),
        });
      }
      setModalVisivel(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível guardar o aluno.");
    } finally {
      setSalvando(false);
    }
  };

  const apagar = (aluno) => {
    Alert.alert(
      "Apagar aluno",
      `Tens a certeza que queres apagar "${aluno.nome}"? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "alunos", aluno.id));
            } catch (error) {
              Alert.alert("Erro", "Não foi possível apagar o aluno.");
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
        <Text className="text-white text-2xl font-bold">Gerir Alunos</Text>
      </View>

      <View className="px-6 pt-6">
        <TouchableOpacity
          onPress={abrirNovo}
          disabled={turmas.length === 0}
          className="bg-slate-900 rounded-lg py-3 mb-6"
        >
          <Text className="text-white text-center font-semibold">+ Novo Aluno</Text>
        </TouchableOpacity>

        {turmas.length === 0 && !loading && (
          <Text className="text-amber-600 text-sm mb-4 text-center">
            Cria pelo menos uma turma antes de adicionar alunos.
          </Text>
        )}

        {loading && <ActivityIndicator size="large" color="#0f172a" className="mb-6" />}

        <View className="gap-3 pb-8">
          {alunos.map((aluno) => (
            <View key={aluno.id} className="bg-white rounded-xl p-4 border border-gray-200">
              <Text className="text-base font-semibold text-slate-900">{aluno.nome}</Text>
              <Text className="text-gray-500 text-sm mt-1">
                Nº {aluno.numero_processo} • {nomeTurma(aluno.turma_id)}
              </Text>
              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => abrirEditar(aluno)}
                  className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">Editar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => apagar(aluno)}
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
              {editandoId ? "Editar Aluno" : "Novo Aluno"}
            </Text>

            <Text className="text-sm text-gray-600 mb-1">Nome</Text>
            <TextInput
              value={nome}
              onChangeText={setNome}
              placeholder="Nome completo"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-1">Nº de Processo</Text>
            <TextInput
              value={numeroProcesso}
              onChangeText={setNumeroProcesso}
              placeholder="Ex: 2026004"
              className="border border-gray-300 rounded-lg px-4 py-3 mb-4 text-base"
            />

            <Text className="text-sm text-gray-600 mb-2">Turma</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {turmas.map((turma) => {
                const ativo = turmaId === turma.id;
                return (
                  <TouchableOpacity
                    key={turma.id}
                    onPress={() => setTurmaId(turma.id)}
                    className={`px-4 py-2 rounded-full border ${
                      ativo ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
                    }`}
                  >
                    <Text className={ativo ? "text-white text-sm font-medium" : "text-gray-600 text-sm"}>
                      {turma.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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