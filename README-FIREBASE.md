# 🌟 FLORENSE PROJECT - Sistema de Gerenciamento de Projetos

<div align="center">

![Florense Logo](https://via.placeholder.com/150x150?text=FLORENSE)

### Plataforma completa de gerenciamento de projetos e colaboração

[![Firebase](https://img.shields.io/badge/Firebase-9.22.0-orange?logo=firebase)](https://firebase.google.com/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow?logo=javascript)](https://developer.mozilla.org/pt-BR/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/pt-BR/docs/Web/CSS)

[Demo](#) • [Documentação](#documentação) • [Instalação](#instalação) • [Suporte](#suporte)

</div>

---

## 📋 Sobre o Projeto

O **Florense Project** é uma plataforma moderna e intuitiva para gerenciamento de projetos, inspirada no Trello, com recursos avançados de colaboração em tempo real. Desenvolvido com tecnologias web modernas e integrado ao Firebase para uma experiência robusta e escalável.

### ✨ Principais Recursos

- 🔐 **Autenticação Segura**: Sistema completo de login e cadastro com Firebase Authentication
- 📊 **Workspaces**: Organize projetos em espaços de trabalho personalizados
- 📋 **Boards (Quadros)**: Crie quadros ilimitados para cada workspace
- 📝 **Cards (Cartões)**: Sistema Kanban com drag-and-drop
- 👥 **Colaboração**: Compartilhe workspaces e boards com sua equipe
- 💬 **Comentários**: Sistema de comentários em tempo real nos cards
- 📎 **Anexos**: Upload de arquivos e imagens
- 🎨 **Personalização**: Temas e backgrounds customizáveis
- 📱 **Responsivo**: Funciona perfeitamente em desktop, tablet e mobile
- 🔔 **Notificações**: Sistema de notificações em tempo real
- 📈 **Analytics**: Dashboard administrativo com estatísticas de uso
- 🌐 **Offline First**: Funciona mesmo sem conexão (com cache)

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna com Flexbox e Grid
- **JavaScript ES6+** - Lógica da aplicação
- **Font Awesome** - Ícones
- **Boxicons** - Ícones adicionais

### Backend & Serviços
- **Firebase Authentication** - Gerenciamento de usuários
- **Cloud Firestore** - Banco de dados NoSQL em tempo real
- **Firebase Storage** - Armazenamento de arquivos
- **Firebase Analytics** - Análise de uso
- **EmailJS** - Envio de emails

### Arquitetura
- **SPA (Single Page Application)** - Navegação fluida
- **PWA Ready** - Preparado para Progressive Web App
- **Real-time Sync** - Sincronização em tempo real
- **Offline Support** - Suporte offline com cache

---

## 📁 Estrutura do Projeto

```
Florense/
├── 📄 index.html                    # Página inicial/landing page
├── 📄 login.html                    # Página de login e cadastro
├── 📄 trello-home.html              # Dashboard principal
├── 📄 admin.html                    # Painel administrativo
├── 📄 recuperar.html                # Recuperação de senha
│
├── 🎨 CSS/
│   ├── estilo.css                   # Estilos do login
│   ├── home.css                     # Estilos da home
│   ├── trello-home.css              # Estilos do dashboard
│   └── admin.css                    # Estilos do admin
│
├── 🔧 JavaScript/
│   ├── firebase-config.js           # Configuração do Firebase
│   ├── firebase-service.js          # Serviços Firebase (CRUD)
│   ├── script-auth-firebase.js      # Autenticação
│   ├── trello-home.js               # Lógica do dashboard
│   ├── admin.js                     # Lógica administrativa
│   └── home.js                      # Lógica da home
│
├── 📚 Documentação/
│   ├── GUIA-CONFIGURACAO-FIREBASE.md
│   ├── INICIO-RAPIDO.md
│   ├── DOCUMENTACAO_SISTEMA_FLORENSE.md
│   ├── ANALISE_TECNICA_PROJETO.md
│   └── README.md (este arquivo)
│
└── ⚙️ Configuração/
    ├── .env.example                 # Exemplo de variáveis de ambiente
    ├── .gitignore                   # Arquivos ignorados pelo Git
    └── firebase.json                # Configuração Firebase Hosting
```

---

## 🛠️ Instalação

### Pré-requisitos

- Navegador moderno (Chrome, Firefox, Edge, Safari)
- Conta no Firebase (gratuita)
- Editor de código (VS Code recomendado)
- Live Server ou servidor web local

### Instalação Rápida (5 minutos)

#### 1️⃣ Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/florense-project.git
cd florense-project
```

#### 2️⃣ Configurar Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative Authentication (Email/Password)
4. Ative Firestore Database
5. Ative Storage
6. Copie as credenciais

#### 3️⃣ Configurar Credenciais

Abra `firebase-config.js` e cole suas credenciais:

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY",
    authDomain: "SEU_PROJECT.firebaseapp.com",
    projectId: "SEU_PROJECT_ID",
    storageBucket: "SEU_PROJECT.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
};
```

#### 4️⃣ Configurar Regras de Segurança

Copie as regras dos arquivos:
- `GUIA-CONFIGURACAO-FIREBASE.md` (seção 8)

#### 5️⃣ Abrir no Navegador

```bash
# Usando Live Server no VS Code
# Ou simplesmente abra index.html
```

### Instalação Detalhada

Para instruções completas, consulte:
- 📖 [INICIO-RAPIDO.md](INICIO-RAPIDO.md) - Guia passo a passo
- 📖 [GUIA-CONFIGURACAO-FIREBASE.md](GUIA-CONFIGURACAO-FIREBASE.md) - Configuração Firebase

---

## 📖 Documentação

### Guias Disponíveis

1. **[INICIO-RAPIDO.md](INICIO-RAPIDO.md)**
   - Configuração inicial
   - Primeiros passos
   - Deploy básico

2. **[GUIA-CONFIGURACAO-FIREBASE.md](GUIA-CONFIGURACAO-FIREBASE.md)**
   - Configuração detalhada do Firebase
   - Estrutura do banco de dados
   - Regras de segurança

3. **[DOCUMENTACAO_SISTEMA_FLORENSE.md](DOCUMENTACAO_SISTEMA_FLORENSE.md)**
   - Documentação completa do sistema
   - Funcionalidades
   - Fluxos de uso

4. **[ANALISE_TECNICA_PROJETO.md](ANALISE_TECNICA_PROJETO.md)**
   - Análise técnica
   - Arquitetura
   - Decisões de design

### API Firebase Service

O projeto inclui um wrapper completo para o Firebase:

```javascript
// Autenticação
await firebaseService.registerUser(username, email, password);
await firebaseService.loginUser(emailOrUsername, password);
await firebaseService.logoutUser();

// Workspaces
await firebaseService.createWorkspace(name, description);
await firebaseService.getUserWorkspaces(userId);

// Boards
await firebaseService.createBoard(workspaceId, name, backgroundColor);
await firebaseService.getWorkspaceBoards(workspaceId);

// Cards
await firebaseService.createCard(boardId, listId, title, description);
await firebaseService.updateCard(cardId, updates);
await firebaseService.moveCard(cardId, newListId);

// Storage
await firebaseService.uploadFile(file, path);
```

---

## 🎯 Como Usar

### 1. Criar Conta

1. Acesse a aplicação
2. Clique em "Entrar"
3. Clique em "Cadastre-se"
4. Preencha seus dados
5. Confirme o email

### 2. Criar Workspace

1. Após login, clique em "Criar"
2. Selecione "Workspace"
3. Digite nome e descrição
4. Clique em "Criar"

### 3. Criar Board

1. Entre em um workspace
2. Clique em "Criar Board"
3. Escolha nome e cor
4. Comece a adicionar listas e cards

### 4. Colaborar

1. Abra um board
2. Clique em "Compartilhar"
3. Digite email do colaborador
4. Defina permissões

---

## 🔐 Segurança

### Práticas Implementadas

- ✅ Autenticação com Firebase Auth
- ✅ Regras de segurança no Firestore
- ✅ Validação de dados no frontend e backend
- ✅ Proteção contra XSS
- ✅ HTTPS obrigatório em produção
- ✅ Tokens JWT gerenciados pelo Firebase
- ✅ Rate limiting (via Firebase)

### Credenciais Administrativas

Por padrão, existe um usuário admin:
- **Usuário:** admin
- **Senha:** admin123

⚠️ **IMPORTANTE:** Altere estas credenciais em produção!

---

## 🌐 Deploy

### Firebase Hosting (Recomendado)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
firebase init hosting

# Deploy
firebase deploy
```

### Outras Opções

- **Netlify**: Arraste a pasta ou conecte o Git
- **Vercel**: Importe o repositório
- **GitHub Pages**: Pode ter limitações com SPAs

---

## 🐛 Solução de Problemas

### Problemas Comuns

**1. Firebase não inicializa**
- Verifique as credenciais em `firebase-config.js`
- Confira o console do navegador (F12)
- Verifique sua conexão

**2. Erro ao fazer login**
- Verifique se o Authentication está ativado
- Verifique as regras de segurança
- Limpe o cache do navegador

**3. Dados não salvam**
- Verifique as regras do Firestore
- Verifique se está autenticado
- Confira o console para erros

### Logs e Debug

Abra o console do navegador (F12) e verifique:
```javascript
// Verificar Firebase
console.log(firebase);

// Verificar usuário
console.log(firebaseService.getCurrentUser());

// Testar serviços
await firebaseService.getUserWorkspaces(userId);
```

---

## 📊 Roadmap

### Versão Atual (1.0)
- ✅ Autenticação completa
- ✅ CRUD de Workspaces
- ✅ CRUD de Boards
- ✅ Sistema de Cards
- ✅ Upload de arquivos
- ✅ Painel administrativo

### Próximas Versões

**v1.1 - Colaboração Avançada**
- [ ] Chat em tempo real
- [ ] Notificações push
- [ ] Menções (@username)
- [ ] Sistema de permissões granular

**v1.2 - Produtividade**
- [ ] Templates de boards
- [ ] Automações (regras)
- [ ] Integrações (Slack, Discord)
- [ ] Calendário integrado

**v1.3 - Mobile**
- [ ] App iOS
- [ ] App Android
- [ ] Sincronização offline
- [ ] Notificações nativas

---

## 👥 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Suporte

### Contato

- **WhatsApp:** (21) 99939-7195
- **Email:** vhnascimento2808@hotmail.com
- **GitHub:** [github.com/seu-usuario](https://github.com/seu-usuario)

### Links Úteis

- [Documentação Firebase](https://firebase.google.com/docs)
- [EmailJS](https://www.emailjs.com/)
- [MDN Web Docs](https://developer.mozilla.org/)

---

## 🙏 Agradecimentos

- Firebase por fornecer infraestrutura gratuita
- Comunidade open source
- Todos os testadores e contribuidores

---

<div align="center">

**Desenvolvido com ❤️ por Florense Team**

[⬆ Voltar ao topo](#-florense-project---sistema-de-gerenciamento-de-projetos)

</div>
