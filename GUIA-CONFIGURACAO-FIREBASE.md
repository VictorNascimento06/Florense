# 🔥 GUIA DE CONFIGURAÇÃO DO FIREBASE - FLORENSE PROJECT

## 📋 Índice
1. [Criando o Projeto no Firebase](#1-criando-o-projeto-no-firebase)
2. [Configurando Autenticação](#2-configurando-autenticação)
3. [Configurando Firestore](#3-configurando-firestore)
4. [Configurando Storage](#4-configurando-storage)
5. [Obtendo as Credenciais](#5-obtendo-as-credenciais)
6. [Integrando no Código](#6-integrando-no-código)
7. [Estrutura do Banco de Dados](#7-estrutura-do-banco-de-dados)
8. [Regras de Segurança](#8-regras-de-segurança)

---

## 1. Criando o Projeto no Firebase

### Passo 1: Acessar o Console Firebase
1. Acesse: https://console.firebase.google.com/
2. Faça login com sua conta Google
3. Clique em **"Adicionar projeto"** ou **"Create a project"**

### Passo 2: Configurar o Projeto
1. **Nome do projeto**: Digite `florense-project` (ou o nome que preferir)
2. **Google Analytics**: Pode deixar ativado (recomendado)
3. Clique em **"Criar projeto"**
4. Aguarde a criação (leva alguns segundos)

---

## 2. Configurando Autenticação

### Passo 1: Ativar Authentication
1. No menu lateral, clique em **"Authentication"**
2. Clique em **"Get Started"** ou **"Começar"**

### Passo 2: Habilitar Email/Senha
1. Vá na aba **"Sign-in method"**
2. Clique em **"Email/Password"**
3. **Ative** o primeiro switch (Email/senha)
4. Clique em **"Salvar"**

### Passo 3: Configurar Domínios Autorizados
1. Na mesma página, role até **"Authorized domains"**
2. Adicione os domínios onde seu app vai rodar:
   - `localhost`
   - Seu domínio de produção (ex: `seusite.com`)

---

## 3. Configurando Firestore

### Passo 1: Criar Banco de Dados
1. No menu lateral, clique em **"Firestore Database"**
2. Clique em **"Create database"**

### Passo 2: Escolher Modo
1. Selecione **"Start in production mode"** (vamos configurar as regras depois)
2. Clique em **"Next"**

### Passo 3: Escolher Localização
1. Escolha a localização mais próxima:
   - Para Brasil: **`southamerica-east1` (São Paulo)**
2. Clique em **"Enable"**

### Passo 4: Criar Coleções Iniciais
Crie as seguintes coleções (vazio por enquanto):
- `users`
- `workspaces`
- `boards`
- `cards`
- `userAccess`

---

## 4. Configurando Storage

### Passo 1: Ativar Storage
1. No menu lateral, clique em **"Storage"**
2. Clique em **"Get started"**
3. Aceite as regras padrão
4. Escolha a mesma localização do Firestore
5. Clique em **"Done"**

### Passo 2: Criar Estrutura de Pastas
Crie as seguintes pastas:
- `attachments/` - Para anexos de cards
- `avatars/` - Para fotos de perfil
- `backgrounds/` - Para backgrounds de boards

---

## 5. Obtendo as Credenciais

### Passo 1: Adicionar Web App
1. No **Overview** do projeto (ícone de engrenagem ⚙️)
2. Clique em **"Project settings"**
3. Role até **"Your apps"**
4. Clique no ícone **</>** (Web)

### Passo 2: Registrar o App
1. **App nickname**: Digite `Florense Web`
2. **Firebase Hosting**: Pode deixar desmarcado por enquanto
3. Clique em **"Register app"**

### Passo 3: Copiar Configuração
Você verá algo assim:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",
  authDomain: "florense-project.firebaseapp.com",
  projectId: "florense-project",
  storageBucket: "florense-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
  measurementId: "G-ABCD1234"
};
```

**COPIE ESSES VALORES!** Você vai precisar deles.

---

## 6. Integrando no Código

### Passo 1: Atualizar firebase-config.js
Abra o arquivo `firebase-config.js` e substitua as credenciais:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",  // Cole aqui
    authDomain: "SEU_PROJECT_ID.firebaseapp.com",  // Cole aqui
    projectId: "SEU_PROJECT_ID",  // Cole aqui
    storageBucket: "SEU_PROJECT_ID.appspot.com",  // Cole aqui
    messagingSenderId: "SEU_MESSAGING_SENDER_ID",  // Cole aqui
    appId: "SEU_APP_ID",  // Cole aqui
    measurementId: "SEU_MEASUREMENT_ID"  // Cole aqui (opcional)
};
```

### Passo 2: Adicionar SDKs do Firebase nos HTMLs
Adicione essas linhas **ANTES** de carregar seus scripts:

```html
<!-- Firebase SDK -->
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-storage-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics-compat.js"></script>

<!-- Seus arquivos -->
<script src="firebase-config.js"></script>
<script src="firebase-service.js"></script>
<script src="script.js"></script>
```

---

## 7. Estrutura do Banco de Dados

### Coleção: `users`
```
users/{userId}
  ├── uid: string
  ├── username: string
  ├── email: string
  ├── isAdmin: boolean
  ├── photoURL: string | null
  ├── workspaces: array[workspaceId]
  ├── createdAt: timestamp
  └── lastLoginAt: timestamp
```

### Coleção: `workspaces`
```
workspaces/{workspaceId}
  ├── name: string
  ├── description: string
  ├── backgroundUrl: string | null
  ├── ownerId: string (userId)
  ├── members: array[userId]
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

### Coleção: `boards`
```
boards/{boardId}
  ├── workspaceId: string
  ├── name: string
  ├── backgroundColor: string
  ├── backgroundImage: string | null
  ├── ownerId: string (userId)
  ├── members: array[userId]
  ├── lists: array[
  │     {
  │       id: string,
  │       name: string,
  │       position: number,
  │       createdAt: string
  │     }
  │   ]
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

### Coleção: `cards`
```
cards/{cardId}
  ├── boardId: string
  ├── listId: string
  ├── title: string
  ├── description: string
  ├── labels: array[string]
  ├── members: array[userId]
  ├── dueDate: timestamp | null
  ├── attachments: array[
  │     {
  │       name: string,
  │       url: string,
  │       type: string
  │     }
  │   ]
  ├── comments: array[
  │     {
  │       id: string,
  │       userId: string,
  │       userName: string,
  │       text: string,
  │       createdAt: string
  │     }
  │   ]
  ├── checklist: array[
  │     {
  │       id: string,
  │       text: string,
  │       completed: boolean
  │     }
  │   ]
  ├── createdBy: string (userId)
  ├── createdAt: timestamp
  └── updatedAt: timestamp
```

### Coleção: `userAccess`
```
userAccess/{accessId}
  ├── userId: string
  ├── username: string
  ├── email: string
  ├── timestamp: timestamp
  ├── userAgent: string
  └── platform: string
```

---

## 8. Regras de Segurança

### Regras do Firestore
Vá em **Firestore Database > Rules** e cole:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Função auxiliar para verificar autenticação
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Função para verificar se é o próprio usuário
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    // Função para verificar se é admin
    function isAdmin() {
      return isSignedIn() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    
    // Função para verificar se é membro
    function isMember(memberList) {
      return isSignedIn() && request.auth.uid in memberList;
    }
    
    // ===== USERS =====
    match /users/{userId} {
      allow read: if isSignedIn();
      allow create: if isOwner(userId);
      allow update, delete: if isOwner(userId) || isAdmin();
    }
    
    // ===== WORKSPACES =====
    match /workspaces/{workspaceId} {
      allow read: if isSignedIn() && isMember(resource.data.members);
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
                               (resource.data.ownerId == request.auth.uid || isAdmin());
    }
    
    // ===== BOARDS =====
    match /boards/{boardId} {
      allow read: if isSignedIn() && isMember(resource.data.members);
      allow create: if isSignedIn();
      allow update, delete: if isSignedIn() && 
                               (resource.data.ownerId == request.auth.uid || isAdmin());
    }
    
    // ===== CARDS =====
    match /cards/{cardId} {
      allow read: if isSignedIn();
      allow create, update: if isSignedIn();
      allow delete: if isSignedIn() && 
                       (resource.data.createdBy == request.auth.uid || isAdmin());
    }
    
    // ===== USER ACCESS (apenas admin pode ler) =====
    match /userAccess/{accessId} {
      allow read: if isAdmin();
      allow create: if isSignedIn();
      allow update, delete: if false;
    }
  }
}
```

### Regras do Storage
Vá em **Storage > Rules** e cole:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Função para verificar autenticação
    function isSignedIn() {
      return request.auth != null;
    }
    
    // Função para verificar tamanho do arquivo (máx 10MB)
    function isValidSize() {
      return request.resource.size < 10 * 1024 * 1024;
    }
    
    // Avatares - apenas o próprio usuário pode fazer upload
    match /avatars/{userId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                      request.auth.uid == userId && 
                      isValidSize();
    }
    
    // Anexos - qualquer usuário autenticado pode fazer upload
    match /attachments/{userId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                      request.auth.uid == userId && 
                      isValidSize();
    }
    
    // Backgrounds - qualquer usuário autenticado pode fazer upload
    match /backgrounds/{userId}/{fileName} {
      allow read: if isSignedIn();
      allow write: if isSignedIn() && 
                      request.auth.uid == userId && 
                      isValidSize();
    }
  }
}
```

---

## 🚀 Próximos Passos

1. ✅ Configure as credenciais no `firebase-config.js`
2. ✅ Adicione os SDKs do Firebase nos HTMLs
3. ✅ Configure as regras de segurança
4. ✅ Teste o cadastro de um usuário
5. ✅ Teste a criação de um workspace
6. ✅ Teste a criação de um board

---

## 🔧 Testando a Integração

### Teste 1: Verificar Inicialização
Abra o console do navegador (F12) e você deve ver:
```
✅ Firebase inicializado com sucesso!
✅ Firebase Service carregado!
```

### Teste 2: Criar Usuário
No console, execute:
```javascript
await firebaseService.registerUser('teste', 'teste@email.com', '123456');
```

### Teste 3: Fazer Login
No console, execute:
```javascript
await firebaseService.loginUser('teste@email.com', '123456');
```

Se tudo funcionar, você está pronto! 🎉

---

## 📞 Suporte

Se tiver problemas:
1. Verifique o console do navegador (F12) para erros
2. Verifique se as regras de segurança estão configuradas
3. Verifique se as credenciais estão corretas
4. Entre em contato com o suporte técnico

---

## 🔒 Segurança

**IMPORTANTE:**
- Nunca compartilhe suas credenciais do Firebase
- Nunca commite o `firebase-config.js` com credenciais reais no Git público
- Use variáveis de ambiente em produção
- Mantenha as regras de segurança sempre atualizadas

---

**Última atualização:** Outubro 2025
**Versão:** 1.0
