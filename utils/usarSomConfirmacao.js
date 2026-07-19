import { useEffect, useRef, useCallback } from "react";
import { Audio } from "expo-av";

/**
 * Hook que pré-carrega os sons de confirmação (sucesso e erro) uma única vez
 * e devolve duas funções para os tocar instantaneamente, sem delay.
 */
export function useSomConfirmacao() {
  const somSucessoRef = useRef(null);
  const somErroRef = useRef(null);

  useEffect(() => {
    let montado = true;

    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
        });

        const [{ sound: somSucesso }, { sound: somErro }] = await Promise.all([
          Audio.Sound.createAsync(require("../assets/sounds/sucesso.wav")),
          Audio.Sound.createAsync(require("../assets/sounds/erro.wav")),
        ]);

        if (montado) {
          somSucessoRef.current = somSucesso;
          somErroRef.current = somErro;
        } else {
          somSucesso.unloadAsync();
          somErro.unloadAsync();
        }
      } catch (erro) {
        console.log("Não foi possível pré-carregar os sons de confirmação:", erro);
      }
    })();

    return () => {
      montado = false;
      if (somSucessoRef.current) somSucessoRef.current.unloadAsync();
      if (somErroRef.current) somErroRef.current.unloadAsync();
    };
  }, []);

  const tocarSucesso = useCallback(async () => {
    try {
      if (somSucessoRef.current) {
        await somSucessoRef.current.setPositionAsync(0);
        await somSucessoRef.current.playAsync();
      }
    } catch (erro) {
      console.log("Erro ao tocar som de sucesso:", erro);
    }
  }, []);

  const tocarErro = useCallback(async () => {
    try {
      if (somErroRef.current) {
        await somErroRef.current.setPositionAsync(0);
        await somErroRef.current.playAsync();
      }
    } catch (erro) {
      console.log("Erro ao tocar som de erro:", erro);
    }
  }, []);

  return { tocarSucesso, tocarErro };
}