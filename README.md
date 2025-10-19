# 🏢 Florense - Sistema de Gerenciamento de Projetos

[![GitHub Pages](https://img.shields.io/badge/GitHub-Pages-blue?logo=github)](https://seu-usuario.github.io/florense-trello)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

## 📋 Sobre o Projeto

Sistema completo de gerenciamento de projetos inspirado no Trello, desenvolvido especificamente para a Florense. Permite criar quadros, listas e cartões com sistema de drag-and-drop, autenticação de usuários, e muito mais!

## ✨ Funcionalidades

### 🎯 Principais Recursos

- ✅ **Sistema de Autenticação** - Login, cadastro e recuperação de senha
- ✅ **Quadros Personalizáveis** - Crie e organize múltiplos quadros
- ✅ **Listas e Cartões** - Sistema Kanban completo
- ✅ **Drag & Drop** - Arraste e solte cartões entre listas
- ✅ **Backgrounds Personalizados** - Mais de 20 imagens de fundo
- ✅ **Etiquetas Coloridas** - Organize cartões por categorias
- ✅ **Comentários** - Adicione comentários aos cartões
- ✅ **Anexos** - Faça upload de arquivos
- ✅ **Datas de Vencimento** - Gerencie prazos
- ✅ **Checklists** - Listas de tarefas dentro dos cartões
- ✅ **Membros** - Sistema de convites e permissões
- ✅ **Notificações** - Acompanhe mudanças em tempo real
- ✅ **Modo Responsivo** - Funciona em desktop e mobile
- ✅ **Armazenamento Local** - Dados salvos no navegador

### 🎨 Interface

- Design moderno e intuitivo
- Animações suaves
- Totalmente responsivo
- Tema escuro (em desenvolvimento)

## 🚀 Como Usar

### Acesso Online

Acesse diretamente pelo link: **[seu-usuario.github.io/florense-trello](https://seu-usuario.github.io/florense-trello)**

### Instalação Local

1. Clone o repositório:
```bash
git clone https://github.com/seu-usuario/florense-trello.git
```

2. Navegue até a pasta:
```bash
cd florense-trello
```

3. Abra com Live Server ou qualquer servidor local:
```bash
# Com Python
python -m http.server 8000

# Com Node.js (http-server)
npx http-server

# Ou simplesmente abra index.html no navegador
```

4. Acesse no navegador:
```
http://localhost:8000
```

## 📁 Estrutura do Projeto

```
florense-trello/
├── index.html              # Página inicial
├── login.html              # Página de login
├── recuperar.html          # Recuperação de senha
├── trello-home.html        # Home com quadros
├── dashboard.html          # Dashboard do quadro
├── admin.html              # Painel administrativo
├── estilo.css              # Estilos globais
├── home.css                # Estilos da home
├── trello-home.css         # Estilos do Trello Home
├── dashboard.css           # Estilos do dashboard
├── admin.css               # Estilos do admin
├── script.js               # Scripts gerais
├── home.js                 # JavaScript da home
├── trello-home.js          # JavaScript do Trello Home
├── dashboard-new.js        # JavaScript do dashboard
├── admin.js                # JavaScript do admin
├── firebase-config.js      # Configuração Firebase (opcional)
├── firebase-service.js     # Serviços Firebase (opcional)
└── README.md               # Este arquivo
```

## 🛠️ Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização e animações
- **JavaScript (Vanilla)** - Lógica e interatividade
- **LocalStorage** - Armazenamento de dados
- **Firebase** (opcional) - Autenticação e banco de dados
- **Font Awesome** - Ícones
- **Google Fonts** - Tipografia

## 📱 Páginas do Sistema

### 1. Página Inicial (`index.html`)
Apresentação do sistema com informações sobre recursos.

### 2. Login (`login.html`)
Sistema de autenticação com:
- Login por email/usuário
- Cadastro de novos usuários
- Link para recuperação de senha

### 3. Trello Home (`trello-home.html`)
Página principal com:
- Lista de quadros
- Quadros recentes
- Criar novos quadros
- Gerenciar workspaces

### 4. Dashboard (`dashboard.html`)
Interface principal do quadro com:
- Listas e cartões
- Drag & drop
- Detalhes dos cartões
- Gerenciamento de membros

### 5. Admin (`admin.html`)
Painel administrativo para:
- Gerenciar usuários
- Configurações do sistema
- Logs e estatísticas

## 💾 Armazenamento de Dados

Os dados são armazenados localmente no navegador usando **localStorage**:

- `loggedUser` - Informações do usuário logado
- `boards_[email]` - Quadros do usuário
- `currentBoardId_[email]` - ID do quadro atual
- `users` - Lista de usuários (sistema local)

> **Nota:** Os dados ficam salvos apenas no navegador. Para usar em outro dispositivo, use a versão com Firebase.

## 🔧 Configuração

### Sem Firebase (LocalStorage apenas)

O sistema funciona perfeitamente sem Firebase, usando apenas localStorage. Nenhuma configuração adicional necessária!

### Com Firebase (Opcional)

Se quiser sincronizar dados na nuvem:

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Configure Authentication e Firestore
3. Copie as credenciais para `firebase-config.js`
4. Habilite as regras de segurança

## 🎨 Personalização

### Adicionar Novos Backgrounds

Edite o arquivo `dashboard.css` e adicione novas classes de background:

```css
.board-background.seu-background {
    background-image: url('caminho/para/imagem.jpg');
}
```

### Personalizar Cores

As cores principais estão em variáveis CSS em `estilo.css`:

```css
:root {
    --primary-color: #0079bf;
    --secondary-color: #5e6c84;
    --success-color: #61bd4f;
    --danger-color: #eb5a46;
}
```

## 📝 Funcionalidades Futuras

- [ ] Modo escuro completo
- [ ] Exportar quadros em PDF
- [ ] Integração com calendário
- [ ] Notificações push
- [ ] App mobile nativo
- [ ] Integração com Slack
- [ ] Gráficos e relatórios
- [ ] Busca avançada
- [ ] Atalhos de teclado
- [ ] API pública

## 🐛 Problemas Conhecidos

Nenhum problema crítico identificado. Se encontrar algum bug, por favor [abra uma issue](https://github.com/seu-usuario/florense-trello/issues).

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto foi desenvolvido para uso interno da Florense.

## 👨‍💻 Autor

Desenvolvido com ❤️ para Florense

## 📞 Suporte

Para suporte, abra uma issue no GitHub ou entre em contato pelo email: suporte@florense.com

## 🙏 Agradecimentos

- Design inspirado no [Trello](https://trello.com)
- Ícones por [Font Awesome](https://fontawesome.com)
- Fontes por [Google Fonts](https://fonts.google.com)

---

⭐ Se este projeto te ajudou, considere dar uma estrela!

**Versão:** 1.0.0  
**Última atualização:** Outubro 2025
