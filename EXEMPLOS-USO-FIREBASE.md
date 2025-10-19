# 💡 EXEMPLOS PRÁTICOS - FIREBASE SERVICE

## 🎯 Como Usar o Firebase no Seu Projeto

Este guia mostra exemplos práticos de como usar os serviços Firebase no projeto Florense.

---

## 📚 ÍNDICE

1. [Autenticação](#autenticação)
2. [Gerenciar Usuários](#gerenciar-usuários)
3. [Workspaces](#workspaces)
4. [Boards](#boards)
5. [Cards](#cards)
6. [Upload de Arquivos](#upload-de-arquivos)
7. [Listeners em Tempo Real](#listeners-em-tempo-real)

---

## 🔐 AUTENTICAÇÃO

### Registrar Novo Usuário

```javascript
// Exemplo básico
async function cadastrarUsuario() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const result = await firebaseService.registerUser(username, email, password);
    
    if (result.success) {
        console.log('Usuário criado:', result.user);
        alert('Cadastro realizado com sucesso!');
        window.location.href = 'trello-home.html';
    } else {
        // Tratar erros
        if (result.error.code === 'auth/email-already-in-use') {
            alert('Este email já está em uso!');
        } else if (result.error.code === 'auth/weak-password') {
            alert('Senha muito fraca! Use pelo menos 6 caracteres.');
        } else {
            alert('Erro ao criar usuário: ' + result.error.message);
        }
    }
}
```

### Fazer Login

```javascript
async function fazerLogin() {
    const emailOrUsername = document.getElementById('login-input').value;
    const password = document.getElementById('password').value;
    
    // Mostrar loading
    showLoading(true);
    
    const result = await firebaseService.loginUser(emailOrUsername, password);
    
    showLoading(false);
    
    if (result.success) {
        console.log('Login realizado:', result.user.displayName);
        
        // Verificar se é admin
        const isAdmin = await firebaseService.isUserAdmin(result.user.uid);
        
        if (isAdmin) {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'trello-home.html';
        }
    } else {
        alert('Email ou senha incorretos!');
    }
}
```

### Recuperar Senha

```javascript
async function recuperarSenha() {
    const email = document.getElementById('email').value;
    
    if (!email) {
        alert('Digite seu email!');
        return;
    }
    
    const result = await firebaseService.resetPassword(email);
    
    if (result.success) {
        alert('Email de recuperação enviado! Verifique sua caixa de entrada.');
    } else {
        alert('Erro ao enviar email. Verifique o endereço e tente novamente.');
    }
}
```

### Logout

```javascript
async function fazerLogout() {
    if (confirm('Deseja realmente sair?')) {
        await firebaseService.logoutUser();
        window.location.href = 'login.html';
    }
}
```

---

## 👥 GERENCIAR USUÁRIOS

### Obter Usuário Atual

```javascript
function exibirDadosUsuario() {
    const user = firebaseService.getCurrentUser();
    
    if (user) {
        console.log('UID:', user.uid);
        console.log('Nome:', user.displayName);
        console.log('Email:', user.email);
        console.log('Foto:', user.photoURL);
        
        // Atualizar UI
        document.getElementById('user-name').textContent = user.displayName;
        document.getElementById('user-email').textContent = user.email;
        
        if (user.photoURL) {
            document.getElementById('user-avatar').src = user.photoURL;
        } else {
            // Usar inicial do nome
            const initial = user.displayName ? user.displayName[0].toUpperCase() : 'U';
            document.getElementById('user-initial').textContent = initial;
        }
    }
}
```

### Verificar se Usuário é Admin

```javascript
async function verificarPermissoes() {
    const user = firebaseService.getCurrentUser();
    
    if (user) {
        const isAdmin = await firebaseService.isUserAdmin(user.uid);
        
        if (isAdmin) {
            // Mostrar botões de admin
            document.getElementById('admin-panel').style.display = 'block';
            console.log('Usuário é administrador');
        } else {
            // Esconder botões de admin
            document.getElementById('admin-panel').style.display = 'none';
            console.log('Usuário comum');
        }
    }
}
```

---

## 🏢 WORKSPACES

### Criar Workspace

```javascript
async function criarWorkspace() {
    const name = document.getElementById('workspace-name').value;
    const description = document.getElementById('workspace-description').value;
    const backgroundUrl = document.getElementById('workspace-bg').value || null;
    
    if (!name) {
        alert('Digite um nome para o workspace!');
        return;
    }
    
    const result = await firebaseService.createWorkspace(name, description, backgroundUrl);
    
    if (result.success) {
        console.log('Workspace criado:', result.workspaceId);
        alert('Workspace criado com sucesso!');
        
        // Recarregar lista de workspaces
        carregarWorkspaces();
        
        // Fechar modal
        closeModal();
    } else {
        alert('Erro ao criar workspace!');
    }
}
```

### Listar Workspaces do Usuário

```javascript
async function carregarWorkspaces() {
    const user = firebaseService.getCurrentUser();
    
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    const result = await firebaseService.getUserWorkspaces(user.uid);
    
    if (result.success) {
        const workspaces = result.workspaces;
        
        console.log(`${workspaces.length} workspaces encontrados`);
        
        // Limpar container
        const container = document.getElementById('workspaces-container');
        container.innerHTML = '';
        
        // Renderizar cada workspace
        workspaces.forEach(workspace => {
            const card = criarCardWorkspace(workspace);
            container.appendChild(card);
        });
        
        if (workspaces.length === 0) {
            container.innerHTML = '<p>Nenhum workspace encontrado. Crie o primeiro!</p>';
        }
    } else {
        console.error('Erro ao carregar workspaces:', result.error);
    }
}

function criarCardWorkspace(workspace) {
    const card = document.createElement('div');
    card.className = 'workspace-card';
    card.style.backgroundImage = workspace.backgroundUrl 
        ? `url(${workspace.backgroundUrl})` 
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    
    card.innerHTML = `
        <h3>${workspace.name}</h3>
        <p>${workspace.description || 'Sem descrição'}</p>
        <div class="workspace-info">
            <span>${workspace.members ? workspace.members.length : 0} membros</span>
        </div>
    `;
    
    card.onclick = () => abrirWorkspace(workspace.id);
    
    return card;
}
```

### Atualizar Workspace

```javascript
async function atualizarWorkspace(workspaceId) {
    const newName = document.getElementById('edit-workspace-name').value;
    const newDescription = document.getElementById('edit-workspace-description').value;
    
    const updates = {
        name: newName,
        description: newDescription
    };
    
    const result = await firebaseService.updateWorkspace(workspaceId, updates);
    
    if (result.success) {
        alert('Workspace atualizado!');
        carregarWorkspaces();
    } else {
        alert('Erro ao atualizar workspace!');
    }
}
```

### Deletar Workspace

```javascript
async function deletarWorkspace(workspaceId, workspaceName) {
    const confirmacao = confirm(
        `Tem certeza que deseja deletar o workspace "${workspaceName}"?\n\n` +
        `ATENÇÃO: Todos os boards e cards serão permanentemente removidos!`
    );
    
    if (confirmacao) {
        const result = await firebaseService.deleteWorkspace(workspaceId);
        
        if (result.success) {
            alert('Workspace deletado com sucesso!');
            carregarWorkspaces();
        } else {
            alert('Erro ao deletar workspace!');
        }
    }
}
```

---

## 📋 BOARDS

### Criar Board

```javascript
async function criarBoard(workspaceId) {
    const name = prompt('Nome do board:');
    
    if (!name) return;
    
    // Escolher cor aleatória
    const cores = ['#0079bf', '#d29034', '#519839', '#b04632', '#89609e'];
    const cor = cores[Math.floor(Math.random() * cores.length)];
    
    const result = await firebaseService.createBoard(workspaceId, name, cor);
    
    if (result.success) {
        console.log('Board criado:', result.boardId);
        
        // Redirecionar para o board
        window.location.href = `dashboard.html?boardId=${result.boardId}`;
    } else {
        alert('Erro ao criar board!');
    }
}
```

### Listar Boards de um Workspace

```javascript
async function carregarBoards(workspaceId) {
    const result = await firebaseService.getWorkspaceBoards(workspaceId);
    
    if (result.success) {
        const boards = result.boards;
        
        const container = document.getElementById('boards-container');
        container.innerHTML = '';
        
        boards.forEach(board => {
            const card = document.createElement('div');
            card.className = 'board-card';
            card.style.backgroundColor = board.backgroundColor || '#0079bf';
            
            card.innerHTML = `
                <h4>${board.name}</h4>
                <span>${board.lists ? board.lists.length : 0} listas</span>
            `;
            
            card.onclick = () => abrirBoard(board.id);
            
            container.appendChild(card);
        });
    }
}
```

### Carregar Board Específico

```javascript
async function carregarBoard(boardId) {
    const result = await firebaseService.getBoard(boardId);
    
    if (result.success) {
        const board = result.board;
        
        // Atualizar título
        document.getElementById('board-title').textContent = board.name;
        
        // Aplicar background
        document.body.style.backgroundColor = board.backgroundColor;
        
        // Renderizar listas
        renderizarListas(board.lists || []);
        
        // Carregar cards de cada lista
        board.lists.forEach(lista => {
            carregarCards(boardId, lista.id);
        });
    }
}
```

---

## 🎴 CARDS

### Criar Card

```javascript
async function criarCard(boardId, listId) {
    const title = prompt('Título do card:');
    
    if (!title) return;
    
    const result = await firebaseService.createCard(boardId, listId, title, '');
    
    if (result.success) {
        console.log('Card criado:', result.cardId);
        
        // Recarregar cards da lista
        carregarCards(boardId, listId);
    }
}
```

### Listar Cards de uma Lista

```javascript
async function carregarCards(boardId, listId) {
    const result = await firebaseService.getListCards(boardId, listId);
    
    if (result.success) {
        const cards = result.cards;
        
        const listContainer = document.querySelector(`[data-list-id="${listId}"] .cards-container`);
        listContainer.innerHTML = '';
        
        cards.forEach(card => {
            const cardElement = criarCardElement(card);
            listContainer.appendChild(cardElement);
        });
    }
}

function criarCardElement(card) {
    const div = document.createElement('div');
    div.className = 'card';
    div.draggable = true;
    div.dataset.cardId = card.id;
    
    div.innerHTML = `
        <h5>${card.title}</h5>
        ${card.description ? `<p>${card.description}</p>` : ''}
        ${card.labels.length > 0 ? `
            <div class="labels">
                ${card.labels.map(label => `<span class="label ${label}">${label}</span>`).join('')}
            </div>
        ` : ''}
        ${card.dueDate ? `
            <div class="due-date">
                <i class="fas fa-clock"></i>
                ${formatarData(card.dueDate)}
            </div>
        ` : ''}
    `;
    
    div.onclick = () => abrirModalCard(card);
    
    return div;
}
```

### Atualizar Card

```javascript
async function atualizarCard(cardId) {
    const title = document.getElementById('card-title-input').value;
    const description = document.getElementById('card-description').value;
    const labels = getSelectedLabels(); // Função que retorna array de labels
    
    const updates = {
        title: title,
        description: description,
        labels: labels
    };
    
    const result = await firebaseService.updateCard(cardId, updates);
    
    if (result.success) {
        alert('Card atualizado!');
        fecharModalCard();
        // Recarregar board
        location.reload();
    }
}
```

### Mover Card (Drag and Drop)

```javascript
function setupDragAndDrop() {
    const cards = document.querySelectorAll('.card');
    const lists = document.querySelectorAll('.list');
    
    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('cardId', card.dataset.cardId);
            card.classList.add('dragging');
        });
        
        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
        });
    });
    
    lists.forEach(list => {
        list.addEventListener('dragover', (e) => {
            e.preventDefault();
        });
        
        list.addEventListener('drop', async (e) => {
            e.preventDefault();
            
            const cardId = e.dataTransfer.getData('cardId');
            const newListId = list.dataset.listId;
            
            // Mover card no Firebase
            const result = await firebaseService.moveCard(cardId, newListId);
            
            if (result.success) {
                // Recarregar board
                location.reload();
            }
        });
    });
}
```

### Adicionar Comentário

```javascript
async function adicionarComentario(cardId) {
    const comentario = document.getElementById('comment-input').value;
    
    if (!comentario.trim()) {
        alert('Digite um comentário!');
        return;
    }
    
    const result = await firebaseService.addCardComment(cardId, comentario);
    
    if (result.success) {
        console.log('Comentário adicionado:', result.comment);
        
        // Limpar input
        document.getElementById('comment-input').value = '';
        
        // Adicionar comentário à lista
        adicionarComentarioNaLista(result.comment);
    }
}

function adicionarComentarioNaLista(comment) {
    const lista = document.getElementById('comments-list');
    
    const div = document.createElement('div');
    div.className = 'comment';
    div.innerHTML = `
        <div class="comment-header">
            <strong>${comment.userName}</strong>
            <span>${formatarData(comment.createdAt)}</span>
        </div>
        <p>${comment.text}</p>
    `;
    
    lista.appendChild(div);
}
```

---

## 📎 UPLOAD DE ARQUIVOS

### Upload de Imagem de Perfil

```javascript
async function uploadAvatar() {
    const input = document.getElementById('avatar-input');
    const file = input.files[0];
    
    if (!file) {
        alert('Selecione uma imagem!');
        return;
    }
    
    // Validar tipo
    if (!file.type.startsWith('image/')) {
        alert('Apenas imagens são permitidas!');
        return;
    }
    
    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande! Máximo 2MB.');
        return;
    }
    
    // Mostrar loading
    showUploadProgress(true);
    
    const result = await firebaseService.uploadFile(file, 'avatars');
    
    showUploadProgress(false);
    
    if (result.success) {
        console.log('Avatar uploaded:', result.url);
        
        // Atualizar imagem do perfil
        document.getElementById('user-avatar').src = result.url;
        
        // Salvar URL no perfil do usuário
        await atualizarFotoPerfil(result.url);
    } else {
        alert('Erro ao fazer upload da imagem!');
    }
}
```

### Upload de Anexo em Card

```javascript
async function uploadAnexo(cardId) {
    const input = document.getElementById('attachment-input');
    const file = input.files[0];
    
    if (!file) return;
    
    // Validar tamanho (máx 10MB)
    if (file.size > 10 * 1024 * 1024) {
        alert('Arquivo muito grande! Máximo 10MB.');
        return;
    }
    
    showUploadProgress(true);
    
    const result = await firebaseService.uploadFile(file, 'attachments');
    
    showUploadProgress(false);
    
    if (result.success) {
        // Adicionar anexo ao card
        const attachments = card.attachments || [];
        attachments.push({
            name: result.name,
            url: result.url,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString()
        });
        
        await firebaseService.updateCard(cardId, { attachments: attachments });
        
        alert('Anexo adicionado!');
        location.reload();
    }
}
```

---

## 🔄 LISTENERS EM TEMPO REAL

### Observar Mudanças de Autenticação

```javascript
// Já implementado automaticamente no firebase-service.js
auth.onAuthStateChanged((user) => {
    if (user) {
        // Usuário logado
        console.log('Usuário logado:', user.displayName);
        
        // Atualizar UI
        mostrarConteudoAutenticado();
        carregarDadosUsuario(user);
    } else {
        // Usuário não logado
        console.log('Usuário não autenticado');
        
        // Redirecionar para login
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
});
```

### Observar Mudanças em Board (Tempo Real)

```javascript
function observarBoard(boardId) {
    // Listener em tempo real
    db.collection('boards').doc(boardId).onSnapshot((doc) => {
        if (doc.exists) {
            const board = doc.data();
            console.log('Board atualizado:', board);
            
            // Atualizar UI automaticamente
            atualizarUIBoard(board);
        }
    });
}
```

### Observar Cards de uma Lista (Tempo Real)

```javascript
function observarCards(boardId, listId) {
    db.collection('cards')
        .where('boardId', '==', boardId)
        .where('listId', '==', listId)
        .onSnapshot((snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    console.log('Card adicionado:', change.doc.data());
                    adicionarCardNaUI(change.doc.data());
                }
                if (change.type === 'modified') {
                    console.log('Card modificado:', change.doc.data());
                    atualizarCardNaUI(change.doc.data());
                }
                if (change.type === 'removed') {
                    console.log('Card removido:', change.doc.id);
                    removerCardDaUI(change.doc.id);
                }
            });
        });
}
```

---

## 🎓 DICAS E BOAS PRÁTICAS

### 1. Sempre Verificar Autenticação

```javascript
function verificarAutenticacao() {
    const user = firebaseService.getCurrentUser();
    
    if (!user) {
        alert('Você precisa estar logado!');
        window.location.href = 'login.html';
        return false;
    }
    
    return true;
}

// Usar antes de qualquer operação
async function minhaFuncao() {
    if (!verificarAutenticacao()) return;
    
    // Resto do código...
}
```

### 2. Tratar Erros Adequadamente

```javascript
async function minhaFuncao() {
    try {
        const result = await firebaseService.createWorkspace('Teste', 'Descrição');
        
        if (result.success) {
            // Sucesso
            console.log('Sucesso!');
        } else {
            // Erro retornado
            console.error('Erro:', result.error);
            mostrarErro(result.error.message);
        }
    } catch (error) {
        // Erro inesperado
        console.error('Erro crítico:', error);
        mostrarErro('Erro inesperado. Tente novamente.');
    }
}
```

### 3. Loading States

```javascript
async function operacaoAssincrona() {
    // Mostrar loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('button').disabled = true;
    
    try {
        await firebaseService.algumServico();
    } finally {
        // Sempre esconder loading, mesmo com erro
        document.getElementById('loading').style.display = 'none';
        document.getElementById('button').disabled = false;
    }
}
```

---

## 🎉 CONCLUSÃO

Estes exemplos cobrem os casos de uso mais comuns do Firebase no projeto Florense.

Para mais informações:
- Consulte `firebase-service.js` para ver todas as funções disponíveis
- Leia a documentação do Firebase: https://firebase.google.com/docs

Boa sorte! 🚀
