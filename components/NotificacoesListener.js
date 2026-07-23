import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { pedirPermissaoNotificacoes, escutarNotificacoes } from "../utils/notificacoesLocais";

export default function NotificacoesListener() {
  const { user, userData } = useAuth();
  const permissaoPedida = useRef(false);

  useEffect(() => {
    // Só ativa o listener para encarregados — professores não precisam de
    // "escutar" notificações que eles próprios estão a gerar.
    if (!user || !userData || userData.role !== "encarregado") return;

    let unsubscribe = () => {};

    (async () => {
      if (!permissaoPedida.current) {
        permissaoPedida.current = true;
        await pedirPermissaoNotificacoes();
      }
      unsubscribe = escutarNotificacoes(user.uid);
    })();

    return () => unsubscribe();
  }, [user, userData]);

  return null; // não renderiza nada — só corre a lógica
}