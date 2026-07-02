import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import { collection, onSnapshot, updateDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const ROLES = [
  { key: "admin", label: "Administrador" },
  { key: "professor", label: "Professor" },
  { key: "encarregado", label: "Encarregado" },
];

const ROLE_LABEL = {
  admin: "Administrador",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

const ROLE_COR = {
  admin: { cor: "bg-purple-100", corTexto: "text-purple-700" },
  professor: { cor: "bg-blue-100", corTexto: "text-blue-700" },
  encarregado: { cor: "bg-emerald-100", corTexto: "text-emerald-700" },
};

export default function AdminUtilizadoresScreen() {
  const router = useRouter();
  const [utilizadores, setUtilizadores] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisivel, setModalVisivel] = useState(false);
  const [editando, setEditando] = useState(null);
  const [roleSelecionado, setRoleSelecionado] = useState("encarregado");
  const [professorSelecionado, setProfessorSelecionado] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUtilizadores(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    const unsubProf = onSnapshot(collection(db, "professores"), (snapshot) => {
      setProfessores(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => {
      unsubUsers();
      unsubProf();
    };
  }, []);

  const abrirEditar = (utilizador) => {
    setEditando(utilizador);
    setRoleSelecionado(utilizador.role || "encarregado");
    setProfessorSelecionado(utilizador.professor_id || "");
    setModalVisivel(true);
  };

  const guardar = async () => {
    setSalvando(true);
    try {
      const dadosParaGuardar = {
        role: roleSelecionado,
        professor_id: roleSelecionado === "professor" ? professorSelecionado : "",
      };
      await updateDoc(doc(db, "users", editando.id), dadosParaGuardar);
      setModalVisivel(false);
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Não foi possível guardar as alterações.");
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
        <Text className="text-white text-2xl font-bold">Gerir Utilizadores</Text>
        <Text className="text-gray-300 mt-1 text-sm">
          Define o tipo de perfil de cada pessoa registada
        </Text>
      </View>

      <View className="px-6 pt-6">
        {loading && <ActivityIndicator size="large" color="#0f172a" className="mb-6" />}

        {!loading && utilizadores.length === 0 && (
          <Text className="text-gray-400 text-center mb-6">
            Ainda não há utilizadores registados.
          </Text>
        )}

        <View className="gap-3 pb-8">
          {utilizadores.map((u) => {
            const roleCor = ROLE_COR[u.role] || ROLE_COR.encarregado;
            return (
              <TouchableOpacity
                key={u.id}
                onPress={() => abrirEditar(u)}
                className="bg-white rounded-xl p-4 border border-gray-200"
              >
                <View className="flex-row justify-between items-start">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-semibold text-slate-900">
                      {u.nome || "Sem nome"}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1">{u.email}</Text>
                  </View>
                  <View className={`${roleCor.cor} rounded-full px-3 py-1`}>
                    <Text className={`${roleCor.corTexto} text-xs font-semibold`}>
                      {ROLE_LABEL[u.role] || "Sem perfil"}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <Modal visible={modalVisivel} animationType="slide" transparent>
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-6">
            <Text className="text-xl font-bold text-slate-900 mb-1">
              {editando?.nome || editando?.email}
            </Text>
            <Text className="text-gray-500 text-sm mb-4">{editando?.email}</Text>

            <Text className="text-sm text-gray-600 mb-2">Perfil</Text>
            <View className="flex-row gap-2 mb-4">
              {ROLES.map((r) => {
                const ativo = roleSelecionado === r.key;
                return (
                  <TouchableOpacity
                    key={r.key}
                    onPress={() => setRoleSelecionado(r.key)}
                    className={`flex-1 rounded-lg py-3 items-center border ${
                      ativo ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
                    }`}
                  >
                    <Text className={ativo ? "text-white text-sm font-medium" : "text-gray-600 text-sm"}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {roleSelecionado === "professor" && (
              <>
                <Text className="text-sm text-gray-600 mb-2">Ligar ao registo de Professor</Text>
                <View className="flex-row flex-wrap gap-2 mb-2">
                  {professores.map((p) => {
                    const ativo = professorSelecionado === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => setProfessorSelecionado(p.id)}
                        className={`px-4 py-2 rounded-full border ${
                          ativo ? "bg-slate-900 border-slate-900" : "bg-white border-gray-300"
                        }`}
                      >
                        <Text className={ativo ? "text-white text-sm font-medium" : "text-gray-600 text-sm"}>
                          {p.nome}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {professores.length === 0 && (
                  <Text className="text-amber-600 text-xs mb-2">
                    Cria primeiro o professor em "Gerir Professores".
                  </Text>
                )}
              </>
            )}

            <View className="mt-4" />

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