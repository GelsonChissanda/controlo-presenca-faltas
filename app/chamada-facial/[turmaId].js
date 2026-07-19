import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { reconhecerRosto } from "../../utils/reconhecerRosto";
import { useAuth } from "../../context/AuthContext";
import { useSomConfirmacao } from "../../utils/usarSomConfirmacao";
import ReconhecimentoOverlay from "../../components/ReconhecimentoOverlay";

export default function ChamadaFacialScreen() {
  const router = useRouter();
  const { turmaId } = useLocalSearchParams();
  const { user } = useAuth();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [ultimoResultado, setUltimoResultado] = useState(null);
  const [alunosDaTurma, setAlunosDaTurma] = useState([]);
  const [presentesHoje, setPresentesHoje] = useState(new Set());
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);

  // controla o cartão central: null = escondido
  // { tipo: "sucesso", aluno, confianca } | { tipo: "erro", mensagem } | { tipo: "ja_marcado", aluno }
  const [cartaoAtivo, setCartaoAtivo] = useState(null);

  const { tocarSucesso, tocarErro } = useSomConfirmacao();

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

  const tentarReconhecer = async () => {
    if (!cameraRef.current || processando) return;
    setProcessando(true);

    try {
      const foto = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.5 });
      const resultado = await reconhecerRosto(foto.base64);

      if (resultado.facesetVazio) {
        setUltimoResultado({
          tipo: "erro",
          texto: "❌ O FaceSet está vazio ou nenhum rosto foi encontrado. Confirma o registo dos rostos.",
        });
        return;
      }

      if (!resultado.reconhecido) {
        tocarErro();
        setCartaoAtivo({
          tipo: "erro",
          mensagem: `Confiança: ${resultado.confianca.toFixed(1)}%. Tenta de novo com boa luz.`,
        });
        setUltimoResultado({
          tipo: "nao_reconhecido",
          texto: `🔍 Não reconhecido (confiança: ${resultado.confianca.toFixed(1)}%). Tenta de novo com boa luz.`,
        });
        return;
      }

      const aluno = alunosDaTurma.find((a) => a.face_token === resultado.faceToken);

      if (!aluno) {
        tocarErro();
        setCartaoAtivo({
          tipo: "erro",
          mensagem: "Rosto reconhecido, mas não pertence a esta turma.",
        });
        setUltimoResultado({
          tipo: "nao_reconhecido",
          texto: `🔍 Rosto reconhecido (${resultado.confianca.toFixed(1)}%), mas não pertence a esta turma.`,
        });
        return;
      }

      if (presentesHoje.has(aluno.id)) {
        // já marcado nesta sessão — mostra o cartão da prancheta + polegar, sem novo registo
        setCartaoAtivo({ tipo: "ja_marcado", aluno });
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

      tocarSucesso();
      setCartaoAtivo({ tipo: "sucesso", aluno, confianca: resultado.confianca });

      setUltimoResultado({
        tipo: "sucesso",
        texto: `✅ ${aluno.nome} — Presença marcada! (${resultado.confianca.toFixed(1)}%)`,
      });
    } catch (error) {
      setUltimoResultado({ tipo: "erro", texto: `❌ Erro: ${error.message}` });
    } finally {
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

  // a barra de texto simples só aparece para os casos que NÃO têm cartão central próprio
  // (sucesso, nao_reconhecido e ja_marcado já têm cartão central dedicado)
  const casosComCartao = ["sucesso", "nao_reconhecido", "ja_marcado"];
  const mostrarBarraTexto =
    ultimoResultado && !casosComCartao.includes(ultimoResultado.tipo);

  return (
    <View className="flex-1 bg-black">
      <View className="bg-slate-900 pt-14 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Chamada Automática</Text>
        <Text className="text-gray-300 mt-1">
          {presentesHoje.size} de {alunosDaTurma.length} alunos marcados
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

        {/* cartão central — sucesso (✓ verde) | não-reconhecido (✕ vermelho) | já marcado (prancheta + 👍) */}
        {cartaoAtivo && (
          <ReconhecimentoOverlay
            tipo={cartaoAtivo.tipo}
            aluno={cartaoAtivo.aluno}
            confianca={cartaoAtivo.confianca}
            mensagemErro={cartaoAtivo.mensagem}
            onFim={() => setCartaoAtivo(null)}
          />
        )}
      </View>

      {/* barra de texto só para casos técnicos: erro de rede, aviso de faceset vazio */}
      {mostrarBarraTexto && (
        <View className={`${corResultado[ultimoResultado.tipo]} px-6 py-4`}>
          <Text className="text-white text-center font-semibold text-base">
            {ultimoResultado.texto}
          </Text>
        </View>
      )}

      <View className="bg-slate-900 px-6 py-6">
        <Text className="text-gray-300 text-center text-sm mb-4">
          Coloca o rosto do aluno em frente à câmara e clica no botão.
        </Text>

        <TouchableOpacity
          onPress={tentarReconhecer}
          disabled={processando}
          className="bg-emerald-600 rounded-lg py-4 mb-3"
        >
          {processando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              📸 Reconhecer Aluno
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} className="bg-white rounded-lg py-4">
          <Text className="text-slate-900 text-center font-semibold text-base">
            Terminar Chamada
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}