import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";

const CONFIG_TIPO = {
  falta: { emoji: "❌", cor: "border-l-red-500", corFundo: "bg-red-50" },
  atraso: { emoji: "⏰", cor: "border-l-amber-500", corFundo: "bg-amber-50" },
  presenca: { emoji: "✅", cor: "border-l-emerald-500", corFundo: "bg-emerald-50" },
  chamada_atencao: { emoji: "⚠️", cor: "border-l-orange-500", corFundo: "bg-orange-50" },
  reuniao: { emoji: "📅", cor: "border-l-blue-500", corFundo: "bg-blue-50" },
};

function formatarData(timestamp) {
  if (!timestamp) return "";
  const data = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const dataStr = data.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  const horaStr = data.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  return `${dataStr} às ${horaStr}`;
}

function iniciaisDoNome(nome) {
  if (!nome) return "?";
  const partes = nome.trim().split(" ").filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// ---------- VISTA DO ADMIN: lista de encarregados ----------
function ListaEncarregadosAdmin({ router }) {
  const [encarregados, setEncarregados] = useState([]);
  const [naoLidasPorEncarregado, setNaoLidasPorEncarregado] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const qEncarregados = query(collection(db, "users"), where("role", "==", "encarregado"));
        const encarregadosSnap = await getDocs(qEncarregados);
        const listaEncarregados = encarregadosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const alunosSnap = await getDocs(collection(db, "alunos"));
        const alunosPorEncarregado = {};
        alunosSnap.docs.forEach((d) => {
          const aluno = d.data();
          (aluno.encarregados_ids || []).forEach((uid) => {
            if (!alunosPorEncarregado[uid]) alunosPorEncarregado[uid] = [];
            alunosPorEncarregado[uid].push(aluno.nome);
          });
        });

        const listaCompleta = listaEncarregados
          .map((enc) => ({ ...enc, educandos: alunosPorEncarregado[enc.id] || [] }))
          .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""));

        setEncarregados(listaCompleta);
      } catch (erro) {
        console.log("Erro ao carregar encarregados:", erro);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "notificacoes"), where("lida", "==", false));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contagem = {};
      snapshot.docs.forEach((d) => {
        const destinatarioId = d.data().destinatario_id;
        contagem[destinatarioId] = (contagem[destinatarioId] || 0) + 1;
      });
      setNaoLidasPorEncarregado(contagem);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0f172a" className="mt-6" />;
  }

  if (encarregados.length === 0) {
    return (
      <View className="px-6 pt-12 items-center">
        <Text className="text-4xl mb-3">👨‍👩‍👧</Text>
        <Text className="text-gray-400 text-center">
          Ainda não há encarregados registados.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6 pt-6 gap-3 pb-8">
      {encarregados.map((encarregado) => {
        const naoLidas = naoLidasPorEncarregado[encarregado.id] || 0;
        return (
          <TouchableOpacity
            key={encarregado.id}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: `/notificacoes-encarregado/${encarregado.id}`,
                params: { nome: encarregado.nome || encarregado.email || "Encarregado" },
              })
            }
            className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center"
          >
            <View className="w-11 h-11 rounded-full bg-slate-100 items-center justify-center mr-3">
              <Text className="text-slate-700 font-bold text-xs">
                {iniciaisDoNome(encarregado.nome)}
              </Text>
            </View>

            <View className="flex-1">
              <Text className="text-slate-900 font-semibold text-base">
                {encarregado.nome || encarregado.email || "Encarregado"}
              </Text>
              <Text className="text-gray-500 text-sm mt-0.5" numberOfLines={1}>
                {encarregado.educandos.length > 0
                  ? encarregado.educandos.join(", ")
                  : "Sem educando associado"}
              </Text>
            </View>

            {naoLidas > 0 && (
              <View className="bg-red-500 rounded-full min-w-[22px] h-[22px] items-center justify-center px-1.5 ml-2">
                <Text className="text-white text-xs font-bold">{naoLidas}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ---------- VISTA NORMAL: notificações da própria conta ----------
function MinhasNotificacoes({ router, userId }) {
  const [notificacoes, setNotificacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "notificacoes"),
      where("destinatario_id", "==", userId),
      orderBy("data_envio", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setNotificacoes(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      (erro) => {
        console.log("Erro ao carregar notificações:", erro);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [userId]);

  const abrirNotificacao = (notificacao) => {
    router.push(`/notificacao/${notificacao.id}`);
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0f172a" className="mt-6" />;
  }

  if (notificacoes.length === 0) {
    return (
      <View className="px-6 pt-12 items-center">
        <Text className="text-4xl mb-3">🔔</Text>
        <Text className="text-gray-400 text-center">
          Ainda não tens notificações.
        </Text>
      </View>
    );
  }

  return (
    <View className="px-6 pt-6 gap-3 pb-8">
      {notificacoes.map((notificacao) => {
        const config = CONFIG_TIPO[notificacao.tipo] || CONFIG_TIPO.reuniao;
        return (
          <TouchableOpacity
            key={notificacao.id}
            onPress={() => abrirNotificacao(notificacao)}
            activeOpacity={0.7}
            className={`rounded-xl p-4 border-l-4 ${config.cor} ${
              notificacao.lida ? "bg-white" : config.corFundo
            } border border-gray-200`}
          >
            <View className="flex-row items-start">
              <Text className="text-xl mr-3">{config.emoji}</Text>
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-base ${
                      notificacao.lida ? "font-medium text-gray-700" : "font-bold text-slate-900"
                    }`}
                  >
                    {notificacao.titulo}
                  </Text>
                  {!notificacao.lida && (
                    <View className="w-2 h-2 rounded-full bg-blue-600 ml-2" />
                  )}
                </View>
                <Text className="text-gray-600 text-sm mt-1">
                  {notificacao.mensagem}
                </Text>
                <Text className="text-gray-400 text-xs mt-2">
                  {formatarData(notificacao.data_envio)}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function NotificacoesScreen() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const ehAdmin = userData?.role === "admin";

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="bg-slate-900 pt-14 pb-6 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-2xl font-bold">
          {ehAdmin ? "Notificações por Encarregado" : "Notificações"}
        </Text>
        <Text className="text-gray-300 mt-1">
          {ehAdmin ? "Toca num encarregado para ver o histórico" : "Tudo em dia"}
        </Text>
      </View>

      {ehAdmin ? (
        <ListaEncarregadosAdmin router={router} />
      ) : (
        <MinhasNotificacoes router={router} userId={user?.uid} />
      )}
    </ScrollView>
  );
}