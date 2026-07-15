# Controlo de Presença e Faltas

App de controlo de presença e faltas de alunos, construído com React Native (Expo) e Firebase Firestore.

## Requisitos

- **Node.js** (verifique a versão exata no arquivo `.nvmrc`)
- **npm** (vem junto com o Node)
- **Expo Go** instalado no telemóvel (App Store / Play Store) — para testar em dispositivo físico
- **Git**

## Como rodar o projeto do zero

```powershell
git clone <url-do-repositorio>
cd controlo-presenca-faltas
npm ci
npx expo start -c
```

Depois de rodar `npx expo start -c`, escaneie o QR code com o app **Expo Go** (Android) ou com a **Câmera** (iOS), estando o telemóvel na mesma rede Wi-Fi do computador.

> ⚠️ **Importante:** use sempre `npm ci` (não `npm install`) ao configurar o projeto pela primeira vez num PC novo. O `npm ci` instala exatamente as versões travadas no `package-lock.json`, evitando inconsistências entre máquinas.

## Sobre o arquivo `.npmrc`

Este projeto tem conflitos conhecidos de *peer dependencies* entre `react-native-reanimated`, `nativewind` e `expo-router` (comum em projetos Expo com essas combinações de libs). Por isso, o repositório inclui um arquivo `.npmrc` na raiz com:

```
legacy-peer-deps=true
```

Isso faz o `npm install`/`npm ci` sempre resolver as dependências em modo "legado", sem precisar adicionar a flag `--legacy-peer-deps` manualmente. **Não delete esse arquivo.**

## Problemas comuns e soluções

### Erro `ERESOLVE could not resolve` ao instalar pacotes novos
Isso pode acontecer se você instalar uma dependência nova sem passar pelo `.npmrc` (por exemplo, rodando comandos fora da raiz do projeto). Rode:
```powershell
npm install <pacote> --legacy-peer-deps
```
E depois verifique se as versões continuam compatíveis:
```powershell
npx expo install --fix
```

### Erro `Project is incompatible with this version of Expo Go`
O app Expo Go no seu telemóvel está desatualizado em relação à versão do SDK do projeto (atualmente **SDK 54**). Atualize o Expo Go pela loja de apps.

### Erro `Cannot find module 'X'` ao iniciar o Metro
Algum pacote não foi instalado corretamente. Faça uma reinstalação limpa:
```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```
(o `.npmrc` já garante o modo `legacy-peer-deps` automaticamente)

### Erros do PowerShell ao rodar `Remove-Item -Recurse -Force node_modules`
No Windows, caminhos muito longos dentro do `node_modules` podem impedir a remoção completa da pasta. Se isso acontecer, instale o `rimraf` globalmente e use-o em vez do `Remove-Item`:
```powershell
npm install -g rimraf
rimraf node_modules
```

### `FirebaseError: permission-denied` em algum listener do Firestore
Normalmente é transitório — acontece quando o app tenta ler dados do Firestore antes do estado de autenticação (login) terminar de carregar. Se o erro for consistente (aparece sempre, não só uma vez), verifique as regras do Firestore em `firestore.rules` e confirme que o utilizador autenticado tem o `role` correto no documento `users/{uid}`.

## Estrutura relevante

- `app/` — rotas e telas (Expo Router)
- `firestore.rules` — regras de segurança do Firestore
- `.npmrc` — configuração de instalação de dependências (não remover)
- `.nvmrc` — versão do Node usada no projeto

## Versões principais

| Pacote | Versão |
|---|---|
| Expo SDK | 54 |
| React Native | 0.81.5 |
| react-native-reanimated | ~4.1.1 |
| expo-router | ~6.0.24 |
| nativewind | ^4.2.6 |