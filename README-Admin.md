# 🔐 Sistema de Administração - Florense

## Credenciais de Acesso Admin

Para acessar o painel administrativo, use as seguintes credenciais na tela de login:

- **Usuário:** `admin`
- **Senha:** `admin123`

⚠️ **IMPORTANTE:** Estas são credenciais de exemplo. Em produção, altere a senha no arquivo `script.js` linha 57.

---

## 📊 Funcionalidades do Painel Admin

### 1. Dashboard
- **Estatísticas em tempo real:**
  - Total de usuários cadastrados
  - Total de quadros criados
  - Total de espaços de trabalho
  - Total de acessos registrados
  
- **Usuários Recentes:** Lista dos 5 últimos usuários cadastrados
- **Últimos Acessos:** Histórico dos 10 últimos acessos ao sistema

### 2. Gerenciar Usuários
- Visualizar todos os usuários cadastrados
- Ver detalhes completos de cada usuário:
  - Nome e e-mail
  - Data de criação
  - Último acesso
  - Número de quadros criados
  
- **Ações disponíveis:**
  - ✅ Ver detalhes completos do usuário
  - 🗑️ Excluir usuário (remove todos os dados, quadros e workspaces)
  - 🔍 Busca em tempo real

### 3. Histórico de Acessos
- Registro completo de todos os logins
- Informações por acesso:
  - Data e hora exata
  - Nome do usuário
  - E-mail
  - Tipo de ação (login/logout)
  
- **Filtros:**
  - Por tipo de ação
  - Por data específica

### 4. Todos os Quadros
- Visualização de todos os quadros criados no sistema
- Informações exibidas:
  - Nome do quadro
  - Background/cor
  - Usuário criador
  - Número de listas
  
- Busca em tempo real por nome ou criador

### 5. Espaços de Trabalho
- Lista completa de todos os workspaces
- Visualização dos quadros dentro de cada workspace
- Separação entre:
  - Workspaces padrão dos usuários
  - Workspaces customizados criados

### 6. Configurações do Sistema

#### Gerenciar Dados
- **Exportar Dados:** 
  - Gera arquivo JSON com backup completo
  - Inclui: usuários, acessos, workspaces
  - Útil para backup ou migração
  
- **Limpar Todos os Dados:**
  - Remove TODOS os dados do sistema
  - ⚠️ Ação irreversível!
  - Requer dupla confirmação

#### Segurança
- Alteração de senha do admin (requer modificação no código)

#### Estatísticas
- Espaço de armazenamento utilizado
- Data do último backup

---

## 🚀 Como Acessar

1. Abra a página de login (`login.html`)
2. Digite:
   - **Usuário:** admin
   - **Senha:** admin123
3. Você será redirecionado automaticamente para `admin.html`

---

## 🔒 Segurança

O sistema de admin possui as seguintes proteções:

1. **Verificação de Autenticação:**
   - Todas as páginas verificam se o usuário está logado como admin
   - Acesso negado redireciona para login
   
2. **Separação de Dados:**
   - Dados do admin não se misturam com dados de usuários comuns
   - Flag `isAdmin: true` identifica administradores
   
3. **Registro de Atividades:**
   - Todos os logins são registrados no histórico
   - Timestamp preciso de cada ação

---

## 📝 Logs e Rastreamento

O sistema registra automaticamente:

- ✅ Cada login de usuário
- ✅ Data e hora de cada acesso
- ✅ Criação de novos usuários
- ✅ Mantém últimos 1000 acessos

### Estrutura do Log de Acesso

```javascript
{
  username: "nome_usuario",
  email: "usuario@email.com",
  timestamp: "2025-10-17T10:30:00.000Z",
  action: "login",
  isAdmin: false
}
```

---

## 💾 Estrutura de Dados no LocalStorage

### Chaves Utilizadas:

- `users` - Array com todos os usuários
- `user-access-log` - Histórico de acessos
- `user-workspaces` - Workspaces customizados
- `boards_[email]` - Quadros de cada usuário
- `currentBoardId_[email]` - Board atual de cada usuário
- `loggedUser` - Usuário atualmente logado
- `last-backup` - Data do último backup

---

## 🛠️ Personalização

### Alterar Senha do Admin

Edite o arquivo `script.js`, linha ~57:

```javascript
// De:
if (username === 'admin' && password === 'admin123') {

// Para:
if (username === 'admin' && password === 'SUA_SENHA_AQUI') {
```

### Alterar Limite de Logs

No arquivo `script.js`, função `registerUserAccess()`:

```javascript
// Manter apenas os últimos 1000 acessos
if (accessLog.length > 1000) {
    accessLog = accessLog.slice(-1000);
}

// Altere 1000 para o número desejado
```

---

## ⚠️ Avisos Importantes

1. **Produção:** 
   - Não use credenciais padrão em produção
   - Implemente autenticação real com backend
   
2. **Backup Regular:**
   - Use a função de exportar dados regularmente
   - Mantenha backups em local seguro
   
3. **Limpeza de Dados:**
   - A função de limpar dados é IRREVERSÍVEL
   - Sempre faça backup antes de usar
   
4. **LocalStorage:**
   - LocalStorage tem limite de ~5-10MB
   - Para muitos usuários, considere usar backend

---

## 🎨 Interface

O painel administrativo possui:

- ✨ Design moderno e responsivo
- 📱 Compatível com dispositivos móveis
- 🎨 Gradientes e cores consistentes com o Florense
- 📊 Gráficos e estatísticas visuais
- 🔍 Busca e filtros em tempo real

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique este README
2. Confira os arquivos de código comentados
3. Entre em contato com o desenvolvedor

---

**Desenvolvido para Florense** 🌟
