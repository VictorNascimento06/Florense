# 🚀 ACESSO RÁPIDO - FLORENSE PROJECT

## 🌐 PÁGINAS DO SISTEMA

### ⚡ LINKS DIRETOS (localhost:8000)

| Página | URL | Descrição |
|--------|-----|-----------|
| **LOGIN** | `http://localhost:8000/login.html` | 🔐 Página inicial - Login e Cadastro |
| **RECUPERAR** | `http://localhost:8000/recuperar.html` | 🔑 Recuperação de senha |
| **TRELLO-HOME** | `http://localhost:8000/trello-home.html` | 📋 Dashboard principal (após login) |
| **DASHBOARD** | `http://localhost:8000/dashboard.html` | 📊 Dashboard alternativo |
| **ADMIN** | `http://localhost:8000/admin.html` | ⚙️ Painel administrativo |

---

## 🎯 FLUXO DO SISTEMA

```
1. LOGIN (login.html)
   ↓
   [Usuário cadastra/faz login]
   ↓
2. TRELLO-HOME (trello-home.html)
   ↓
   [Usuário usa o sistema]
   ↓
3. ADMIN (admin.html) - Se for administrador
```

---

## 🔐 PÁGINA INICIAL: LOGIN

**URL principal:**
```
http://localhost:8000/login.html
```

Esta é a porta de entrada do seu sistema!

---

## 📝 CREDENCIAIS DE TESTE

### Usuário Admin (padrão):
```
Usuário: admin
Senha: admin123
```
→ Redireciona para: `admin.html`

### Usuário Normal:
```
Criar novo usuário na tela de cadastro
```
→ Redireciona para: `trello-home.html`

---

## 🚀 COMANDOS PARA INICIAR O SERVIDOR

### Iniciar servidor:
```powershell
cd "c:\Users\vhnas\OneDrive\Área de Trabalho\Florense\Projeto princinpal"
npx http-server -p 8000
```

### Abrir diretamente no login:
```powershell
npx http-server -p 8000 -o login.html
```

### Parar servidor:
Pressione `Ctrl+C` no terminal

---

## 📱 ESTRUTURA DAS PÁGINAS

### 1. **login.html** (PÁGINA INICIAL)
- ✅ Formulário de login
- ✅ Formulário de cadastro
- ✅ Link para recuperação de senha
- ✅ Integração com Firebase Authentication

### 2. **recuperar.html**
- 🔑 Recuperação de senha
- 📧 Envio de email via Firebase

### 3. **trello-home.html** (DASHBOARD PRINCIPAL)
- 📋 Workspaces
- 📊 Boards (quadros)
- 🎴 Cards
- 👥 Colaboração
- 🔔 Notificações

### 4. **dashboard.html**
- 📈 Dashboard alternativo
- 📊 Visualizações

### 5. **admin.html** (PAINEL ADMIN)
- 👥 Gerenciar usuários
- 📊 Estatísticas
- ⚙️ Configurações
- 📈 Analytics

---

## ✅ ARQUIVOS IMPORTANTES

```
Projeto princinpal/
├── login.html              ← PÁGINA INICIAL ⭐
├── recuperar.html          ← Recuperar senha
├── trello-home.html        ← Dashboard principal
├── dashboard.html          ← Dashboard alternativo
├── admin.html              ← Painel admin
│
├── firebase-config.js      ← Configuração Firebase ✅
├── firebase-service.js     ← Serviços Firebase ✅
├── script-auth-firebase.js ← Autenticação ✅
│
├── estilo.css              ← Estilos do login
├── trello-home.css         ← Estilos do dashboard
└── admin.css               ← Estilos do admin
```

---

## 🎯 TESTE RÁPIDO

### 1. Iniciar servidor:
```powershell
cd "c:\Users\vhnas\OneDrive\Área de Trabalho\Florense\Projeto princinpal"
npx http-server -p 8000 -o login.html
```

### 2. No navegador:
```
http://localhost:8000/login.html
```

### 3. Criar conta:
- Clique em "Cadastre-se"
- Preencha os dados
- Clique em "Cadastrar"

### 4. Verificar Firebase:
- Vá ao Firebase Console
- Authentication > Users
- Veja o usuário criado

---

## 📋 NAVEGAÇÃO DO SISTEMA

```
LOGIN (login.html)
  ├─> Cadastro → Email confirmação → TRELLO-HOME
  ├─> Login Normal → TRELLO-HOME
  ├─> Login Admin → ADMIN
  └─> Esqueci senha → RECUPERAR

RECUPERAR (recuperar.html)
  └─> Email enviado → LOGIN

TRELLO-HOME (trello-home.html)
  ├─> Workspaces
  ├─> Boards
  ├─> Cards
  └─> Logout → LOGIN

ADMIN (admin.html)
  ├─> Gerenciar usuários
  ├─> Estatísticas
  └─> Logout → LOGIN
```

---

## 🔥 FIREBASE CONFIGURADO

```
✅ Authentication (Email/Password)
✅ Firestore Database
✅ Storage
✅ Analytics

Credenciais configuradas em:
→ firebase-config.js
```

---

## 🎨 CUSTOMIZAÇÃO

Para personalizar, edite:
- **Cores:** `estilo.css`, `trello-home.css`, `admin.css`
- **Logo:** Adicione imagem e atualize HTMLs
- **Textos:** Edite diretamente nos arquivos HTML

---

## 🚦 STATUS DO PROJETO

```
✅ Firebase configurado
✅ Autenticação funcionando
✅ Banco de dados pronto
✅ Storage configurado
✅ Sistema completo

🎯 Página inicial: login.html
🌐 Servidor: localhost:8000
📱 Pronto para usar!
```

---

## 📞 ACESSO RÁPIDO

**Sempre use:**
```
http://localhost:8000/login.html
```

**Salve este link nos favoritos!** ⭐

---

## 🎉 SEU SISTEMA ESTÁ PRONTO!

Páginas disponíveis:
1. ✅ LOGIN - login.html
2. ✅ RECUPERAR - recuperar.html
3. ✅ TRELLO-HOME - trello-home.html
4. ✅ DASHBOARD - dashboard.html
5. ✅ ADMIN - admin.html

**Comece por:** `http://localhost:8000/login.html`

Boa sorte! 🚀
