# 🔧 DEBUG - ERRO NO CADASTRO

## ⚠️ POSSÍVEIS CAUSAS

### 1. **Regras do Firestore não configuradas**

As regras de segurança do Firestore podem estar bloqueando a criação de usuários.

**Solução:**

1. Acesse: https://console.firebase.google.com/project/florense-project/firestore/rules

2. Cole estas regras:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Permitir criação de usuário durante cadastro
    match /users/{userId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == userId;
      allow update, delete: if request.auth != null && 
                               (request.auth.uid == userId || 
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Permitir escrita em userAccess durante cadastro
    match /userAccess/{accessId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
    
    // Workspaces
    match /workspaces/{workspaceId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && 
                               (resource.data.ownerId == request.auth.uid || 
                                get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true);
    }
    
    // Boards
    match /boards/{boardId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
    
    // Cards
    match /cards/{cardId} {
      allow read: if request.auth != null;
      allow create, update: if request.auth != null;
      allow delete: if request.auth != null;
    }
  }
}
```

3. Clique em **"Publicar"**

---

### 2. **Domínio não autorizado no Authentication**

O domínio do site pode não estar autorizado no Firebase Authentication.

**Solução:**

1. Acesse: https://console.firebase.google.com/project/florense-project/authentication/settings

2. Na seção **"Authorized domains"**, verifique se tem:
   - `florense-project.web.app`
   - `florense-project.firebaseapp.com`

3. Se não tiver, clique em **"Add domain"** e adicione

---

### 3. **Ver erro específico no Console**

Para ver o erro exato:

1. No site, pressione **F12**
2. Vá na aba **"Console"**
3. Tente cadastrar novamente
4. Veja qual erro aparece em vermelho
5. **Me envie uma captura do Console**

---

## 🔍 TESTE RÁPIDO

### Opção 1: Console do navegador

```javascript
// Cole isto no Console (F12) e pressione Enter:
console.log('Firebase:', typeof firebase !== 'undefined' ? '✅' : '❌');
console.log('Auth:', typeof auth !== 'undefined' ? '✅' : '❌');
console.log('Firestore:', typeof db !== 'undefined' ? '✅' : '❌');
console.log('FirebaseService:', typeof firebaseService !== 'undefined' ? '✅' : '❌');
```

Todos devem mostrar ✅

### Opção 2: Testar cadastro manualmente

```javascript
// Cole isto no Console para testar o cadastro direto:
firebaseService.registerUser('teste', 'teste@email.com', '123456')
  .then(result => console.log('Resultado:', result))
  .catch(error => console.error('Erro:', error));
```

---

## 📝 PRÓXIMOS PASSOS

1. **Configurar regras do Firestore** (link acima)
2. **Verificar domínios autorizados** (link acima)
3. **Abrir Console (F12)** e me enviar captura dos erros

---

## 🆘 SE NADA FUNCIONAR

Como alternativa temporária, posso criar um sistema que:
1. Mostra o erro específico na tela
2. Permite cadastro sem email de confirmação
3. Testa conexão com Firebase antes de cadastrar

Quer que eu faça isso?
