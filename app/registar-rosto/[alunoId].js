import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter, useLocalSearchParams } from "expo-router";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { registarRostoDoAluno } from "../../utils/registarRosto";
import { uploadFotoAluno } from "../../utils/uploadFoto";

export default function RegistarRostoScreen() {
  const router = useRouter();
  const { alunoId } = useLocalSearchParams();
  const [permissao, pedirPermissao] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [processando, setProcessando] = useState(false);
  const [nomeAluno, setNomeAluno] = useState("");

  useState(() => {
    (async () => {
      const alunoSnap = await getDoc(doc(db, "alunos", alunoId));
      if (alunoSnap.exists()) setNomeAluno(alunoSnap.data().nome);
    })();
  }, []);

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
          Precisamos de acesso à câmara para registar o rosto do aluno.
        </Text>
        <TouchableOpacity onPress={pedirPermissao} className="bg-slate-900 rounded-lg py-3 px-6">
          <Text className="text-white font-semibold">Permitir Câmara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tirarFotoERegistar = async () => {
    if (!cameraRef.current || processando) return;
    setProcessando(true);
    try {
      const foto = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      // 1. Regista o rosto no Face++ (deteção + adição ao FaceSet)
      const faceToken = await registarRostoDoAluno(foto.base64);

      // 2. Reaproveita a mesma foto como foto de perfil (upload para o Storage)
      let fotoUrl = null;
      try {
        fotoUrl = await uploadFotoAluno(alunoId, foto.base64);
      } catch (erroUpload) {
        console.log("Rosto registado, mas falhou o upload da foto de perfil:", erroUpload);
      }

      const dadosParaAtualizar = { face_token: faceToken };
      if (fotoUrl) dadosParaAtualizar.foto_url = fotoUrl;

      await updateDoc(doc(db, "alunos", alunoId), dadosParaAtualizar);

      const mensagem = fotoUrl
        ? `Rosto de ${nomeAluno || "aluno"} registado e foto de perfil atualizada!`
        : `Rosto de ${nomeAluno || "aluno"} registado! (a foto de perfil não foi guardada — tenta editar o aluno para adicionar uma foto manualmente)`;

      Alert.alert("Sucesso", mensagem, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Erro ao registar rosto", error.message);
    } finally {
      setProcessando(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <View className="bg-slate-900 pt-14 pb-4 px-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-gray-300">‹ Voltar</Text>
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold">Registar Rosto</Text>
        <Text className="text-gray-300 mt-1">{nomeAluno || "Aluno"}</Text>
      </View>

      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front" />

      <View className="bg-slate-900 px-6 py-6">
        <Text className="text-gray-300 text-center text-sm mb-4">
          Pede ao aluno para olhar diretamente para a câmara, com boa iluminação e sem óculos escuros.
        </Text>
        <TouchableOpacity
          onPress={tirarFotoERegistar}
          disabled={processando}
          className="bg-emerald-600 rounded-lg py-4"
        >
          {processando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white text-center font-semibold text-base">
              📸 Tirar Foto e Registar
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}