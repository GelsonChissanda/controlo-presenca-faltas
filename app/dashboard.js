import { useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Animated } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { auth, db } from "../firebaseConfig";
import { useAuth } from "../context/AuthContext";
import StatCard from "../components/StatCard";

const ROLE_LABEL = {
  admin: "Administrador",
  professor: "Professor",
  encarregado: "Encarregado de Educação",
};

function inicioDoDia() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function inicioDoMes() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Botão de acesso rápido com pequena animação ao pressionar
function AcessoRapidoItem({ label, icone, destaque, onPress }) {
  const escala = useRef(new Animated.Value(1)).current;

  const aoPressionar = () => {
    Animated.sequence([
      Animated.timing(escala, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.timing(escala, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: escala }] }}>
      <TouchableOpacity
        onPress={aoPressionar}
        activeOpacity={0.8}
        className={`rounded-xl p-4 flex-row justify-between items-center ${
          destaque ? "bg-slate-900" : "bg-white border border-gray-200"
        }`}
      >
        <Text className={`text-base font-medium ${destaque ? "text-white" : "text-slate-900"}`}>
          {icone} {label}
        </Text>
        <Text className={destaque ? "text-gray-300" : "text-gray-400"}>›</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const { user, userData, loading } = useAuth();

  const [totalAlunos, setTotalAlunos] = useState(0);
  const [totalTurmas, setTotalTurmas] = useState(0);
  const [faltasHoje, setFaltasHoje] = useState(0);
  const [chamadasMes, setChamadasMes] = useState(0);
  const [reunioesPendentes, setReunioesPendentes] = useState(0);
  const [meusEducandos, setMeusEducandos] = useState(0);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user]);

  // Estatísticas gerais (admin / professor)
  useEffect(() => {
    if (!user || userData?.role === "encarregado") return;

    const unsubTurmas = onSnapshot(collection(db, "turmas"), (snap) => {
      setTotalTurmas(snap.size);
    });

    const unsubAlunos = onSnapshot(collection(db, "alunos"), (snap) => {
      setTotalAlunos(snap.size);
    });

    const qFaltasHoje = query(
      collection(db, "presencas"),
      where("data", ">=", inicioDoDia())
    );
    const unsubFaltas = onSnapshot(qFaltasHoje, (snap) => {
      const total = snap.docs.filter(
        (d) => d.data().estado === "falta" || d.data().estado === "atraso"
      ).length;
      setFaltasHoje(total);
    });

    const qChamadasMes = query(
      collection(db, "chamadas_atencao"),
      where("data", ">=", inicioDoMes())
    );
    const unsubChamadas = onSnapshot(qChamadasMes, (snap) => {
      setChamadasMes(snap.size);
    });

    const qReunioes = query(collection(db, "reunioes"), where("estado", "==", "pendente"));
    const unsubReunioes = onSnapshot(qReunioes, (snap) => {
      setReunioesPendentes(snap.size);
    });

    return () => {
      unsubTurmas();
      unsubAlunos();
      unsubFaltas();
      unsubChamadas();
      unsubReunioes();
    };
  }, [user, userData]);

  // Estatísticas do encarregado
  useEffect(() => {
    if (!user || userData?.role !== "encarregado") return;

    const qEducandos = query(
      collection(db, "alunos"),
      where("encarregados_ids", "array-contains", user.uid)
    );
    const unsubEducandos = onSnapshot(qEducandos, (snap) => {
      setMeusEducandos(snap.size);
    });

    return unsubEducandos;
  }, [user, userData]);

  // Notificações não lidas (todos os perfis)
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "notificacoes"),
      where("destinatario_id", "==", user.uid),
      where("lida", "==", false)
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setNotificacoesNaoLidas(snap.size);
    });
    return unsubscribe;
  }, [user]);

  const terminarSessao = async () => {
    await signOut(auth);
    router.replace("/");
  };

  if (loading || !user) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  const role = userData?.role;

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Cabeçalho */}
      <View className="bg-slate-900 pt-14 pb-8 px-6 rounded-b-3xl">
        <View className="flex-row justify-between items-start gap-3">
          <View className="flex-1">
            <Text className="text-white text-xl font-bold" numberOfLines={1}>
              Olá, {userData?.nome || user.email}! 👋
            </Text>
            <Text className="text-gray-300 mt-1">
              {ROLE_LABEL[role] || "Utilizador"}
            </Text>
          </View>
          <TouchableOpacity onPress={terminarSessao} className="shrink-0">
            <Text className="text-gray-300 text-sm">Sair</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cartões de estatísticas — deslocados para cima do cabeçalho */}
      <View className="px-6 -mt-6">
        {role === "encarregado" ? (
          <View className="flex-row gap-3">
            <StatCard
              icone="🎓"
              label="Meus educandos"
              valor={meusEducandos}
              cor="slate"
              atraso={0}
            />
            <StatCard
              icone="🔔"
              label="Notificações novas"
              valor={notificacoesNaoLidas}
              cor="blue"
              atraso={100}
            />
          </View>
        ) : (
          <View className="gap-3">
            <View className="flex-row gap-3">
              <StatCard icone="🏫" label="Turmas" valor={totalTurmas} cor="slate" atraso={0} />
              <StatCard icone="🧑‍🎓" label="Alunos" valor={totalAlunos} cor="blue" atraso={80} />
            </View>
            <View className="flex-row gap-3">
              <StatCard icone="📋" label="Faltas hoje" valor={faltasHoje} cor="red" atraso={160} />
              <StatCard icone="⚠️" label="Chamadas (mês)" valor={chamadasMes} cor="amber" atraso={240} />
            </View>
            <View className="flex-row gap-3">
              <StatCard icone="📅" label="Reuniões pendentes" valor={reunioesPendentes} cor="emerald" atraso={320} />
              <StatCard icone="🔔" label="Notificações novas" valor={notificacoesNaoLidas} cor="white" atraso={400} />
            </View>
          </View>
        )}
      </View>

      {/* Acesso rápido */}
      <View className="px-6 pt-8">
        <Text className="text-lg font-semibold text-slate-900 mb-4">
          Acesso rápido
        </Text>

        <View className="gap-3 pb-8">
          {role === "admin" && (
            <AcessoRapidoItem
              icone="⚙️"
              label="Painel de Administração"
              destaque
              onPress={() => router.push("/admin")}
            />
          )}

          <AcessoRapidoItem
            icone="🔔"
            label="Notificações"
            onPress={() => router.push("/notificacoes")}
          />

          <AcessoRapidoItem
            icone="🏫"
            label="Turmas e Alunos"
            onPress={() => router.push("/turmas")}
          />

          {role !== "encarregado" && (
            <>
              <AcessoRapidoItem
                icone="✅"
                label="Registar Presença"
                onPress={() => router.push("/registar-presenca")}
              />
              <AcessoRapidoItem
                icone="⚠️"
                label="Chamadas de Atenção"
                onPress={() => router.push("/chamadas-atencao")}
              />
            </>
          )}

          <AcessoRapidoItem
            icone="📅"
            label="Reuniões"
            onPress={() => router.push("/reunioes")}
          />
        </View>
      </View>
    </ScrollView>
  );
}