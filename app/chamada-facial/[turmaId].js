import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { reconhecerRosto } from "../../utils/reconhecerRosto";
import { useAuth } from "../../context/AuthContext";

const INTERVALO_CAPTURA_MS = 2500; // tempo entre tentativas de reconhecimento

export default function ChamadaFacialScreen() {
  const router = useRouter();
  const { turmaId } = useLocalSearchParams();
  const { user } = useAuth();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [ativo, setAtivo] = useState(true);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [alunosDaTurma, setAlunosDaTurma] = useState([]);
  const [presentesHoje, setPresentesHoje] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [contadorTentativas, setContadorTentativas] = useState(0);
  const intervaloRef = useRef(null);
  const processandoRef = useRef(false);

  useEffect(() => {
    const carregar = async () => {
      const qAlunos = query(collection(db, "alunos"), where("turma_id", "==", turmaId));
      const snap = await getDocs(qAlunos);
      const lista = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setAlunosDaTurma(lista);
      setCarregando(false);

      const comRosto = lista.filter((a) => a.face_token).length;
      if (comRosto === 0) {
        setUltimoResultado({
          tipo: "aviso",
          texto: "⚠️ Nenhum aluno desta turma tem rosto registado ainda.",
        });
      }
    };
    carregar();
  }, [turmaId]);

  useEffect(() => {
    if (!permissao?.granted || carregando) return;

    intervaloRef.current = setInterval(() => {
      if (ativo) tentarReconhecer();
    }, INTERVALO_CAPTURA_MS);

    return () => clearInterval(intervaloRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissao?.granted, carregando, ativo, alunosDaTurma, presentesHoje]);

  const tentarReconhecer = async () => {
    if (!cameraRef.current || processandoRef.current) return;
    processandoRef.current = true;
    setProcessando(true);
    setContadorTentativas((n) => n + 1);

    try {
      const foto = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      const resultado = await reconhecerRosto(foto.base64);

      if (!resultado) {
        setUltimoResultado({ tipo: "nao_reconhecido", texto: "🔍 Nenhum rosto reconhecido. Aproxima-te mais." });
        return;
      }

      const aluno = alunosDaTurma.find((a) => a.face_token === resultado.faceToken);

      if (!aluno) {
        setUltimoResultado({
          tipo: "nao_reconhecido",
          texto: `🔍 Rosto reconhecido (${resultado.confianca}%), mas não pertence a esta turma.`,
        });
        return;
      }

      if (presentesHoje.has(aluno.id)) {
        setUltimoResultado({ tipo: "ja_marcado", texto: `ℹ️ ${aluno.nome} já estava marcado` });
        return;
      }

      await addDoc(collection(db, "presencas"), {
        aluno_id: aluno.id,
        turma_id: turmaId,
        data: new Date(),
        estado: "presente",
        justificada: false,
        observacoes: "Marcado via reconhecimento facial",
        registado_por: user?.uid || "",
        criado_em: new Date(),
      });

      setPresentesHoje((prev) => new Set(prev).add(aluno.id));
      setUltimoResultado({
        tipo: "sucesso",
        texto: `✅ ${aluno.nome} — Presença marcada! (${resultado.confianca}%)`,
      });
    } catch (error) {
      setUltimoResultado({ tipo: "erro", texto: `❌ Erro: ${error.message}` });
    } finally {
      processandoRef.current = false;
      setProcessando(false);
    }
  };

  if (!permissao) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  if (!permissao.granted) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-6">
        <Text className="text-center text-gray-600 mb-4">
          Precisamos de acesso à câmara para a chamada automática.
        </Text>
        <TouchableOpacity onPress={pedirPermissao} className="bg-slate-900 rounded-lg py-3 px-6">
          <Text className="text-white font-semibold">Permitir Câmara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const corResultado = {
    sucesso: "bg-emerald-600",
    ja_marcado: "bg-amber-500",
    nao_reconhecido: "bg-gray-700",
    erro: "bg-red-600",
    aviso: "bg-amber-600",
  };

  return (
    <View className="flex-1 bg-black">
      <View className="bg-slate-900 pt-14 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Chamada Automática</Text>
        <Text className="text-gray-300 mt-1">
          {presentesHoje.size} de {alunosDaTurma.length} alunos marcados · {contadorTentativas} tentativas
        </Text>
      </View>

      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

      {processando && (
        <View className="absolute top-24 self-center bg-black/70 rounded-full px-4 py-2 flex-row items-center" style={{ gap: 8 }}>
          <ActivityIndicator size="small" color="#fff" />
          <Text className="text-white text-xs">A analisar rosto...</Text>
        </View>
      )}

      {ultimoResultado && (
        <View className={`${corResultado[ultimoResultado.tipo]} px-6 py-4`}>
          <Text className="text-white text-center font-semibold text-base">
            {ultimoResultado.texto}
          </Text>
        </View>
      )}

      <View className="bg-slate-900 px-6 py-6">
        <Text className="text-gray-300 text-center text-sm mb-4">
          Coloca o rosto em frente à câmara. A presença é marcada automaticamente.
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-lg py-4">
          <Text className="text-slate-900 text-center font-semibold text-base">
            Terminar Chamada
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}