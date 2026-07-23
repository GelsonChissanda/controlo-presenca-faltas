import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { notificarFalta, notificarAtraso, notificarPresenca } from "../../utils/criarNotificacoes";

const ESTADOS = [
  { key: "presente", label: "Presente", cor: "bg-emerald-600" },
  { key: "falta", label: "Falta", cor: "bg-red-600" },
  { key: "atraso", label: "Atraso", cor: "bg-amber-500" },
];

export default function ChamadaScreen() {
  const router = useRouter();
  const { turmaId } = useLocalSearchParams();
  const { user } = useAuth();

  const [alunos, setAlunos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [presencas, setPresencas] = useState({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "alunos"), where("turma_id", "==", turmaId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAlunos(lista);
      setLoading(false);
    });
    return unsubscribe;
  }, [turmaId]);

  const marcar = (alunoId, estado) => {
    setPresencas((prev) => ({ ...prev, [alunoId]: estado }));
  };

  const guardarChamada = async () => {
    const alunosPorMarcar = alunos.filter((a) => !presencas[a.id]);
    if (alunosPorMarcar.length > 0) {
      Alert.alert("Atenção", "Marca o estado de todos os alunos antes de guardar.");
      return;
    }

    setSalvando(true);
    try {
      const hoje = new Date();
      const promessas = alunos.map((aluno) =>
        addDoc(collection(db, "presencas"), {
          aluno_id: aluno.id,
          turma_id: turmaId,
          data: hoje,
          estado: presencas[aluno.id],
          justificada: false,
          observacoes: "",
          registado_por: user?.uid || "",
          criado_em: hoje,
        })
      );
      const resultados = await Promise.all(promessas);

      // dispara notificações para presença, faltas e atrasos — não bloqueia
      // o ecrã, corre em paralelo e só regista no log se alguma falhar
      alunos.forEach((aluno, index) => {
        const estado = presencas[aluno.id];
        const presencaId = resultados[index].id;

        if (estado === "falta") {
          notificarFalta(aluno, presencaId).catch((erro) =>
            console.log(`Erro ao notificar falta de ${aluno.nome}:`, erro)
          );
        } else if (estado === "atraso") {
          notificarAtraso(aluno, presencaId).catch((erro) =>
            console.log(`Erro ao notificar atraso de ${aluno.nome}:`, erro)
          );
        } else if (estado === "presente") {
          notificarPresenca(aluno, presencaId).catch((erro) =>
            console.log(`Erro ao notificar presença de ${aluno.nome}:`, erro)
          );
        }
      });

      Alert.alert("Sucesso", "Chamada guardada com sucesso!");
      router.back();
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível guardar a chamada.");
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
        <Text className="text-white text-2xl font-bold">Chamada</Text>
        <Text className="text-gray-300 mt-1">Hoje</Text>
      </View>

      {loading && <ActivityIndicator size="large" color="#0f172a" className="mt-6" />}

      {!loading && alunos.length === 0 && (
        <Text className="text-gray-400 text-center mt-6">
          Não há alunos nesta turma.
        </Text>
      )}

      <View className="px-6 pt-6 gap-3">
        {alunos.map((aluno) => (
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

      {alunos.length > 0 && (
        <View className="px-6 py-6">
          <TouchableOpacity
            onPress={guardarChamada}
            disabled={salvando}
            className="bg-slate-900 rounded-lg py-4"
          >
            {salvando ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Guardar Chamada
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}