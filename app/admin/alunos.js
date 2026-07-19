import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { db } from "../../firebaseConfig";
import { uploadFotoAluno } from "../../utils/uploadFoto";

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

  // --- estado da foto ---
  // fotoUrlAtual: URL já existente no Firestore (quando a editar um aluno)
  // fotoBase64Novo: nova foto escolhida agora, ainda por enviar
  // fotoPreviewUri: uri local para pré-visualizar (câmara/galeria) ou o próprio fotoUrlAtual
  const [fotoUrlAtual, setFotoUrlAtual] = useState(null);
  const [fotoBase64Novo, setFotoBase64Novo] = useState(null);
  const [fotoPreviewUri, setFotoPreviewUri] = useState(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);

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

  const [encarregados, setEncarregados] = useState([]);
  const [encarregadosSelecionados, setEncarregadosSelecionados] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      where("role", "==", "encarregado"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setEncarregados(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  const nomeTurma = (id) =>
    turmas.find((t) => t.id === id)?.nome || "Sem turma";

  const limparEstadoFoto = () => {
    setFotoUrlAtual(null);
    setFotoBase64Novo(null);
    setFotoPreviewUri(null);
  };

  const abrirNovo = () => {
    setEditandoId(null);
    setNome("");
    setNumeroProcesso("");
    setTurmaId(turmas[0]?.id || "");
    setEncarregadosSelecionados([]);
    limparEstadoFoto();
    setModalVisivel(true);
  };

  const abrirEditar = (aluno) => {
    setEditandoId(aluno.id);
    setNome(aluno.nome || "");
    setNumeroProcesso(aluno.numero_processo || "");
    setTurmaId(aluno.turma_id || "");
    setEncarregadosSelecionados(aluno.encarregados_ids || []);
    setFotoUrlAtual(aluno.foto_url || null);
    setFotoBase64Novo(null);
    setFotoPreviewUri(aluno.foto_url || null);
    setModalVisivel(true);
  };

  // --- escolha de foto (câmara ou galeria) ---
  const escolherFoto = () => {
    Alert.alert("Foto do aluno", "Como queres adicionar a foto?", [
      { text: "Tirar Foto", onPress: tirarFotoComCamera },
      { text: "Escolher da Galeria", onPress: escolherDaGaleria },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const tirarFotoComCamera = async () => {
    const permissao = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso à câmara para tirar a foto.");
      return;
    }
    const resultado = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    processarResultadoImagem(resultado);
  };

  const escolherDaGaleria = async () => {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) {
      Alert.alert("Permissão necessária", "Precisamos de acesso às tuas fotos para escolher a imagem.");
      return;
    }
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.6,
      base64: true,
    });
    processarResultadoImagem(resultado);
  };

  const processarResultadoImagem = (resultado) => {
    if (resultado.canceled || !resultado.assets || resultado.assets.length === 0) return;
    const imagem = resultado.assets[0];
    setFotoBase64Novo(imagem.base64);
    setFotoPreviewUri(imagem.uri);
  };

  const verificarConsentimentoEAbrirCamera = async (aluno) => {
    if (!aluno.encarregados_ids || aluno.encarregados_ids.length === 0) {
      Alert.alert(
        "Atenção",
        "Este aluno ainda não tem nenhum encarregado ligado.",
      );
      return;
    }

    try {
      const verificacoes = await Promise.all(
        aluno.encarregados_ids.map((uid) => getDoc(doc(db, "users", uid))),
      );
      const algumConsentiu = verificacoes.some(
        (snap) => snap.exists() && snap.data().consentimento_biometria === true,
      );

      if (!algumConsentiu) {
        Alert.alert(
          "Consentimento necessário",
          "Nenhum encarregado deste aluno autorizou o uso de biometria facial. Vai a Gerir Utilizadores e ativa o consentimento primeiro.",
        );
        return;
      }

      router.push(`/registar-rosto/${aluno.id}`);
    } catch (error) {
      Alert.alert("Erro", "Não foi possível verificar o consentimento.");
    }
  };

  const alternarEncarregado = (uid) => {
    setEncarregadosSelecionados((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid],
    );
  };

  const guardar = async () => {
    if (!nome || !numeroProcesso || !turmaId) {
      Alert.alert("Atenção", "Preenche todos os campos, incluindo a turma.");
      return;
    }
    setSalvando(true);
    try {
      if (editandoId) {
        const dados = {
          nome,
          numero_processo: numeroProcesso,
          turma_id: turmaId,
          encarregados_ids: encarregadosSelecionados,
        };

        // se foi escolhida uma foto nova, faz upload e atualiza o campo
        if (fotoBase64Novo) {
          setEnviandoFoto(true);
          try {
            const url = await uploadFotoAluno(editandoId, fotoBase64Novo);
            dados.foto_url = url;
          } catch (erroUpload) {
            Alert.alert("Aviso", "Os dados foram guardados, mas a foto falhou ao enviar. Tenta novamente editando o aluno.");
          } finally {
            setEnviandoFoto(false);
          }
        }

        await updateDoc(doc(db, "alunos", editandoId), dados);
      } else {
        // cria primeiro o documento para obter o ID, depois faz upload da foto (se houver)
        const novoDocRef = await addDoc(collection(db, "alunos"), {
          nome,
          numero_processo: numeroProcesso,
          turma_id: turmaId,
          data_nascimento: null,
          foto_url: "",
          encarregados_ids: encarregadosSelecionados,
          estado: "ativo",
          criado_em: new Date(),
        });

        if (fotoBase64Novo) {
          setEnviandoFoto(true);
          try {
            const url = await uploadFotoAluno(novoDocRef.id, fotoBase64Novo);
            await updateDoc(novoDocRef, { foto_url: url });
          } catch (erroUpload) {
            Alert.alert("Aviso", "O aluno foi criado, mas a foto falhou ao enviar. Podes adicionar depois, editando o aluno.");
          } finally {
            setEnviandoFoto(false);
          }
        }
      }
      setModalVisivel(false);
      limparEstadoFoto();
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
      ],
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
          <Text className="text-white text-center font-semibold">
            + Novo Aluno
          </Text>
        </TouchableOpacity>

        {turmas.length === 0 && !loading && (
          <Text className="text-amber-600 text-sm mb-4 text-center">
            Cria pelo menos uma turma antes de adicionar alunos.
          </Text>
        )}

        {loading && (
          <ActivityIndicator size="large" color="#0f172a" className="mb-6" />
        )}

        <View className="gap-3 pb-8">
          {alunos.map((aluno) => (
            <View
              key={aluno.id}
              className="bg-white rounded-xl p-4 border border-gray-200"
            >
              <View className="flex-row items-center">
                {aluno.foto_url ? (
                  <Image
                    source={{ uri: aluno.foto_url }}
                    style={{ width: 48, height: 48, borderRadius: 24 }}
                  />
                ) : (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 24,
                      backgroundColor: "#e5e7eb",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ color: "#6b7280", fontWeight: "700" }}>
                      {aluno.nome?.charAt(0)?.toUpperCase() || "?"}
                    </Text>
                  </View>
                )}

                <View className="ml-3 flex-1">
                  <Text className="text-base font-semibold text-slate-900">
                    {aluno.nome}
                  </Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    Nº {aluno.numero_processo} • {nomeTurma(aluno.turma_id)}
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-3">
                <TouchableOpacity
                  onPress={() => verificarConsentimentoEAbrirCamera(aluno)}
                  className="flex-1 bg-purple-50 rounded-lg py-2 items-center"
                >
                  <Text className="text-purple-700 text-sm font-medium">
                    {aluno.face_token ? "🔄 Rosto" : "📸 Rosto"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => abrirEditar(aluno)}
                  className="flex-1 bg-gray-100 rounded-lg py-2 items-center"
                >
                  <Text className="text-gray-700 text-sm font-medium">
                    Editar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => apagar(aluno)}
                  className="flex-1 bg-red-50 rounded-lg py-2 items-center"
                >
                  <Text className="text-red-600 text-sm font-medium">
                    Apagar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <ScrollView className="bg-white rounded-t-2xl p-6" style={{ maxHeight: "88%" }}>
            <Text className="text-xl font-bold text-slate-900 mb-4">
              {editandoId ? "Editar Aluno" : "Novo Aluno"}
            </Text>

            {/* --- seleção de foto --- */}
            <View className="items-center mb-6">
              <TouchableOpacity onPress={escolherFoto} disabled={enviandoFoto}>
                {fotoPreviewUri ? (
                  <Image
                    source={{ uri: fotoPreviewUri }}
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      borderWidth: 2,
                      borderColor: "#0f172a",
                    }}
                  />
                ) : (
                  <View
                    style={{
                      width: 96,
                      height: 96,
                      borderRadius: 48,
                      backgroundColor: "#f3f4f6",
                      borderWidth: 2,
                      borderColor: "#d1d5db",
                      borderStyle: "dashed",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>📷</Text>
                  </View>
                )}
                {enviandoFoto && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      borderRadius: 48,
                      backgroundColor: "rgba(0,0,0,0.4)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <ActivityIndicator color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
              <Text className="text-gray-500 text-xs mt-2">
                {fotoPreviewUri ? "Toca para trocar a foto" : "Toca para adicionar foto"}
              </Text>
            </View>

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
                      ativo
                        ? "bg-slate-900 border-slate-900"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={
                        ativo
                          ? "text-white text-sm font-medium"
                          : "text-gray-600 text-sm"
                      }
                    >
                      {turma.nome}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text className="text-sm text-gray-600 mb-2">
              Encarregado(s) de Educação
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {encarregados.map((enc) => {
                const ativo = encarregadosSelecionados.includes(enc.id);
                return (
                  <TouchableOpacity
                    key={enc.id}
                    onPress={() => alternarEncarregado(enc.id)}
                    className={`px-4 py-2 rounded-full border ${
                      ativo
                        ? "bg-slate-900 border-slate-900"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    <Text
                      className={
                        ativo
                          ? "text-white text-sm font-medium"
                          : "text-gray-600 text-sm"
                      }
                    >
                      {enc.nome || enc.email}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {encarregados.length === 0 && (
              <Text className="text-amber-600 text-xs mb-4">
                Ainda não há contas de encarregado registadas.
              </Text>
            )}

            <TouchableOpacity
              onPress={guardar}
              disabled={salvando}
              className="bg-slate-900 rounded-lg py-4 mb-3"
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">
                  Guardar
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setModalVisivel(false);
                limparEstadoFoto();
              }}
            >
              <Text className="text-center text-gray-500 py-2">Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}