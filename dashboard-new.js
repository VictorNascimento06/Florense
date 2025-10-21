// ============================================
// FLORENSE TRELLO CLONE - JavaScript Completo
// ============================================

// ============================================
// VARIÁVEIS GLOBAIS
// ============================================
let currentBoard = null;
let currentCard = null;
let draggedCard = null;
let boards = [];
let currentBoardId = null;
let currentUser = null;
let isInitialized = false;

// Verificar se Firebase está carregado
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase não está carregado!');
    alert('Erro ao carregar Firebase. Recarregue a página.');
} else {
    console.log('✅ Firebase carregado com sucesso');
}

// SISTEMA HÍBRIDO: Verificar autenticação Firebase OU localStorage
if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(async (user) => {
        try {
            if (user) {
                // Usuário logado no Firebase
                currentUser = user;
                console.log('✅ Usuário Firebase autenticado no dashboard:', user.email);
                
                // Inicializar a aplicação apenas uma vez
                if (!isInitialized) {
                    isInitialized = true;
                    initializeUser();
                    initializeCurrentBoardId();
                    initializeBoards();
                    initializeEventListeners();
                    initializePhoneMasks();
                    loadCurrentBoard();
                    checkAdminViewing();
                }
            } else {
                // Não está no Firebase, verificar localStorage
                const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || 'null');
                
                if (loggedUser) {
                    console.log('✅ Usuário localStorage encontrado no dashboard:', loggedUser.fullName || loggedUser.username || loggedUser.email);
                    
                    // Criar objeto user fake para compatibilidade
                    currentUser = {
                        email: loggedUser.email,
                        displayName: loggedUser.fullName || loggedUser.username || loggedUser.email.split('@')[0],
                        uid: 'local_' + (loggedUser.email || 'user')
                    };
                    
                    // Inicializar aplicação
                    if (!isInitialized) {
                        isInitialized = true;
                        initializeUser();
                        initializeCurrentBoardId();
                        initializeBoards();
                        initializeEventListeners();
                        initializePhoneMasks();
                        loadCurrentBoard();
                        checkAdminViewing();
                    }
                } else {
                    // Não está logado em nenhum sistema
                    console.log('❌ Usuário não autenticado no dashboard, redirecionando...');
                    window.location.href = "login.html";
                }
            }
        } catch (error) {
            console.error('❌ Erro no onAuthStateChanged:', error);
            window.location.href = "login.html";
        }
    });
} else {
    console.error('❌ Firebase auth não disponível');
    // Tentar usar apenas localStorage
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || 'null');
    if (loggedUser) {
        currentUser = {
            email: loggedUser.email,
            displayName: loggedUser.fullName || loggedUser.username || loggedUser.email.split('@')[0],
            uid: 'local_' + (loggedUser.email || 'user')
        };
        initializeUser();
        initializeCurrentBoardId();
        initializeBoards();
        initializeEventListeners();
        initializePhoneMasks();
        loadCurrentBoard();
        checkAdminViewing();
    } else {
        window.location.href = "login.html";
    }
}

// ============================================
// GERENCIAMENTO DE USUÁRIO
// ============================================

async function initializeUser() {
    if (!currentUser) return;
    
    try {
        // Buscar dados do localStorage SEMPRE (ignorar Firestore)
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
        
        let inicial = currentUser.email[0].toUpperCase();
        let name = loggedUser.fullName || currentUser.displayName || currentUser.email.split('@')[0];
        let email = currentUser.email;
        let profilePhoto = loggedUser.photo || null;
        
        if (name) {
            inicial = name[0].toUpperCase();
        }
        
        console.log('✅ Dashboard: Dados do localStorage -', { name, email });

        // Atualizar avatares
        const avatars = document.querySelectorAll('.user-avatar, .avatar-large');
        avatars.forEach(avatar => {
            if (profilePhoto) {
                let img = avatar.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    avatar.appendChild(img);
                }
                img.src = profilePhoto;
                const span = avatar.querySelector('span');
                if (span) span.style.display = 'none';
            } else {
                const span = avatar.querySelector('span') || avatar;
                span.textContent = inicial;
            }
        });

        // Atualizar informações do usuário
        const userName = document.getElementById('user-name');
        const userEmail = document.getElementById('user-email');
        if (userName) userName.textContent = name;
        if (userEmail) userEmail.textContent = email;

        // Atualizar avatares de comentários
        const commentAvatars = document.querySelectorAll('.comment-avatar');
        commentAvatars.forEach(avatar => {
            if (profilePhoto) {
                let img = avatar.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    avatar.appendChild(img);
                }
                img.src = profilePhoto;
                avatar.textContent = '';
            } else {
                avatar.textContent = inicial;
            }
        });
        
        console.log('Usuário inicializado no dashboard:', name);
    } catch (error) {
        console.error('Erro ao inicializar usuário:', error);
    }
}

// ============================================
// GERENCIAMENTO DE BOARDS
// ============================================
function initializeCurrentBoardId() {
    // Carregar currentBoardId específico do usuário
    currentBoardId = localStorage.getItem(getCurrentBoardIdKey()) || null;
}

async function initializeBoards() {
    try {
        // 🔥 CARREGAR BOARDS DO FIREBASE
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            console.log('🔥 Carregando boards do Firebase...');
            const result = await window.firebaseService.getUserBoards();
            
            if (result.success && result.boards && result.boards.length > 0) {
                boards = result.boards;
                console.log(`✅ ${boards.length} board(s) carregado(s) do Firebase`);
            } else {
                console.log('⚠️ Nenhum board no Firebase, usando localStorage como fallback');
                boards = getBoards();
            }
        } else {
            // Fallback: localStorage
            console.log('📦 Carregando boards do localStorage (fallback)');
            boards = getBoards();
        }
        
        // NÃO criar board padrão automático - deixar usuário criar quando quiser
        
        if (!currentBoardId && boards.length > 0) {
            currentBoardId = boards[0].id;
            localStorage.setItem(getCurrentBoardIdKey(), currentBoardId);
        }
        
        renderBoardsList();
    } catch (error) {
        console.error('❌ Erro ao inicializar boards:', error);
        boards = getBoards(); // Fallback para localStorage
        renderBoardsList();
    }
}

async function loadCurrentBoard() {
    if (currentBoardId) {
        console.log('🔍 Buscando board ID:', currentBoardId);
        
        // 🔥 BUSCAR BOARD DO FIREBASE PRIMEIRO
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            try {
                console.log('🔥 Tentando carregar board do Firebase...');
                const result = await window.firebaseService.getBoard(currentBoardId);
                
                if (result.success && result.board) {
                    currentBoard = result.board;
                    console.log('✅ Board carregado do Firebase:', currentBoard.name);
                } else {
                    console.log('⚠️ Board não encontrado no Firebase, buscando no localStorage...');
                    // Fallback para localStorage
                    currentBoard = boards.find(b => b.id === currentBoardId);
                }
            } catch (error) {
                console.error('❌ Erro ao buscar board do Firebase:', error);
                // Fallback para localStorage
                currentBoard = boards.find(b => b.id === currentBoardId);
            }
        } else {
            // Fallback: localStorage
            console.log('📦 Carregando board do localStorage (fallback)');
            currentBoard = boards.find(b => b.id === currentBoardId);
        }
        
        // Se não encontrou em lugar nenhum
        if (!currentBoard) {
            const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
            
            for (const workspace of userWorkspaces) {
                if (workspace.boards) {
                    const foundBoard = workspace.boards.find(b => b.id === currentBoardId);
                    if (foundBoard) {
                        currentBoard = foundBoard;
                        console.log('Board carregado do workspace:', workspace.name);
                        break;
                    }
                }
            }
        }
        
        if (currentBoard) {
            // SINCRONIZAÇÃO: Verificar se há versão mais recente
            checkForBoardUpdates();
            
            renderBoard();
            // Aplicar background do board
            if (currentBoard.background) {
                applyBoardBackground(currentBoard.background);
            }
        } else {
            console.error('❌ Board não encontrado em nenhum lugar:', currentBoardId);
            // Redirecionar de volta para home se o board não existe
            showNotification('Quadro não encontrado!', 'error');
            setTimeout(() => {
                window.location.href = 'trello-home.html';
            }, 1500);
        }
    }
}

// Verificar se há atualizações no quadro (feitas por outros membros)
async function checkForBoardUpdates() {
    if (!currentBoard) return;
    
    // 🔥 SINCRONIZAÇÃO VIA FIREBASE (não mais localStorage)
    // Agora os boards são salvos no Firebase, então não precisamos
    // verificar localStorage de outros usuários
    
    // TODO: Implementar sincronização em tempo real via Firebase listeners
    console.log('✅ Board carregado:', currentBoard.name);
}

function renderBoard() {
    if (!currentBoard) return;

    // Atualizar título do board
    const boardTitle = document.getElementById('board-title');
    if (boardTitle) {
        boardTitle.textContent = currentBoard.name;
    }

    // Atualizar botão de favorito
    const starBtn = document.getElementById('star-board');
    if (starBtn) {
        const starIcon = starBtn.querySelector('i');
        if (currentBoard.starred) {
            starIcon.className = 'fas fa-star';
            starBtn.classList.add('starred');
        } else {
            starIcon.className = 'far fa-star';
            starBtn.classList.remove('starred');
        }
    }

    // Renderizar listas
    renderLists();
}

function renderLists() {
    const listsContainer = document.getElementById('lists-container');
    if (!listsContainer) return;

    // Limpar container
    listsContainer.innerHTML = '';

    // Renderizar cada lista
    currentBoard.lists.forEach(list => {
        const listElement = createListElement(list);
        listsContainer.appendChild(listElement);
    });

    // Adicionar botão "Adicionar Lista"
    const addListContainer = createAddListContainer();
    listsContainer.appendChild(addListContainer);
}

function createListElement(list) {
    const listDiv = document.createElement('div');
    listDiv.className = 'list';
    listDiv.setAttribute('data-list-id', list.id);

    listDiv.innerHTML = `
        <div class="list-header">
            <input type="text" class="list-title" value="${list.name}" readonly>
            <div class="list-options-container">
                <button class="list-options">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <div class="list-dropdown" style="display: none;">
                    <div class="list-dropdown-item" data-action="delete">
                        <i class="fas fa-trash"></i>
                        Excluir lista
                    </div>
                </div>
            </div>
        </div>
        <div class="cards-container" id="${list.id}-cards">
            ${list.cards.map(card => createCardHTML(card, list.name)).join('')}
        </div>
        <div class="add-card-container">
            <button class="add-card-btn">
                <i class="fas fa-plus"></i>
                Adicionar um cartão
            </button>
            <div class="add-card-form" style="display: none;">
                <div class="card-form-field">
                    <label for="numero-pedido-${list.id}">Número do Pedido:</label>
                    <input type="text" id="numero-pedido-${list.id}" class="card-input" placeholder="Número do pedido" required>
                </div>
                <div class="card-form-field">
                    <label for="cliente-name-${list.id}">Nome do Cliente:</label>
                    <input type="text" id="cliente-name-${list.id}" class="card-input" placeholder="Nome do cliente" required>
                </div>
                <div class="card-form-field">
                    <label for="telefone-cliente-${list.id}">Telefone do Cliente:</label>
                    <input type="tel" id="telefone-cliente-${list.id}" class="card-input" placeholder="(11) 99999-9999" required>
                </div>
                <div class="card-form-field">
                    <label for="engenheiro-name-${list.id}">Nome do Engenheiro:</label>
                    <input type="text" id="engenheiro-name-${list.id}" class="card-input" placeholder="Nome do engenheiro" required>
                </div>
                <div class="card-form-field">
                    <label for="arquiteto-name-${list.id}">Nome do Arquiteto:</label>
                    <input type="text" id="arquiteto-name-${list.id}" class="card-input" placeholder="Nome do arquiteto" required>
                </div>
                <div class="card-form-field">
                    <label for="solicitacao-cliente-${list.id}">Solicitação do Cliente:</label>
                    <textarea id="solicitacao-cliente-${list.id}" class="card-textarea" placeholder="Descreva a solicitação do cliente..." required></textarea>
                </div>
                <div class="add-card-actions">
                    <button class="btn-primary save-card">Adicionar cartão</button>
                    <button class="btn-cancel cancel-card">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
    `;

    setupListEventListeners(listDiv, list);
    return listDiv;
}

function createCardHTML(card, listName = '') {
    const labelNames = getLabelNames();
    
    // Criar labels com texto (nome)
    const labels = card.labels ? card.labels.map(label => {
        const labelName = labelNames[label] || capitalizeFirst(label);
        return `<div class="card-label-text ${label}">${labelName}</div>`;
    }).join('') : '';

    const badges = [];
    if (card.description) {
        badges.push('<div class="card-badge"><i class="fas fa-align-left"></i></div>');
    }
    if (card.comments && card.comments.length > 0) {
        badges.push(`<div class="card-badge"><i class="fas fa-comment"></i> ${card.comments.length}</div>`);
    }
    if (card.checklist && card.checklist.length > 0) {
        const completed = card.checklist.filter(item => item.completed).length;
        const total = card.checklist.length;
        const badgeClass = completed === total ? 'completed' : '';
        badges.push(`<div class="card-badge ${badgeClass}"><i class="fas fa-check-square"></i> ${completed}/${total}</div>`);
    }
    if (card.dueDate) {
        const dueDate = createLocalDate(card.dueDate);
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < now;
        const isDueSoon = dueDate - now < 24 * 60 * 60 * 1000; // 24 horas
        
        let badgeClass = '';
        if (isOverdue) badgeClass = 'overdue';
        else if (isDueSoon) badgeClass = 'due-soon';
        
        badges.push(`<div class="card-badge ${badgeClass}"><i class="fas fa-clock"></i> ${formatDate(card.dueDate)}</div>`);
    }

    // Adicionar membros aos cards
    let membersHTML = '';
    if (card.members && card.members.length > 0) {
        const memberAvatars = card.members.map(member => {
            // Verificar se o membro tem foto de perfil
            const profileKey = `profile_${member.id}`;
            const userProfile = JSON.parse(localStorage.getItem(profileKey));
            const profilePhoto = userProfile?.photo;
            
            if (profilePhoto) {
                return `<div class="card-member-avatar" title="${member.name}"><img src="${profilePhoto}" alt="${member.name}"></div>`;
            } else {
                return `<div class="card-member-avatar" title="${member.name}">${member.initials}</div>`;
            }
        }).join('');
        
        membersHTML = `<div class="card-members-list">${memberAvatars}</div>`;
    }

    // Add client details for new card format
    let clientDetails = '';
    if (card.cliente && card.engenheiro && card.arquiteto) {
        clientDetails = `
            <div class="card-details">
                <div class="card-detail-item">
                    <i class="fas fa-user"></i>
                    <span class="detail-label">Cliente:</span>
                    <span class="detail-value">${card.cliente}</span>
                </div>
                <div class="card-detail-item">
                    <i class="fas fa-hard-hat"></i>
                    <span class="detail-label">Engenheiro:</span>
                    <span class="detail-value">${card.engenheiro}</span>
                </div>
                <div class="card-detail-item">
                    <i class="fas fa-drafting-compass"></i>
                    <span class="detail-label">Arquiteto:</span>
                    <span class="detail-value">${card.arquiteto}</span>
                </div>
            </div>
        `;
    }

    return `
        <div class="card" data-card-id="${card.id}" data-list-name="${listName}" draggable="true">
            ${labels ? `<div class="card-labels">${labels}</div>` : ''}
            <div class="card-title">${card.title}</div>
            ${clientDetails}
            ${membersHTML}
            ${badges.length > 0 ? `<div class="card-badges">${badges.join('')}</div>` : ''}
        </div>
    `;
}

function createAddListContainer() {
    const addListDiv = document.createElement('div');
    addListDiv.className = 'add-list-container';
    addListDiv.innerHTML = `
        <button class="add-list-btn" id="add-list-btn">
            <i class="fas fa-plus"></i>
            Adicionar outra lista
        </button>
        <div class="add-list-form" id="add-list-form" style="display: none;">
            <input type="text" placeholder="Insira o título da lista..." id="new-list-title">
            <div class="add-list-actions">
                <button class="btn-primary" id="save-list">Adicionar lista</button>
                <button class="btn-cancel" id="cancel-list">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;

    setupAddListEventListeners(addListDiv);
    return addListDiv;
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    // Navegação
    const boardsBtn = document.getElementById('boards-btn');
    const closeSidebar = document.getElementById('close-sidebar');
    const userAvatar = document.getElementById('user-avatar');
    const logoutBtn = document.getElementById('logout-btn');
    const searchInput = document.getElementById('search-input');

    if (boardsBtn) {
        boardsBtn.addEventListener('click', toggleBoardsSidebar);
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => {
            document.getElementById('boards-sidebar').classList.remove('open');
        });
    }

    if (userAvatar) {
        userAvatar.addEventListener('click', toggleUserDropdown);
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // Board header
    const boardTitle = document.getElementById('board-title');
    const starBoard = document.getElementById('star-board');

    if (boardTitle) {
        boardTitle.addEventListener('blur', updateBoardTitle);
        boardTitle.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                boardTitle.blur();
            }
        });
    }

    if (starBoard) {
        starBoard.addEventListener('click', toggleBoardStar);
    }

    // Modais
    setupModalEventListeners();

    // Create board
    const createBoardBtn = document.getElementById('create-board-btn');
    if (createBoardBtn) {
        createBoardBtn.addEventListener('click', showCreateBoardModal);
    }

    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown && !dropdown.contains(e.target) && !document.getElementById('user-avatar').contains(e.target)) {
            dropdown.classList.remove('show');
        }
        
        // Fechar dropdowns das listas
        const listDropdowns = document.querySelectorAll('.list-dropdown');
        listDropdowns.forEach(listDropdown => {
            if (!listDropdown.contains(e.target) && !e.target.closest('.list-options')) {
                listDropdown.style.display = 'none';
            }
        });
    });
    
    // Inicializar scroll horizontal
    initializeHorizontalScroll();
}

// ============================================
// NAVEGAÇÃO HORIZONTAL (SCROLL)
// ============================================
function initializeHorizontalScroll() {
    const listsContainer = document.getElementById('lists-container');
    const scrollLeftBtn = document.getElementById('scroll-left-btn');
    const scrollRightBtn = document.getElementById('scroll-right-btn');
    
    if (!listsContainer || !scrollLeftBtn || !scrollRightBtn) return;
    
    // Função para verificar se precisa mostrar os botões
    function updateScrollButtons() {
        const hasScroll = listsContainer.scrollWidth > listsContainer.clientWidth;
        const isAtStart = listsContainer.scrollLeft <= 0;
        const isAtEnd = listsContainer.scrollLeft >= listsContainer.scrollWidth - listsContainer.clientWidth - 10;
        
        if (hasScroll) {
            scrollLeftBtn.style.display = isAtStart ? 'none' : 'flex';
            scrollRightBtn.style.display = isAtEnd ? 'none' : 'flex';
        } else {
            scrollLeftBtn.style.display = 'none';
            scrollRightBtn.style.display = 'none';
        }
    }
    
    // Event listeners para os botões
    scrollLeftBtn.addEventListener('click', () => {
        listsContainer.scrollBy({
            left: -400,
            behavior: 'smooth'
        });
    });
    
    scrollRightBtn.addEventListener('click', () => {
        listsContainer.scrollBy({
            left: 400,
            behavior: 'smooth'
        });
    });
    
    // Atualizar botões ao scrollar
    listsContainer.addEventListener('scroll', updateScrollButtons);
    
    // Atualizar botões quando o conteúdo mudar
    const observer = new MutationObserver(updateScrollButtons);
    observer.observe(listsContainer, {
        childList: true,
        subtree: true
    });
    
    // Atualizar botões inicialmente
    setTimeout(updateScrollButtons, 100);
    
    // Atualizar ao redimensionar janela
    window.addEventListener('resize', updateScrollButtons);
    
    // Scroll com teclas de seta
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        
        if (e.key === 'ArrowLeft' && e.ctrlKey) {
            e.preventDefault();
            listsContainer.scrollBy({
                left: -400,
                behavior: 'smooth'
            });
        } else if (e.key === 'ArrowRight' && e.ctrlKey) {
            e.preventDefault();
            listsContainer.scrollBy({
                left: 400,
                behavior: 'smooth'
            });
        }
    });
}

function setupListEventListeners(listElement, list) {
    const listTitle = listElement.querySelector('.list-title');
    const listOptionsBtn = listElement.querySelector('.list-options');
    const listDropdown = listElement.querySelector('.list-dropdown');
    const addCardBtn = listElement.querySelector('.add-card-btn');
    const saveCardBtn = listElement.querySelector('.save-card');
    const cancelCardBtn = listElement.querySelector('.cancel-card');
    const cardForm = listElement.querySelector('.add-card-form');
    // No longer need textarea reference since we have specific input fields
    const cardsContainer = listElement.querySelector('.cards-container');

    // Edição do título da lista
    listTitle.addEventListener('dblclick', () => {
        listTitle.removeAttribute('readonly');
        listTitle.focus();
        listTitle.select();
    });

    listTitle.addEventListener('blur', () => {
        listTitle.setAttribute('readonly', true);
        updateListTitle(list.id, listTitle.value);
    });

    listTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            listTitle.blur();
        }
    });

    // Menu de opções da lista
    if (listOptionsBtn && listDropdown) {
        listOptionsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            // Fechar outros dropdowns abertos
            document.querySelectorAll('.list-dropdown').forEach(dropdown => {
                if (dropdown !== listDropdown) {
                    dropdown.style.display = 'none';
                }
            });
            
            // Toggle do dropdown atual
            const isVisible = listDropdown.style.display === 'block';
            listDropdown.style.display = isVisible ? 'none' : 'block';
        });

        // Event listener para itens do dropdown
        listDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            const item = e.target.closest('.list-dropdown-item');
            if (item) {
                const action = item.getAttribute('data-action');
                if (action === 'delete') {
                    deleteList(list.id);
                }
                listDropdown.style.display = 'none';
            }
        });
    }

    // Adicionar cartão - agora abre o modal
    addCardBtn.addEventListener('click', () => {
        openAddCardModal(list.id);
    });

    // Removidos os listeners antigos de saveCardBtn e cancelCardBtn
    // pois agora são tratados no modal

    // Setup drag and drop para cartões
    setupCardDragAndDrop(cardsContainer);

    // Event listeners para cartões existentes
    const cards = listElement.querySelectorAll('.card');
    cards.forEach(card => {
        setupCardEventListeners(card);
    });
}

function setupAddListEventListeners(addListContainer) {
    const addListBtn = addListContainer.querySelector('#add-list-btn');
    const addListForm = addListContainer.querySelector('#add-list-form');
    const newListTitle = addListContainer.querySelector('#new-list-title');
    const saveListBtn = addListContainer.querySelector('#save-list');
    const cancelListBtn = addListContainer.querySelector('#cancel-list');

    addListBtn.addEventListener('click', () => {
        addListBtn.style.display = 'none';
        addListForm.style.display = 'block';
        newListTitle.focus();
    });

    saveListBtn.addEventListener('click', () => {
        const title = newListTitle.value.trim();
        if (title) {
            addList(title);
            newListTitle.value = '';
            addListForm.style.display = 'none';
            addListBtn.style.display = 'flex';
        }
    });

    cancelListBtn.addEventListener('click', () => {
        newListTitle.value = '';
        addListForm.style.display = 'none';
        addListBtn.style.display = 'flex';
    });

    newListTitle.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            saveListBtn.click();
        }
    });
}

function setupCardEventListeners(cardElement) {
    cardElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const cardId = cardElement.getAttribute('data-card-id');
        openCardModal(cardId);
    });

    // Drag events
    cardElement.addEventListener('dragstart', handleCardDragStart);
    cardElement.addEventListener('dragend', handleCardDragEnd);
}

function setupCardDragAndDrop(container) {
    container.addEventListener('dragover', handleCardDragOver);
    container.addEventListener('drop', handleCardDrop);
    container.addEventListener('dragenter', handleCardDragEnter);
    container.addEventListener('dragleave', handleCardDragLeave);
}

function setupModalEventListeners() {
    // Card modal
    const cardModal = document.getElementById('card-modal');
    const closeCardModal = document.getElementById('close-card-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');

    if (closeCardModal) {
        closeCardModal.addEventListener('click', closeCardDetailModal);
    }

    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeCardDetailModal);
    }

    // Escape key para fechar modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCardDetailModal();
            closeAllModals();
        }
    });
}

// ============================================
// DRAG AND DROP
// ============================================
function handleCardDragStart(e) {
    draggedCard = {
        element: e.target,
        cardId: e.target.getAttribute('data-card-id'),
        sourceListId: e.target.closest('.list').getAttribute('data-list-id')
    };
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
}

function handleCardDragEnd(e) {
    e.target.classList.remove('dragging');
    draggedCard = null;
}

function handleCardDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleCardDragEnter(e) {
    e.preventDefault();
    const list = e.currentTarget.closest('.list');
    if (list && draggedCard) {
        list.classList.add('drag-over');
    }
}

function handleCardDragLeave(e) {
    const list = e.currentTarget.closest('.list');
    if (list) {
        list.classList.remove('drag-over');
    }
}

function handleCardDrop(e) {
    e.preventDefault();
    const list = e.currentTarget.closest('.list');
    const targetListId = list.getAttribute('data-list-id');
    
    if (draggedCard && draggedCard.sourceListId !== targetListId) {
        moveCard(draggedCard.cardId, draggedCard.sourceListId, targetListId);
    }
    
    list.classList.remove('drag-over');
}

// ============================================
// CARD MODAL
// ============================================
function openCardModal(cardId) {
    const card = findCard(cardId);
    if (!card) return;

    currentCard = card;
    
    // Atualizar modal com dados do cartão
    const modal = document.getElementById('card-modal');
    const titleInput = document.getElementById('card-title-input');
    const descriptionTextarea = document.getElementById('description-textarea');
    
    if (titleInput) titleInput.value = card.title || '';
    if (descriptionTextarea) descriptionTextarea.value = card.description || '';

    // Renderizar labels
    renderCardLabels(card);
    
    // Renderizar checklist se existir
    if (card.checklist && card.checklist.length > 0) {
        renderChecklist(card);
    }

    // Renderizar comentários
    renderComments(card);
    
    // Renderizar anexos
    updateAttachmentsDisplay();

    // Mostrar modal
    modal.classList.add('show');
    
    // Setup event listeners do modal
    setupCardModalEventListeners();
}

function updateCardModal() {
    if (!currentCard) return;
    
    // Atualizar todos os elementos do modal
    updateCardMembersDisplay();
    updateCardDatesDisplay();
    updateAttachmentsDisplay();
    updateClientDetailsDisplay();
    
    // Re-renderizar outros elementos se necessário
    if (currentCard.labels) renderCardLabels(currentCard);
    if (currentCard.checklist) renderChecklist(currentCard);
    if (currentCard.comments) renderComments(currentCard);
}

function updateClientDetailsDisplay() {
    const clientDetailsSection = document.getElementById('client-details-section');
    const orderNumberDisplay = document.getElementById('order-number-display');
    const clientNameDisplay = document.getElementById('client-name-display');
    const clientPhoneDisplay = document.getElementById('client-phone-display');
    const engineerNameDisplay = document.getElementById('engineer-name-display');
    const architectNameDisplay = document.getElementById('architect-name-display');
    
    if (currentCard && currentCard.cliente && currentCard.telefone && currentCard.engenheiro && currentCard.arquiteto) {
        // Show the section and populate with data
        if (clientDetailsSection) clientDetailsSection.style.display = 'block';
        if (orderNumberDisplay) orderNumberDisplay.textContent = currentCard.numeroPedido || '-';
        if (clientNameDisplay) clientNameDisplay.textContent = currentCard.cliente;
        if (clientPhoneDisplay) clientPhoneDisplay.textContent = currentCard.telefone;
        if (engineerNameDisplay) engineerNameDisplay.textContent = currentCard.engenheiro;
        if (architectNameDisplay) architectNameDisplay.textContent = currentCard.arquiteto;
    } else {
        // Hide the section if no client details available
        if (clientDetailsSection) clientDetailsSection.style.display = 'none';
    }
}

function closeCardDetailModal() {
    const modal = document.getElementById('card-modal');
    modal.classList.remove('show');
    
    // Salvar alterações se houver
    if (currentCard) {
        saveCurrentCardChanges();
        currentCard = null;
    }
}

function setupCardModalEventListeners() {
    const titleInput = document.getElementById('card-title-input');
    const descriptionTextarea = document.getElementById('description-textarea');
    const addLabelBtn = document.getElementById('add-label-btn');
    const addChecklistBtn = document.getElementById('add-checklist-btn');
    const saveCommentBtn = document.getElementById('save-comment');
    const deleteCardBtn = document.getElementById('delete-card-btn');
    const addAttachmentBtnInline = document.getElementById('add-attachment-btn-inline');

    // Auto-save no título e descrição
    if (titleInput) {
        titleInput.removeEventListener('input', handleTitleInput);
        titleInput.addEventListener('input', handleTitleInput);
    }

    if (descriptionTextarea) {
        descriptionTextarea.removeEventListener('blur', handleDescriptionBlur);
        descriptionTextarea.addEventListener('blur', handleDescriptionBlur);
    }

    if (addLabelBtn) {
        addLabelBtn.removeEventListener('click', showLabelsModal);
        addLabelBtn.addEventListener('click', showLabelsModal);
    }
    
    // Adicionar listener para o botão de anexar inline
    if (addAttachmentBtnInline) {
        addAttachmentBtnInline.removeEventListener('click', handleAttachmentInlineClick);
        addAttachmentBtnInline.addEventListener('click', handleAttachmentInlineClick);
    }

    if (addChecklistBtn) {
        addChecklistBtn.removeEventListener('click', addChecklistToCard);
        addChecklistBtn.addEventListener('click', addChecklistToCard);
    }

    if (saveCommentBtn) {
        saveCommentBtn.removeEventListener('click', addComment);
        saveCommentBtn.addEventListener('click', addComment);
    }

    if (deleteCardBtn) {
        deleteCardBtn.removeEventListener('click', deleteCard);
        deleteCardBtn.addEventListener('click', deleteCard);
    }
}

// Funções auxiliares para event handlers
function handleTitleInput() {
    if (currentCard) {
        currentCard.title = this.value;
        updateCardInBoard(currentCard);
    }
}

function handleDescriptionBlur() {
    if (currentCard) {
        currentCard.description = this.value;
        updateCardInBoard(currentCard);
    }
}

function handleAttachmentInlineClick() {
    const addAttachmentBtn = document.getElementById('add-attachment-btn');
    if (addAttachmentBtn) {
        addAttachmentBtn.click();
    }
}

function saveCurrentCardChanges() {
    if (!currentCard) return;

    const titleInput = document.getElementById('card-title-input');
    const descriptionTextarea = document.getElementById('description-textarea');

    if (titleInput) currentCard.title = titleInput.value;
    if (descriptionTextarea) currentCard.description = descriptionTextarea.value;

    updateCardInBoard(currentCard);
    renderLists(); // Re-renderizar para mostrar mudanças
}

// ============================================
// LABELS
// ============================================
let pendingLabelColor = null;

function showLabelsModal() {
    const labelsModal = document.getElementById('labels-modal');
    labelsModal.style.display = 'flex';

    // Setup event listeners para opções de labels
    const labelOptions = labelsModal.querySelectorAll('.label-option');
    labelOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            const color = option.getAttribute('data-color');
            
            // Guardar a cor e mostrar modal de nomeação
            pendingLabelColor = color;
            labelsModal.style.display = 'none';
            showLabelNameModal(color);
        });
    });

    // Fechar modal
    const closeBtn = labelsModal.querySelector('.close-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            labelsModal.style.display = 'none';
        });
    }

    // Fechar ao clicar no backdrop
    const backdrop = labelsModal.querySelector('.modal-backdrop');
    if (backdrop) {
        backdrop.addEventListener('click', () => {
            labelsModal.style.display = 'none';
        });
    }
}

function showLabelNameModal(color) {
    const modal = document.getElementById('label-name-modal');
    const colorPreview = document.getElementById('label-color-preview');
    const defaultName = document.getElementById('label-default-name');
    const input = document.getElementById('label-name-input');
    
    // Configurar preview
    colorPreview.className = `label-color-preview ${color}`;
    defaultName.textContent = getDefaultLabelName(color);
    
    // Carregar nome atual se existir
    const labelNames = getLabelNames();
    input.value = labelNames[color] || '';
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Focar no input
    setTimeout(() => input.focus(), 100);
    
    // Enter para salvar
    input.onkeypress = (e) => {
        if (e.key === 'Enter') {
            confirmLabelName();
        }
    };
}

function closeLabelNameModal() {
    const modal = document.getElementById('label-name-modal');
    modal.style.display = 'none';
    pendingLabelColor = null;
}

function confirmLabelName() {
    if (!pendingLabelColor) return;
    
    const input = document.getElementById('label-name-input');
    const labelName = input.value.trim();
    
    // Salvar o nome personalizado se fornecido
    if (labelName) {
        saveLabelName(pendingLabelColor, labelName);
    }
    
    // Adicionar/remover o marcador do card
    toggleCardLabel(pendingLabelColor);
    
    // Fechar modal
    closeLabelNameModal();
}

function saveLabelName(color, name) {
    const labelNames = getLabelNames();
    labelNames[color] = name.trim() || getDefaultLabelName(color);
    
    // Salvar no localStorage por usuário
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    const storageKey = loggedUser ? `label-names_${loggedUser.email}` : 'label-names';
    localStorage.setItem(storageKey, JSON.stringify(labelNames));
    
    // Atualizar display se o card atual tem esse label
    if (currentCard && currentCard.labels) {
        renderCardLabels(currentCard);
    }
    
    // Re-renderizar listas para atualizar os cards
    renderLists();
}

function getLabelNames() {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
    const storageKey = loggedUser ? `label-names_${loggedUser.email}` : 'label-names';
    const saved = localStorage.getItem(storageKey);
    
    if (saved) {
        return JSON.parse(saved);
    }
    
    // Nomes padrão
    return {
        green: 'Verde',
        yellow: 'Amarelo',
        orange: 'Laranja',
        red: 'Vermelho',
        purple: 'Roxo',
        blue: 'Azul'
    };
}

function getDefaultLabelName(color) {
    const defaults = {
        green: 'Verde',
        yellow: 'Amarelo',
        orange: 'Laranja',
        red: 'Vermelho',
        purple: 'Roxo',
        blue: 'Azul'
    };
    return defaults[color] || color;
}

function toggleCardLabel(color) {
    if (!currentCard) return;

    if (!currentCard.labels) {
        currentCard.labels = [];
    }

    const labelIndex = currentCard.labels.indexOf(color);
    if (labelIndex > -1) {
        currentCard.labels.splice(labelIndex, 1);
    } else {
        currentCard.labels.push(color);
    }

    updateCardInBoard(currentCard);
    renderCardLabels(currentCard);
}

function renderCardLabels(card) {
    const labelsContainer = document.getElementById('labels-container');
    if (!labelsContainer) return;

    const labelNames = getLabelNames();
    
    labelsContainer.innerHTML = '';
    
    if (card.labels && card.labels.length > 0) {
        card.labels.forEach(color => {
            const label = document.createElement('div');
            label.className = `label ${color}`;
            label.textContent = labelNames[color] || capitalizeFirst(color);
            labelsContainer.appendChild(label);
        });
    }
}

// ============================================
// CHECKLIST
// ============================================
function addChecklistToCard() {
    if (!currentCard) return;

    if (!currentCard.checklist) {
        currentCard.checklist = [];
    }

    // Mostrar seção de checklist
    const checklistSection = document.getElementById('checklist-section');
    if (checklistSection) {
        checklistSection.style.display = 'block';
        renderChecklist(currentCard);
        
        // Adicionar event listener para novo item
        const addChecklistItemBtn = document.getElementById('add-checklist-item-btn');
        const newChecklistItemInput = document.getElementById('new-checklist-item');
        
        if (addChecklistItemBtn && newChecklistItemInput) {
            addChecklistItemBtn.addEventListener('click', () => {
                const text = newChecklistItemInput.value.trim();
                if (text) {
                    currentCard.checklist.push({
                        id: generateId(),
                        text: text,
                        completed: false
                    });
                    updateCardInBoard(currentCard);
                    renderChecklist(currentCard);
                    newChecklistItemInput.value = '';
                }
            });

            newChecklistItemInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addChecklistItemBtn.click();
                }
            });
        }
    }
}

function renderChecklist(card) {
    const checklistItems = document.getElementById('checklist-items');
    const progressFill = document.getElementById('checklist-progress');
    const progressText = document.getElementById('progress-text');
    
    if (!checklistItems || !card.checklist) return;

    // Calcular progresso
    const completed = card.checklist.filter(item => item.completed).length;
    const total = card.checklist.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Atualizar barra de progresso
    if (progressFill) progressFill.style.width = percentage + '%';
    if (progressText) progressText.textContent = percentage + '%';

    // Renderizar itens
    checklistItems.innerHTML = '';
    card.checklist.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `checklist-item ${item.completed ? 'completed' : ''}`;
        itemDiv.innerHTML = `
            <input type="checkbox" ${item.completed ? 'checked' : ''} onchange="toggleChecklistItem(${index})">
            <span class="item-text">${item.text}</span>
        `;
        checklistItems.appendChild(itemDiv);
    });
}

function toggleChecklistItem(index) {
    if (!currentCard || !currentCard.checklist) return;

    currentCard.checklist[index].completed = !currentCard.checklist[index].completed;
    updateCardInBoard(currentCard);
    renderChecklist(currentCard);
}

// ============================================
// COMMENTS
// ============================================
function addComment() {
    const commentTextarea = document.getElementById('comment-textarea');
    const text = commentTextarea.value.trim();
    
    if (!text || !currentCard) return;

    if (!currentCard.comments) {
        currentCard.comments = [];
    }

    const user = JSON.parse(localStorage.getItem('loggedUser'));
    const author = user ? (user.username || user.email.split('@')[0]) : 'Usuário';

    const comment = {
        id: generateId(),
        author: author,
        text: text,
        date: new Date().toISOString()
    };

    currentCard.comments.unshift(comment);
    updateCardInBoard(currentCard);
    renderComments(currentCard);
    commentTextarea.value = '';
}

function renderComments(card) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList || !card.comments) return;

    commentsList.innerHTML = '';
    card.comments.forEach(comment => {
        const commentDiv = document.createElement('div');
        commentDiv.className = 'comment';
        
        // Obter foto de perfil
        const profile = getUserProfile();
        const profilePhoto = profile.photo;
        
        // Criar avatar com foto se disponível
        let avatarHTML = '';
        if (profilePhoto) {
            avatarHTML = `<div class="comment-avatar"><img src="${profilePhoto}" alt="${comment.author}"></div>`;
        } else {
            avatarHTML = `<div class="comment-avatar">${comment.author[0].toUpperCase()}</div>`;
        }
        
        commentDiv.innerHTML = `
            ${avatarHTML}
            <div class="comment-content">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-date">${formatDateTime(new Date(comment.date))}</span>
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
        commentsList.appendChild(commentDiv);
    });
}

// ============================================
// BOARD MANAGEMENT
// ============================================
function showCreateBoardModal() {
    const modal = document.getElementById('create-board-modal');
    modal.style.display = 'flex';

    const form = document.getElementById('create-board-form');
    const closeBtn = modal.querySelector('.close-modal');

    // Background selection
    const bgOptions = modal.querySelectorAll('.bg-option');
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            bgOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
        });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('board-name-input').value.trim();
        const selectedBg = modal.querySelector('.bg-option.selected').getAttribute('data-bg');
        
        if (name) {
            createBoard(name, selectedBg);
            modal.style.display = 'none';
            form.reset();
        }
    });

    // Close modal
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
}

function createBoard(name, background) {
    const newBoard = {
        id: generateId(),
        name: name,
        background: background,
        starred: false,
        lists: createDefaultLists() // Board inicia com listas padrão do Florense
    };

    boards.push(newBoard);
    saveBoards();
    switchToBoard(newBoard.id);
    applyBoardBackground(background);
    renderBoardsList();
}

function applyBoardBackground(background) {
    const boardContainer = document.getElementById('board-container');
    if (!boardContainer) return;

    // Remove todas as classes de background anteriores
    const backgroundClasses = [
        'gradient1', 'gradient2', 'gradient3', 'gradient4', 'gradient5', 'gradient6',
        'nature1', 'nature2', 'nature3', 'nature4', 'nature5', 'nature6',
        'mountain1', 'mountain2', 'ocean1', 'ocean2', 'forest1', 'sunset1',
        'tropical1', 'tropical2', 'beach1', 'beach2', 'jungle1', 'waterfall1',
        'sky1', 'clouds1', 'sunrise1', 'storm1', 'aurora1', 'stars1'
    ];
    
    backgroundClasses.forEach(cls => {
        boardContainer.classList.remove(cls);
    });

    // Adiciona a nova classe de background
    if (background) {
        boardContainer.classList.add(background);
    }
}

function switchToBoard(boardId) {
    currentBoardId = boardId;
    localStorage.setItem(getCurrentBoardIdKey(), boardId);
    loadCurrentBoard();
    
    // Aplicar background do board
    const board = boards.find(b => b.id === boardId);
    if (board && board.background) {
        applyBoardBackground(board.background);
    }
    
    // Fechar sidebar
    document.getElementById('boards-sidebar').classList.remove('open');
}

function renderBoardsList() {
    const boardsList = document.getElementById('boards-list');
    if (!boardsList) return;

    boardsList.innerHTML = '';
    boards.forEach(board => {
        const boardItem = document.createElement('a');
        boardItem.className = `board-item ${board.id === currentBoardId ? 'active' : ''}`;
        boardItem.href = '#';
        boardItem.innerHTML = `
            <div class="board-color" style="background: ${getBoardBackground(board.background)};"></div>
            <span class="board-name">${board.name}</span>
            <button class="delete-board-btn-sidebar" onclick="deleteBoardFromSidebar('${board.id}', event)" title="Excluir quadro">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        boardItem.addEventListener('click', (e) => {
            e.preventDefault();
            switchToBoard(board.id);
        });
        
        boardsList.appendChild(boardItem);
    });
}

function getBoardBackground(backgroundType) {
    const backgrounds = {
        gradient1: 'linear-gradient(45deg, #667eea, #764ba2)',
        gradient2: 'linear-gradient(45deg, #f093fb, #f5576c)', 
        gradient3: 'linear-gradient(45deg, #4facfe, #00f2fe)',
        gradient4: 'linear-gradient(45deg, #43e97b, #38f9d7)',
        // Gradientes adicionais para mais variedade
        gradient5: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
        gradient6: 'linear-gradient(45deg, #a8edea, #fed6e3)',
        // Suporte para imagens (retorna gradiente padrão para sidebar)
        image1: 'linear-gradient(45deg, #667eea, #764ba2)',
        image2: 'linear-gradient(45deg, #4facfe, #00f2fe)'
    };
    return backgrounds[backgroundType] || backgrounds.gradient1;
}

// ============================================
// CARD OPERATIONS
// ============================================
async function addCard(listId, title) {
    const list = currentBoard.lists.find(l => l.id === listId);
    if (!list) return;

    const newCard = {
        id: generateId(),
        title: title,
        description: '',
        labels: [],
        checklist: [],
        comments: [],
        dueDate: null,
        createdAt: new Date().toISOString()
    };

    list.cards.push(newCard);
    
    // 🔥 SALVAR NO FIREBASE
    await saveBoardToFirebase();
    
    renderLists(); // Re-renderizar todas as listas para garantir consistência
}

async function addCardWithDetails(listId, cardData) {
    const list = currentBoard.lists.find(l => l.id === listId);
    if (!list) return;

    // Create card title from order number and client name
    const cardTitle = `#${cardData.numeroPedido} - ${cardData.cliente}`;
    
    const newCard = {
        id: generateId(),
        title: cardTitle,
        description: cardData.solicitacao,
        numeroPedido: cardData.numeroPedido,
        cliente: cardData.cliente,
        telefone: cardData.telefone,
        engenheiro: cardData.engenheiro,
        arquiteto: cardData.arquiteto,
        solicitacao: cardData.solicitacao,
        labels: [],
        checklist: [],
        comments: [],
        dueDate: null,
        createdAt: new Date().toISOString()
    };

    list.cards.push(newCard);
    
    // 🔥 SALVAR NO FIREBASE
    await saveBoardToFirebase();
    
    renderLists(); // Re-renderizar todas as listas para garantir consistência
}

function moveCard(cardId, sourceListId, targetListId) {
    const sourceList = currentBoard.lists.find(l => l.id === sourceListId);
    const targetList = currentBoard.lists.find(l => l.id === targetListId);
    
    if (!sourceList || !targetList) return;

    const cardIndex = sourceList.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return;

    const card = sourceList.cards.splice(cardIndex, 1)[0];
    targetList.cards.push(card);
    
    saveBoards();
    renderLists();
}

function findCard(cardId) {
    for (let list of currentBoard.lists) {
        const card = list.cards.find(c => c.id === cardId);
        if (card) return card;
    }
    return null;
}

async function updateCardInBoard(card) {
    for (let list of currentBoard.lists) {
        const cardIndex = list.cards.findIndex(c => c.id === card.id);
        if (cardIndex !== -1) {
            list.cards[cardIndex] = card;
            
            // 🔥 SALVAR NO FIREBASE
            await saveBoardToFirebase();
            
            break;
        }
    }
}

async function deleteCard() {
    if (!currentCard) return;

    if (confirm('Tem certeza que deseja excluir este cartão?')) {
        for (let list of currentBoard.lists) {
            const cardIndex = list.cards.findIndex(c => c.id === currentCard.id);
            if (cardIndex !== -1) {
                list.cards.splice(cardIndex, 1);
                
                // 🔥 SALVAR NO FIREBASE
                await saveBoardToFirebase();
                
                closeCardDetailModal();
                renderLists();
                break;
            }
        }
    }
}

// ============================================
// LIST OPERATIONS
// ============================================
function addList(name) {
    const newList = {
        id: generateId(),
        name: name,
        cards: []
    };

    currentBoard.lists.push(newList);
    saveBoards();
    renderLists();
}

function updateListTitle(listId, newTitle) {
    const list = currentBoard.lists.find(l => l.id === listId);
    if (list) {
        list.name = newTitle;
        saveBoards();
    }
}

function deleteList(listId) {
    if (!currentBoard) return;
    
    // Permitir excluir qualquer lista - boards podem ficar completamente vazios
    // Usuário tem controle total para personalizar como desejar
    
    // Encontrar e remover a lista
    const listIndex = currentBoard.lists.findIndex(l => l.id === listId);
    if (listIndex > -1) {
        const listName = currentBoard.lists[listIndex].name;
        currentBoard.lists.splice(listIndex, 1);
        saveBoards();
        renderLists();
        
        // Mostrar notificação de sucesso
        showNotification(`Lista "${listName}" excluída com sucesso!`);
    }
}

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function toggleBoardsSidebar() {
    const sidebar = document.getElementById('boards-sidebar');
    sidebar.classList.toggle('open');
}

function toggleUserDropdown(e) {
    e.stopPropagation();
    const dropdown = document.getElementById('user-dropdown');
    dropdown.classList.toggle('show');
}

function toggleBoardStar() {
    if (currentBoard) {
        currentBoard.starred = !currentBoard.starred;
        saveBoards();
        
        const starBtn = document.getElementById('star-board');
        const starIcon = starBtn.querySelector('i');
        
        if (currentBoard.starred) {
            starIcon.className = 'fas fa-star';
            starBtn.classList.add('starred');
        } else {
            starIcon.className = 'far fa-star';
            starBtn.classList.remove('starred');
        }
    }
}

function updateBoardTitle() {
    const titleInput = document.getElementById('board-title');
    if (currentBoard && titleInput) {
        currentBoard.name = titleInput.textContent.trim();
        saveBoards();
        renderBoardsList();
    }
}

async function deleteBoardFromSidebar(boardId, event) {
    // Prevenir que o clique no botão de exclusão troque de board
    event.stopPropagation();
    
    // Encontrar o board
    const board = boards.find(b => b.id === boardId);
    if (!board) {
        showNotification('Quadro não encontrado!', 'error');
        return;
    }
    
    // Não permitir excluir se for o único board
    if (boards.length === 1) {
        showNotification('Não é possível excluir o último quadro. Crie outro primeiro.');
        return;
    }
    
    try {
        // 🔥 DELETAR DO FIREBASE PRIMEIRO
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            console.log('🔥 Deletando board do Firebase:', boardId);
            const result = await window.firebaseService.deleteBoard(boardId);
            
            if (result.success) {
                console.log('✅ Board deletado do Firebase');
            } else {
                console.error('❌ Erro ao deletar do Firebase:', result.error);
                showNotification('Erro ao excluir quadro do Firebase', 'error');
                return;
            }
        }
        
        // Deletar do array local
        const boardIndex = boards.findIndex(b => b.id === boardId);
        if (boardIndex > -1) {
            boards.splice(boardIndex, 1);
            saveBoards(); // Salvar no localStorage também
            
            // Se era o board atual, mudar para o primeiro disponível
            if (currentBoardId === boardId) {
                currentBoardId = boards[0].id;
                localStorage.setItem(getCurrentBoardIdKey(), currentBoardId);
                await loadCurrentBoard();
            }
            
            // Re-renderizar lista de boards
            renderBoardsList();
            
            // Mostrar notificação de sucesso
            showNotification(`Quadro "${board.name}" excluído com sucesso!`);
        }
    } catch (error) {
        console.error('❌ Erro ao deletar board:', error);
        showNotification('Erro ao excluir quadro', 'error');
    }
}

function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    if (!query) {
        renderLists();
        return;
    }

    // Filtrar cartões por título ou descrição
    const filteredBoard = {
        ...currentBoard,
        lists: currentBoard.lists.map(list => ({
            ...list,
            cards: list.cards.filter(card => 
                card.title.toLowerCase().includes(query) ||
                (card.description && card.description.toLowerCase().includes(query))
            )
        }))
    };

    // Renderizar apenas cartões filtrados
    const listsContainer = document.getElementById('lists-container');
    listsContainer.innerHTML = '';

    filteredBoard.lists.forEach(list => {
        const listElement = createListElement(list);
        listsContainer.appendChild(listElement);
    });

    const addListContainer = createAddListContainer();
    listsContainer.appendChild(addListContainer);
}

async function logout() {
    try {
        console.log('🚪 Fazendo logout...');
        
        // 1. Fazer logout no Firebase
        try {
            await firebase.auth().signOut();
            console.log('✅ Logout Firebase realizado');
        } catch (firebaseError) {
            console.warn('⚠️ Erro no logout Firebase:', firebaseError);
        }
        
        // 2. Limpar localStorage (IMPORTANTE!)
        localStorage.removeItem('loggedUser');
        localStorage.removeItem('adminUser');
        console.log('✅ localStorage limpo');
        
        // 3. Redirecionar para login
        console.log('🔄 Redirecionando para login...');
        window.location.href = "login.html";
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        
        // Mesmo com erro, limpar tudo e redirecionar
        localStorage.removeItem('loggedUser');
        localStorage.removeItem('adminUser');
        window.location.href = "login.html";
    }
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
        modal.style.display = 'none';
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Função para criar as listas padrão do Florense
function createDefaultLists() {
    return [
        {
            id: generateId(),
            name: 'Recebido',
            cards: []
        },
        {
            id: generateId(),
            name: 'Alteração de Projetos',
            cards: []
        },
        {
            id: generateId(),
            name: 'Liberação de Projetos',
            cards: []
        },
        {
            id: generateId(),
            name: 'Projetos Liberados',
            cards: []
        }
    ];
}

function getUserBoardsKey() {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    // CORREÇÃO: Usar o e-mail do usuário como chave única para separar boards por usuário
    // Isso evita que os boards sejam compartilhados entre usuários diferentes
    return user ? `boards_${user.email}` : 'boards_default';
}

function getCurrentBoardIdKey() {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    // Chave específica por usuário para o currentBoardId
    return user ? `currentBoardId_${user.email}` : 'currentBoardId_default';
}

function getBoards() {
    // CORREÇÃO: Buscar boards específicos do usuário logado
    return JSON.parse(localStorage.getItem(getUserBoardsKey())) || [];
}

function saveBoards() {
    if (!currentBoard) return;
    
    // Adicionar timestamp de última modificação
    currentBoard.lastModified = new Date().toISOString();
    
    // Atualizar no array boards do usuário atual
    const boardIndex = boards.findIndex(b => b.id === currentBoard.id);
    if (boardIndex > -1) {
        boards[boardIndex] = currentBoard;
    }
    
    // Salvar no localStorage do usuário atual
    localStorage.setItem(getUserBoardsKey(), JSON.stringify(boards));
    
    // ============================================
    // SINCRONIZAÇÃO BIDIRECIONAL
    // ============================================
    // Se o quadro tem membros compartilhados, sincronizar com eles
    if (currentBoard.sharedWith && currentBoard.sharedWith.length > 0) {
        syncBoardWithMembers(currentBoard);
    }
    
    // Se o quadro foi compartilhado COM você (você não é o owner), sincronizar de volta com o owner
    const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
    if (currentBoard.owner && currentBoard.owner !== currentUser.email) {
        syncBoardWithOwner(currentBoard);
    }
    
    console.log('Board salvo e sincronizado com membros');
}

// 🔥 SALVAR BOARD NO FIREBASE
async function saveBoardToFirebase() {
    if (!currentBoard || !currentBoard.id) return;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser) {
            console.log('💾 Salvando board no Firebase...', currentBoard.name);
            
            // Atualizar board no Firebase com as listas (que contêm os cards)
            const result = await window.firebaseService.updateBoard(currentBoard.id, {
                lists: currentBoard.lists,
                lastModified: new Date().toISOString(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            if (result.success) {
                console.log('✅ Board atualizado no Firebase!');
            } else {
                console.error('❌ Erro ao salvar no Firebase:', result.error);
            }
        }
    } catch (error) {
        console.error('❌ Erro ao salvar board no Firebase:', error);
    }
}

// Sincronizar quadro com todos os membros compartilhados
function syncBoardWithMembers(board) {
    if (!board.sharedWith || board.sharedWith.length === 0) return;
    
    board.sharedWith.forEach(memberEmail => {
        const memberBoardsKey = `boards_${memberEmail}`;
        let memberBoards = JSON.parse(localStorage.getItem(memberBoardsKey)) || [];
        
        // Encontrar e atualizar o quadro na lista do membro
        const memberBoardIndex = memberBoards.findIndex(b => b.id === board.id);
        
        if (memberBoardIndex > -1) {
            // Atualizar quadro existente
            memberBoards[memberBoardIndex] = board;
        } else {
            // Adicionar novo quadro (caso não exista ainda)
            memberBoards.push(board);
        }
        
        localStorage.setItem(memberBoardsKey, JSON.stringify(memberBoards));
        console.log(`Quadro sincronizado com ${memberEmail}`);
    });
}

// Sincronizar quadro de volta com o proprietário
function syncBoardWithOwner(board) {
    if (!board.owner) return;
    
    const ownerBoardsKey = `boards_${board.owner}`;
    let ownerBoards = JSON.parse(localStorage.getItem(ownerBoardsKey)) || [];
    
    // Encontrar e atualizar o quadro na lista do proprietário
    const ownerBoardIndex = ownerBoards.findIndex(b => b.id === board.id);
    
    if (ownerBoardIndex > -1) {
        // Atualizar quadro existente
        ownerBoards[ownerBoardIndex] = board;
        localStorage.setItem(ownerBoardsKey, JSON.stringify(ownerBoards));
        console.log(`Quadro sincronizado de volta com o proprietário ${board.owner}`);
    }
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Função auxiliar para criar data local sem problemas de timezone
function createLocalDate(dateString) {
    if (!dateString) return null;
    
    // Se for formato YYYY-MM-DD do input type="date"
    if (typeof dateString === 'string' && dateString.includes('-') && dateString.length === 10) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // mês é 0-indexed
    }
    
    // Caso contrário, usar construtor normal
    return new Date(dateString);
}

function formatDate(date) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const target = createLocalDate(date);
    if (!target) return '';
    
    target.setHours(0, 0, 0, 0);
    
    if (target.getTime() === today.getTime()) {
        return 'Hoje';
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (target.getTime() === tomorrow.getTime()) {
        return 'Amanhã';
    }
    
    return target.toLocaleDateString('pt-BR');
}

function formatDateTime(date) {
    return date.toLocaleString('pt-BR');
}

// ============================================
// ADMIN VIEWING
// ============================================
function checkAdminViewing() {
    const isAdminViewing = localStorage.getItem('admin-viewing');
    
    if (isAdminViewing === 'true') {
        // Criar banner de admin
        const banner = document.createElement('div');
        banner.id = 'admin-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: linear-gradient(135deg, #eb5a46 0%, #c9372c 100%);
            color: white;
            padding: 0.75rem;
            text-align: center;
            z-index: 10000;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            font-weight: 600;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
        `;
        
        const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
        
        banner.innerHTML = `
            <i class="fas fa-shield-alt"></i>
            <span>MODO ADMINISTRADOR - Visualizando quadro de: ${currentUser.username}</span>
            <button onclick="returnToAdminPanel()" style="
                background: white;
                color: #eb5a46;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            " onmouseover="this.style.transform='scale(1.05)'" 
               onmouseout="this.style.transform='scale(1)'">
                <i class="fas fa-arrow-left"></i> Voltar ao Painel Admin
            </button>
        `;
        
        document.body.prepend(banner);
        
        // Ajustar padding do body para compensar o banner
        document.body.style.paddingTop = '60px';
    }
}

function returnToAdminPanel() {
    // Restaurar admin
    const adminUser = JSON.parse(localStorage.getItem('admin-temp'));
    if (adminUser) {
        localStorage.setItem('loggedUser', JSON.stringify(adminUser));
        localStorage.removeItem('admin-temp');
    }
    
    // Limpar flag
    localStorage.removeItem('admin-viewing');
    
    // Voltar para o painel
    window.location.href = 'admin.html';
}

window.returnToAdminPanel = returnToAdminPanel;

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function goBackToPrevious() {
    // Verificar se é admin visualizando
    if (localStorage.getItem('admin-viewing') === 'true') {
        returnToAdminPanel();
        return;
    }
    
    // Volta para a homepage do Trello
    window.location.href = 'trello-home.html';
}

// ============================================
// GLOBAL FUNCTIONS (para uso em HTML inline)
// ============================================
window.toggleChecklistItem = toggleChecklistItem;
window.openCardModal = openCardModal;
window.closeCardDetailModal = closeCardDetailModal;
window.goBackToPrevious = goBackToPrevious;
window.deleteBoardFromSidebar = deleteBoardFromSidebar;
window.closeLabelNameModal = closeLabelNameModal;
window.confirmLabelName = confirmLabelName;

// ============================================
// POWER-UPS FUNCTIONS
// ============================================
function showPowerupsModal() {
    document.getElementById('powerups-modal').style.display = 'flex';
}

function closePowerupsModal() {
    document.getElementById('powerups-modal').style.display = 'none';
}

function addPowerup(type) {
    if (!currentCard) return;
    
    if (!currentCard.powerups) currentCard.powerups = [];
    
    const powerupData = {
        calendar: { name: 'Calendário', icon: 'fas fa-calendar-alt' },
        voting: { name: 'Votação', icon: 'fas fa-vote-yea' },
        'time-tracking': { name: 'Controle de Tempo', icon: 'fas fa-stopwatch' },
        'custom-fields': { name: 'Campos Personalizados', icon: 'fas fa-th-list' }
    };
    
    const powerup = {
        id: generateId(),
        type: type,
        name: powerupData[type].name,
        icon: powerupData[type].icon,
        active: true
    };
    
    currentCard.powerups.push(powerup);
    saveBoards();
    updateCardModal();
    closePowerupsModal();
    
    showNotification(`Power-up "${powerup.name}" adicionado com sucesso!`);
}

// ============================================
// AUTOMATIONS FUNCTIONS
// ============================================
function showAutomationsModal() {
    document.getElementById('automations-modal').style.display = 'flex';
}

function closeAutomationsModal() {
    document.getElementById('automations-modal').style.display = 'none';
}

function addAutomation(type) {
    if (!currentCard) return;
    
    if (!currentCard.automations) currentCard.automations = [];
    
    const automationData = {
        'move-card': { name: 'Mover cartão automaticamente', description: 'Move cartão baseado em condições' },
        'due-date': { name: 'Data de vencimento automática', description: 'Adiciona data de vencimento automaticamente' },
        'assign-member': { name: 'Atribuir membro automaticamente', description: 'Atribui membro baseado em condições' },
        'add-label': { name: 'Adicionar etiqueta automaticamente', description: 'Adiciona etiqueta baseado em condições' }
    };
    
    const automation = {
        id: generateId(),
        type: type,
        name: automationData[type].name,
        description: automationData[type].description,
        active: true,
        conditions: [],
        actions: []
    };
    
    currentCard.automations.push(automation);
    saveBoards();
    updateCardModal();
    closeAutomationsModal();
    
    showNotification(`Automação "${automation.name}" adicionada com sucesso!`);
}

// ============================================
// DUE DATE FUNCTIONS
// ============================================
function showDueDateModal() {
    document.getElementById('due-date-modal').style.display = 'flex';
    
    // Preencher datas existentes se houver
    if (currentCard && currentCard.dates) {
        if (currentCard.dates.startDate) {
            document.getElementById('start-date').value = currentCard.dates.startDate;
        }
        if (currentCard.dates.dueDate) {
            document.getElementById('due-date').value = currentCard.dates.dueDate;
        }
        if (currentCard.dates.reminder) {
            document.getElementById('reminder').value = currentCard.dates.reminder;
        }
    }
}

function closeDueDateModal() {
    document.getElementById('due-date-modal').style.display = 'none';
}

function saveDates() {
    if (!currentCard) return;
    
    const startDate = document.getElementById('start-date').value;
    const dueDate = document.getElementById('due-date').value;
    const reminder = document.getElementById('reminder').value;
    
    if (!currentCard.dates) currentCard.dates = {};
    
    currentCard.dates.startDate = startDate;
    currentCard.dates.dueDate = dueDate;
    currentCard.dates.reminder = reminder;
    
    saveBoards();
    updateCardModal();
    updateCardDatesDisplay();
    closeDueDateModal();
    
    showNotification('Datas salvas com sucesso!');
}

function updateCardDatesDisplay() {
    const datesSection = document.getElementById('card-dates-section');
    const datesContainer = document.getElementById('card-dates-container');
    
    if (!currentCard || !currentCard.dates) {
        if (datesSection) datesSection.style.display = 'none';
        return;
    }
    
    if (!datesContainer) return;
    
    datesContainer.innerHTML = '';
    let hasAnyDate = false;
    
    // Exibir data de início
    if (currentCard.dates.startDate) {
        hasAnyDate = true;
        const startDateElement = document.createElement('div');
        startDateElement.className = 'card-date-badge';
        startDateElement.innerHTML = `
            <i class="fas fa-play"></i>
            <span>Início: ${formatDate(currentCard.dates.startDate)}</span>
        `;
        datesContainer.appendChild(startDateElement);
    }
    
    // Exibir data de vencimento
    if (currentCard.dates.dueDate) {
        hasAnyDate = true;
        const dateElement = document.createElement('div');
        dateElement.className = 'card-date-badge';
        
        const dueDate = createLocalDate(currentCard.dates.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = dueDate < today;
        const isDueSoon = dueDate <= new Date(today.getTime() + 24 * 60 * 60 * 1000);
        
        dateElement.innerHTML = `
            <i class="fas fa-clock"></i>
            <span>Vence em ${formatDate(currentCard.dates.dueDate)}</span>
        `;
        
        if (isOverdue) {
            dateElement.classList.add('overdue');
        } else if (isDueSoon) {
            dateElement.classList.add('due-soon');
        }
        
        datesContainer.appendChild(dateElement);
    }
    
    // Exibir seção de datas apenas se houver alguma data
    if (datesSection) {
        datesSection.style.display = hasAnyDate ? 'block' : 'none';
    }
}

// ============================================
// MEMBERS FUNCTIONS
// ============================================

function generateMembersList() {
    // NOVA FUNCIONALIDADE: Lista de membros dinâmica baseada nos usuários cadastrados
    // Agora os membros são gerados automaticamente a partir dos emails cadastrados no sistema
    
    const membersList = document.getElementById('members-list');
    if (!membersList) return;
    
    // Busca todos os usuários cadastrados do localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Limpa a lista atual
    membersList.innerHTML = '';
    
    if (users.length === 0) {
        membersList.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Nenhum usuário cadastrado encontrado.</div>';
        return;
    }
    
    // Gera um elemento para cada usuário cadastrado
    users.forEach(user => {
        // Gera as iniciais
        let initials = 'U';
        if (user.username) {
            const names = user.username.split(' ');
            if (names.length >= 2) {
                initials = names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
            } else {
                initials = user.username.substring(0, 2).toUpperCase();
            }
        } else if (user.email) {
            initials = user.email.substring(0, 2).toUpperCase();
        }
        
        // Verificar se este usuário tem foto de perfil
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser'));
        const profileKey = `profile_${user.email}`;
        const userProfile = JSON.parse(localStorage.getItem(profileKey));
        const profilePhoto = userProfile?.photo;
        
        const memberElement = document.createElement('div');
        memberElement.className = 'member-option';
        memberElement.setAttribute('onclick', `toggleMember('${user.email}')`);
        
        // Criar avatar com foto se disponível
        let avatarHTML = '';
        if (profilePhoto) {
            avatarHTML = `<div class="member-avatar"><img src="${profilePhoto}" alt="${user.username}"><span style="display: none;">${initials}</span></div>`;
        } else {
            avatarHTML = `<div class="member-avatar"><span>${initials}</span></div>`;
        }
        
        memberElement.innerHTML = `
            ${avatarHTML}
            <div class="member-info">
                <span class="member-name">${user.username || user.email.split('@')[0]}</span>
                <span class="member-email">${user.email}</span>
            </div>
            <i class="fas fa-check member-check" style="display: none;"></i>
        `;
        
        membersList.appendChild(memberElement);
    });
}

function showMembersModal() {
    document.getElementById('members-modal').style.display = 'flex';
    generateMembersList();
    updateMembersList();
    setupMemberSearch();
}

function setupMemberSearch() {
    const searchInput = document.getElementById('member-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase().trim();
            filterMembersList(query);
        });
    }
}

function filterMembersList(query) {
    const memberOptions = document.querySelectorAll('.member-option');
    
    memberOptions.forEach(option => {
        const memberName = option.querySelector('.member-name').textContent.toLowerCase();
        const memberEmail = option.querySelector('.member-email').textContent.toLowerCase();
        
        const shouldShow = !query || 
                          memberName.includes(query) || 
                          memberEmail.includes(query);
        
        option.style.display = shouldShow ? 'flex' : 'none';
    });
}

function closeMembersModal() {
    document.getElementById('members-modal').style.display = 'none';
}

function toggleMember(memberId) {
    if (!currentCard) return;
    
    if (!currentCard.members) currentCard.members = [];
    
    const memberIndex = currentCard.members.findIndex(m => m.id === memberId);
    const memberElement = document.querySelector(`.member-option[onclick="toggleMember('${memberId}')"]`);
    const checkIcon = memberElement ? memberElement.querySelector('.member-check') : null;
    
    if (memberIndex > -1) {
        // Remover membro
        currentCard.members.splice(memberIndex, 1);
        if (memberElement) {
            memberElement.classList.remove('selected');
            if (checkIcon) checkIcon.style.display = 'none';
        }
    } else {
        // Adicionar membro
        const memberData = getMemberData(memberId);
        if (memberData) {
            currentCard.members.push(memberData);
            if (memberElement) {
                memberElement.classList.add('selected');
                if (checkIcon) checkIcon.style.display = 'block';
            }
        }
    }
    
    saveBoards();
    updateCardModal();
    updateCardMembersDisplay();
}

function getMemberData(memberId) {
    // SISTEMA DE MEMBROS INTEGRADO AO CADASTRO DE USUÁRIOS
    // Esta função agora busca usuários do localStorage em vez de usar dados fixos
    // Os emails utilizados no cadastro são automaticamente os emails dos membros
    
    // Busca todos os usuários cadastrados do localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Encontra o usuário pelo ID (que será o email)
    const user = users.find(u => u.email === memberId);
    
    if (user) {
        // Gera as iniciais baseadas no nome do usuário ou email
        let initials = 'U';
        if (user.username) {
            const names = user.username.split(' ');
            if (names.length >= 2) {
                initials = names[0][0].toUpperCase() + names[names.length - 1][0].toUpperCase();
            } else {
                initials = user.username.substring(0, 2).toUpperCase();
            }
        } else if (user.email) {
            initials = user.email.substring(0, 2).toUpperCase();
        }
        
        return {
            id: user.email,
            name: user.username || user.email.split('@')[0],
            email: user.email,
            initials: initials
        };
    }
    
    return null;
}

function updateMembersList() {
    if (!currentCard) return;
    
    const memberOptions = document.querySelectorAll('.member-option');
    memberOptions.forEach(option => {
        const onclickAttr = option.getAttribute('onclick');
        if (onclickAttr) {
            const match = onclickAttr.match(/'([^']+)'/);
            if (match) {
                const memberId = match[1];
                const checkIcon = option.querySelector('.member-check');
                const isMember = currentCard.members && currentCard.members.some(m => m.id === memberId);
                
                if (isMember) {
                    option.classList.add('selected');
                    if (checkIcon) checkIcon.style.display = 'block';
                } else {
                    option.classList.remove('selected');
                    if (checkIcon) checkIcon.style.display = 'none';
                }
            }
        }
    });
}

function updateCardMembersDisplay() {
    if (!currentCard || !currentCard.members) return;
    
    const membersContainer = document.getElementById('card-members-container');
    membersContainer.innerHTML = '';
    
    currentCard.members.forEach(member => {
        const memberElement = document.createElement('div');
        memberElement.className = 'card-member-avatar';
        memberElement.setAttribute('title', member.name);
        
        // Verificar se este membro tem foto de perfil
        const profileKey = `profile_${member.id}`;
        const userProfile = JSON.parse(localStorage.getItem(profileKey));
        const profilePhoto = userProfile?.photo;
        
        if (profilePhoto) {
            const img = document.createElement('img');
            img.src = profilePhoto;
            img.alt = member.name;
            memberElement.appendChild(img);
            
            const span = document.createElement('span');
            span.textContent = member.initials;
            span.style.display = 'none';
            memberElement.appendChild(span);
        } else {
            memberElement.textContent = member.initials;
        }
        
        membersContainer.appendChild(memberElement);
    });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: #0079bf;
        color: white;
        padding: 12px 20px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 2000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// ============================================
// EVENT LISTENERS PARA NOVOS MODAIS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Power-ups
    const addPowerupBtn = document.getElementById('add-powerup-btn');
    if (addPowerupBtn) {
        addPowerupBtn.addEventListener('click', showPowerupsModal);
    }
    
    // Automações
    const addAutomationBtn = document.getElementById('add-automation-btn');
    if (addAutomationBtn) {
        addAutomationBtn.addEventListener('click', showAutomationsModal);
    }
    
    // Datas
    const addDueDateBtn = document.getElementById('add-due-date-btn');
    if (addDueDateBtn) {
        addDueDateBtn.addEventListener('click', showDueDateModal);
    }
    
    // Membros
    const addMembersBtn = document.getElementById('add-members-btn');
    if (addMembersBtn) {
        addMembersBtn.addEventListener('click', showMembersModal);
    }
    
    // Anexos
    const addAttachmentBtn = document.getElementById('add-attachment-btn');
    if (addAttachmentBtn) {
        addAttachmentBtn.addEventListener('click', showAttachmentModal);
    }
    
    // File input
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelection);
    }
    
    // Fechar modais com clique no backdrop
    document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
        backdrop.addEventListener('click', function() {
            this.parentElement.style.display = 'none';
        });
    });
});

// ============================================
// ATTACHMENT FUNCTIONS
// ============================================
function showAttachmentModal() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.click();
    }
}

function handleFileSelection(event) {
    if (!currentCard) {
        showNotification('Erro: Nenhum cartão selecionado');
        return;
    }
    
    const files = event.target.files;
    if (files.length === 0) return;
    
    for (let file of files) {
        if (validateFileType(file)) {
            addAttachmentToCard(file);
        } else {
            showNotification(`Arquivo "${file.name}" não é suportado. Apenas PDFs e imagens são aceitos.`);
        }
    }
    
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    event.target.value = '';
}

function validateFileType(file) {
    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp'
    ];
    
    return allowedTypes.includes(file.type);
}

function addAttachmentToCard(file) {
    if (!currentCard.attachments) {
        currentCard.attachments = [];
    }
    
    // Criar URL temporária para preview (apenas para imagens)
    const isImage = file.type.startsWith('image/');
    let previewUrl = null;
    
    if (isImage) {
        previewUrl = URL.createObjectURL(file);
    }
    
    const attachment = {
        id: generateId(),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date().toISOString(),
        isImage: isImage,
        previewUrl: previewUrl
    };
    
    currentCard.attachments.push(attachment);
    saveBoards();
    updateCardModal();
    updateAttachmentsDisplay();
    
    showNotification(`Anexo "${file.name}" adicionado com sucesso!`);
}

function updateAttachmentsDisplay() {
    if (!currentCard || !currentCard.attachments || currentCard.attachments.length === 0) {
        const attachmentsSection = document.getElementById('attachments-section');
        if (attachmentsSection) {
            attachmentsSection.style.display = 'none';
        }
        return;
    }
    
    const attachmentsSection = document.getElementById('attachments-section');
    const attachmentsList = document.getElementById('attachments-list');
    
    if (attachmentsSection && attachmentsList) {
        attachmentsSection.style.display = 'block';
        attachmentsList.innerHTML = '';
        
        currentCard.attachments.forEach(attachment => {
            const attachmentElement = createAttachmentElement(attachment);
            attachmentsList.appendChild(attachmentElement);
        });
    }
}

function createAttachmentElement(attachment) {
    const attachmentDiv = document.createElement('div');
    attachmentDiv.className = 'attachment-item';
    
    const fileIcon = getFileIcon(attachment.type);
    const fileSize = formatFileSize(attachment.size);
    const uploadDate = formatDate(attachment.uploadDate);
    
    attachmentDiv.innerHTML = `
        <div class="attachment-info">
            <div class="attachment-icon">
                <i class="${fileIcon}"></i>
            </div>
            <div class="attachment-details">
                <h5 class="attachment-name">${attachment.name}</h5>
                <p class="attachment-meta">${fileSize} • ${uploadDate}</p>
            </div>
        </div>
        <div class="attachment-actions">
            ${attachment.isImage ? `<button class="btn-preview" onclick="previewAttachment('${attachment.id}')">
                <i class="fas fa-eye"></i>
            </button>` : ''}
            <button class="btn-download" onclick="downloadAttachment('${attachment.id}')">
                <i class="fas fa-download"></i>
            </button>
            <button class="btn-delete" onclick="removeAttachment('${attachment.id}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    return attachmentDiv;
}

function getFileIcon(fileType) {
    if (fileType === 'application/pdf') return 'fas fa-file-pdf';
    if (fileType.startsWith('image/')) return 'fas fa-file-image';
    return 'fas fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function previewAttachment(attachmentId) {
    const attachment = currentCard.attachments.find(a => a.id === attachmentId);
    if (!attachment || !attachment.isImage) return;
    
    // Criar modal de preview
    const previewModal = document.createElement('div');
    previewModal.className = 'attachment-preview-modal';
    previewModal.innerHTML = `
        <div class="preview-backdrop" onclick="closePreview()"></div>
        <div class="preview-content">
            <button class="preview-close" onclick="closePreview()">
                <i class="fas fa-times"></i>
            </button>
            <img src="${attachment.previewUrl}" alt="${attachment.name}" class="preview-image">
            <div class="preview-info">
                <h4>${attachment.name}</h4>
                <p>${formatFileSize(attachment.size)}</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(previewModal);
    previewModal.style.display = 'flex';
}

function closePreview() {
    const previewModal = document.querySelector('.attachment-preview-modal');
    if (previewModal) {
        previewModal.remove();
    }
}

function downloadAttachment(attachmentId) {
    showNotification('Função de download será implementada em versão futura');
}

function removeAttachment(attachmentId) {
    if (!currentCard || !currentCard.attachments) return;
    
    const attachmentIndex = currentCard.attachments.findIndex(a => a.id === attachmentId);
    if (attachmentIndex > -1) {
        // Revogar URL se for imagem
        const attachment = currentCard.attachments[attachmentIndex];
        if (attachment.previewUrl) {
            URL.revokeObjectURL(attachment.previewUrl);
        }
        
        currentCard.attachments.splice(attachmentIndex, 1);
        saveBoards();
        updateAttachmentsDisplay();
        showNotification('Anexo removido com sucesso!');
    }
}

// ============================================
// PHONE MASK UTILITY
// ============================================
function applyPhoneMask(input) {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length <= 10) {
            // Formato: (11) 9999-9999
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else {
            // Formato: (11) 99999-9999
            value = value.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
        }
        
        e.target.value = value;
    });
}

// Aplicar máscara a todos os campos de telefone existentes e futuros
function initializePhoneMasks() {
    // Aplicar máscara aos campos existentes no HTML estático
    const staticPhoneInputs = document.querySelectorAll('input[type="tel"]');
    staticPhoneInputs.forEach(input => applyPhoneMask(input));
    
    // Observer para aplicar máscara aos campos criados dinamicamente
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                    const phoneInputs = node.querySelectorAll ? node.querySelectorAll('input[type="tel"]') : [];
                    phoneInputs.forEach(input => applyPhoneMask(input));
                }
            });
        });
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
}

// ============================================
// GLOBAL FUNCTIONS EXPORT
// ============================================
window.showPowerupsModal = showPowerupsModal;
window.closePowerupsModal = closePowerupsModal;
window.addPowerup = addPowerup;
window.showAutomationsModal = showAutomationsModal;
window.closeAutomationsModal = closeAutomationsModal;
window.addAutomation = addAutomation;
window.showDueDateModal = showDueDateModal;
window.closeDueDateModal = closeDueDateModal;
window.saveDates = saveDates;
window.showMembersModal = showMembersModal;
window.closeMembersModal = closeMembersModal;
window.toggleMember = toggleMember;
window.showAttachmentModal = showAttachmentModal;
window.previewAttachment = previewAttachment;
window.downloadAttachment = downloadAttachment;
window.removeAttachment = removeAttachment;
window.closePreview = closePreview;

// ============================================
// SISTEMA DE NOTIFICAÇÕES (do trello-home)
// ============================================

// Importar funções do sistema de notificações
function getNotificationsKey() {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    return user ? `notifications_${user.email}` : 'notifications_default';
}

function getNotifications() {
    return JSON.parse(localStorage.getItem(getNotificationsKey())) || [];
}

function saveNotifications(notifications) {
    localStorage.setItem(getNotificationsKey(), JSON.stringify(notifications));
    updateNotificationBadge();
}

function updateNotificationBadge() {
    const notifications = getNotifications();
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notification-badge');
    
    if (badge) {
        badge.textContent = unreadCount;
        if (unreadCount > 0) {
            badge.classList.add('show');
        } else {
            badge.classList.remove('show');
        }
    }
}

function loadNotifications() {
    const notifications = getNotifications();
    const notificationsList = document.getElementById('notifications-list');
    
    if (!notificationsList) return;
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="notifications-empty">
                <i class="fas fa-bell-slash"></i>
                <p>Nenhuma notificação</p>
            </div>
        `;
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => `
        <div class="notification-item ${notif.read ? '' : 'unread'}" onclick="markNotificationAsRead('${notif.id}')">
            <div class="notification-icon ${notif.type}">
                <i class="fas fa-${getNotificationIcon(notif.type)}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.title}</div>
                <div class="notification-message">${notif.message}</div>
                <div class="notification-time">${formatNotificationTime(notif.timestamp)}</div>
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        info: 'info-circle',
        success: 'check-circle',
        warning: 'exclamation-triangle',
        error: 'times-circle'
    };
    return icons[type] || 'info-circle';
}

function formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Agora mesmo';
    if (diffMinutes < 60) return `${diffMinutes}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    
    return time.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function markNotificationAsRead(notificationId) {
    const notifications = getNotifications();
    const notification = notifications.find(n => n.id === notificationId);
    
    if (notification && !notification.read) {
        notification.read = true;
        saveNotifications(notifications);
        loadNotifications();
    }
}

function markAllNotificationsAsRead() {
    const notifications = getNotifications();
    notifications.forEach(n => n.read = true);
    saveNotifications(notifications);
    loadNotifications();
}

function clearAllNotifications() {
    saveNotifications([]);
    loadNotifications();
}

// Event Listeners para notificações
const notificationBtn = document.getElementById('notification-btn');
const notificationsDropdown = document.getElementById('notifications-dropdown');

if (notificationBtn && notificationsDropdown) {
    notificationBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsDropdown.classList.toggle('show');
        
        // Fechar outros dropdowns
        const supportDropdown = document.getElementById('support-dropdown');
        const userDropdown = document.getElementById('user-dropdown');
        if (supportDropdown) supportDropdown.classList.remove('show');
        if (userDropdown) userDropdown.classList.remove('show');
        
        loadNotifications();
    });
}

const markAllReadBtn = document.getElementById('mark-all-read');
if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
}

const clearAllBtn = document.getElementById('clear-all-notifications');
if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearAllNotifications);
}

// Support dropdown
const supportBtn = document.getElementById('support-btn');
const supportDropdown = document.getElementById('support-dropdown');

if (supportBtn && supportDropdown) {
    supportBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        supportDropdown.classList.toggle('show');
        
        if (notificationsDropdown) notificationsDropdown.classList.remove('show');
        const userDropdown = document.getElementById('user-dropdown');
        if (userDropdown) userDropdown.classList.remove('show');
    });
}

// ============================================
// SISTEMA DE PERFIL (sincronizado com trello-home)
// ============================================

function getUserProfileKey() {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    return user ? `profile_${user.email}` : 'profile_default';
}

function getUserProfile() {
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    const savedProfile = JSON.parse(localStorage.getItem(getUserProfileKey()));
    
    return {
        name: savedProfile?.name || user?.username || '',
        email: user?.email || '',
        phone: savedProfile?.phone || '',
        bio: savedProfile?.bio || '',
        photo: savedProfile?.photo || null
    };
}

function saveUserProfile(profile) {
    localStorage.setItem(getUserProfileKey(), JSON.stringify(profile));
    updateUserDisplay();
}

function showProfileModal() {
    const modal = document.getElementById('profile-modal');
    const profile = getUserProfile();
    
    // Preencher campos
    document.getElementById('profile-name').value = profile.name;
    document.getElementById('profile-email').value = profile.email;
    document.getElementById('profile-phone').value = profile.phone;
    document.getElementById('profile-bio').value = profile.bio;
    
    // Exibir foto se existir
    const avatarImage = document.getElementById('profile-avatar-image');
    const avatarInitial = document.getElementById('profile-avatar-initial');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    
    if (profile.photo) {
        avatarImage.src = profile.photo;
        avatarImage.style.display = 'block';
        avatarInitial.style.display = 'none';
        removePhotoBtn.style.display = 'inline-flex';
    } else {
        avatarImage.style.display = 'none';
        avatarInitial.style.display = 'flex';
        avatarInitial.textContent = profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase();
        removePhotoBtn.style.display = 'none';
    }
    
    modal.classList.add('show');
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal');
    modal.classList.remove('show');
}

function saveProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const photo = document.getElementById('profile-avatar-image').src || null;
    
    if (!name) {
        showNotification('Por favor, digite seu nome', 'warning');
        return;
    }
    
    const profile = getUserProfile();
    profile.name = name;
    profile.phone = phone;
    profile.bio = bio;
    if (photo && photo !== window.location.href) {
        profile.photo = photo;
    }
    
    saveUserProfile(profile);
    closeProfileModal();
    
    showNotification('Perfil atualizado com sucesso!', 'success');
    
    // Adicionar notificação no sistema
    const notifications = getNotifications();
    notifications.unshift({
        id: Date.now().toString(),
        type: 'success',
        title: 'Perfil Atualizado',
        message: 'Suas informações de perfil foram atualizadas com sucesso.',
        timestamp: new Date().toISOString(),
        read: false
    });
    saveNotifications(notifications);
}

function handlePhotoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem válida', 'error');
        return;
    }
    
    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('A imagem deve ter no máximo 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const avatarImage = document.getElementById('profile-avatar-image');
        const avatarInitial = document.getElementById('profile-avatar-initial');
        const removePhotoBtn = document.getElementById('remove-photo-btn');
        
        avatarImage.src = e.target.result;
        avatarImage.style.display = 'block';
        avatarInitial.style.display = 'none';
        removePhotoBtn.style.display = 'inline-flex';
        
        showNotification('Foto carregada! Clique em "Salvar alterações" para confirmar.', 'info');
    };
    
    reader.readAsDataURL(file);
}

function removePhoto() {
    const avatarImage = document.getElementById('profile-avatar-image');
    const avatarInitial = document.getElementById('profile-avatar-initial');
    const removePhotoBtn = document.getElementById('remove-photo-btn');
    const photoInput = document.getElementById('profile-photo-input');
    
    avatarImage.src = '';
    avatarImage.style.display = 'none';
    avatarInitial.style.display = 'flex';
    removePhotoBtn.style.display = 'none';
    photoInput.value = '';
    
    const profile = getUserProfile();
    avatarInitial.textContent = profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase();
    
    showNotification('Foto removida! Clique em "Salvar alterações" para confirmar.', 'info');
}

function updateUserDisplay() {
    const profile = getUserProfile();
    
    // Atualizar iniciais e nome no header
    const userInitial = document.getElementById('user-initial');
    const avatarLargeInitial = document.getElementById('avatar-large-initial');
    const userName = document.getElementById('user-name');
    const userEmail = document.getElementById('user-email');
    
    const initial = profile.name ? profile.name[0].toUpperCase() : profile.email[0].toUpperCase();
    const displayName = profile.name || profile.email.split('@')[0];
    
    if (userInitial) userInitial.textContent = initial;
    if (avatarLargeInitial) avatarLargeInitial.textContent = initial;
    if (userName) userName.textContent = displayName;
    if (userEmail) userEmail.textContent = profile.email;
    
    // Atualizar foto se existir
    const userAvatar = document.getElementById('user-avatar');
    const avatarLarge = document.querySelector('.avatar-large');
    
    if (profile.photo) {
        // Adicionar foto ao avatar pequeno (header)
        if (userAvatar) {
            let img = userAvatar.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                userAvatar.appendChild(img);
            }
            img.src = profile.photo;
            if (userInitial) userInitial.style.display = 'none';
        }
        
        // Adicionar foto ao avatar grande (dropdown)
        if (avatarLarge) {
            let img = avatarLarge.querySelector('img');
            if (!img) {
                img = document.createElement('img');
                avatarLarge.appendChild(img);
            }
            img.src = profile.photo;
            if (avatarLargeInitial) avatarLargeInitial.style.display = 'none';
        }
    } else {
        // Remover fotos se não existirem e mostrar iniciais
        if (userAvatar) {
            const img = userAvatar.querySelector('img');
            if (img) img.remove();
            if (userInitial) userInitial.style.display = 'flex';
        }
        
        if (avatarLarge) {
            const img = avatarLarge.querySelector('img');
            if (img) img.remove();
            if (avatarLargeInitial) avatarLargeInitial.style.display = 'flex';
        }
    }
}

// Profile button
const profileBtn = document.getElementById('profile-btn');
if (profileBtn) {
    profileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showProfileModal();
        const userDropdown = document.getElementById('user-dropdown');
        if (userDropdown) userDropdown.classList.remove('show');
    });
}

// Carregar perfil ao inicializar
updateUserDisplay();

// Tornar funções globais
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfile = saveProfile;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;

// Fechar dropdowns ao clicar fora
document.addEventListener('click', (e) => {
    if (notificationsDropdown && !notificationsDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
        notificationsDropdown.classList.remove('show');
    }
    if (supportDropdown && !supportDropdown.contains(e.target) && !supportBtn.contains(e.target)) {
        supportDropdown.classList.remove('show');
    }
});

// Atualizar badge ao carregar
updateNotificationBadge();

// ============================================
// COMPARTILHAMENTO DE QUADRO
// ============================================

function showShareModal() {
    const modal = document.getElementById('share-modal');
    if (!modal) return;
    
    // Gerar link de compartilhamento
    const shareLink = `${window.location.origin}${window.location.pathname}?board=${currentBoardId}`;
    document.getElementById('share-link').value = shareLink;
    
    // Atualizar informações do usuário atual
    const user = JSON.parse(localStorage.getItem('loggedUser'));
    if (user) {
        const initial = user.username ? user.username[0].toUpperCase() : user.email[0].toUpperCase();
        const name = user.username || user.email.split('@')[0];
        
        document.getElementById('share-current-user-initial').textContent = initial;
        document.getElementById('share-current-user-name').textContent = `Você (${name})`;
    }
    
    // Mostrar membros já compartilhados
    loadSharedMembers();
    
    modal.classList.add('show');
}

function loadSharedMembers() {
    if (!currentBoard) return;
    
    const membersList = document.getElementById('shared-members-list');
    const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
    
    // Limpar lista, mas manter o proprietário
    const currentUserElement = membersList.querySelector('.current-user');
    membersList.innerHTML = '';
    if (currentUserElement) {
        membersList.appendChild(currentUserElement);
    }
    
    // Adicionar membros compartilhados
    if (currentBoard.sharedWith && currentBoard.sharedWith.length > 0) {
        currentBoard.sharedWith.forEach(email => {
            if (email !== currentUser.email) { // Não mostrar o próprio usuário novamente
                const initial = email[0].toUpperCase();
                const memberHTML = `
                    <div class="shared-member" data-email="${email}">
                        <div class="member-avatar">
                            <span>${initial}</span>
                        </div>
                        <div class="member-info">
                            <strong>${email}</strong>
                            <span class="member-role">Pode editar</span>
                        </div>
                        <button class="btn-remove-member" onclick="removeMemberFromBoard('${email}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                membersList.insertAdjacentHTML('beforeend', memberHTML);
            }
        });
    }
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('show');
    }
}

async function addMemberToBoard() {
    const emailInput = document.getElementById('share-email');
    const email = emailInput.value.trim();
    
    console.log('🔄 Tentando compartilhar quadro...');
    console.log('📧 Email:', email);
    console.log('📋 Board atual:', currentBoard);
    console.log('🔥 Firebase auth:', firebase.auth().currentUser);
    
    if (!email) {
        showNotification('Digite um email válido', 'warning');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Email inválido', 'error');
        return;
    }
    
    if (!currentBoard) {
        showNotification('Nenhum quadro selecionado', 'error');
        return;
    }
    
    // Verificar se o board tem ID do Firestore
    if (!currentBoard.id || currentBoard.id.startsWith('board_')) {
        showNotification('⚠️ Este quadro está no localStorage. Para compartilhar, é necessário salvá-lo no Firebase primeiro.', 'warning');
        console.warn('❌ Board sem ID do Firestore:', currentBoard);
        return;
    }
    
    // USAR FIREBASE PARA COMPARTILHAR
    if (window.firebaseService && firebase.auth().currentUser) {
        try {
            showNotification('Compartilhando quadro...', 'info');
            
            console.log('📤 Chamando firebaseService.shareBoardWithUser...');
            const result = await window.firebaseService.shareBoardWithUser(currentBoard.id, email);
            console.log('📥 Resultado:', result);
            
            if (result.success) {
                // Atualizar lista local
                if (!currentBoard.sharedWith) {
                    currentBoard.sharedWith = [];
                }
                if (!currentBoard.sharedWith.includes(email)) {
                    currentBoard.sharedWith.push(email);
                }
                
                // Adicionar membro à lista visual
                const membersList = document.getElementById('shared-members-list');
                const initial = email[0].toUpperCase();
                const displayName = result.userName || email;
                
                const memberHTML = `
                    <div class="shared-member" data-email="${email}">
                        <div class="member-avatar">
                            <span>${initial}</span>
                        </div>
                        <div class="member-info">
                            <strong>${displayName}</strong>
                            <span class="member-role">Pode editar</span>
                        </div>
                        <button class="btn-remove-member" onclick="removeMemberFromBoard('${email}')">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                membersList.insertAdjacentHTML('beforeend', memberHTML);
                emailInput.value = '';
                
                showNotification(`✅ Quadro compartilhado com ${displayName}!`, 'success');
            } else {
                const errorMsg = result.error || 'Erro ao compartilhar quadro';
                console.error('❌ Erro retornado:', errorMsg);
                showNotification(errorMsg, 'error');
            }
        } catch (error) {
            console.error('❌ Erro ao compartilhar (CATCH):', error);
            showNotification('Erro: ' + error.message, 'error');
        }
    } else {
        console.warn('⚠️ Firebase não disponível');
        console.log('Firebase Service:', window.firebaseService);
        console.log('Firebase Auth:', firebase.auth().currentUser);
        showNotification('⚠️ Compartilhamento requer autenticação Firebase ativa', 'warning');
    }
}

function removeMemberFromBoard(email) {
    if (!currentBoard) return;
    
    if (confirm(`Remover acesso de ${email} a este quadro?`)) {
        // Remover da lista de compartilhamento do quadro
        if (currentBoard.sharedWith) {
            currentBoard.sharedWith = currentBoard.sharedWith.filter(e => e !== email);
        }
        
        // Remover quadro do localStorage do usuário
        const sharedBoardKey = `boards_${email}`;
        let sharedUserBoards = JSON.parse(localStorage.getItem(sharedBoardKey)) || [];
        sharedUserBoards = sharedUserBoards.filter(b => b.id !== currentBoard.id);
        localStorage.setItem(sharedBoardKey, JSON.stringify(sharedUserBoards));
        
        // Salvar alterações
        saveBoards();
        
        // Remover da lista visual
        const memberElement = document.querySelector(`.shared-member[data-email="${email}"]`);
        if (memberElement) {
            memberElement.remove();
        }
        
        showNotification(`${email} foi removido do quadro`, 'info');
    }
}

function copyShareLink() {
    const linkInput = document.getElementById('share-link');
    linkInput.select();
    document.execCommand('copy');
    
    showNotification('Link copiado para a área de transferência!', 'success');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Event listener para botão de compartilhar
const shareBoardBtn = document.getElementById('share-board-btn');
if (shareBoardBtn) {
    shareBoardBtn.addEventListener('click', showShareModal);
}

// Event listener para botão de sincronizar
const syncBoardBtn = document.getElementById('sync-board-btn');
if (syncBoardBtn) {
    syncBoardBtn.addEventListener('click', forceSyncBoard);
}

// Função para forçar sincronização manual
function forceSyncBoard() {
    const btn = document.getElementById('sync-board-btn');
    const icon = btn.querySelector('i');
    
    // Animação de rotação
    icon.classList.add('fa-spin');
    btn.disabled = true;
    
    // Verificar atualizações
    checkForBoardUpdates();
    
    // Recarregar board
    setTimeout(() => {
        renderBoard();
        icon.classList.remove('fa-spin');
        btn.disabled = false;
        showNotification('🔄 Quadro sincronizado com sucesso!', 'success');
    }, 500);
}

// Tornar funções globais
window.showShareModal = showShareModal;
window.closeShareModal = closeShareModal;
window.addMemberToBoard = addMemberToBoard;
window.removeMemberFromBoard = removeMemberFromBoard;
window.copyShareLink = copyShareLink;
window.markNotificationAsRead = markNotificationAsRead;
window.forceSyncBoard = forceSyncBoard;

// ============================================
// SINCRONIZAÇÃO AUTOMÁTICA
// ============================================
let autoSyncInterval = null;

function startAutoSync() {
    // Verificar atualizações a cada 5 segundos
    autoSyncInterval = setInterval(() => {
        if (currentBoard) {
            const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
            
            // Verificar se há atualizações
            let hasUpdates = false;
            
            // Se você é o owner, verificar membros
            if (currentBoard.owner === currentUser.email && currentBoard.sharedWith) {
                currentBoard.sharedWith.forEach(memberEmail => {
                    const memberBoardsKey = `boards_${memberEmail}`;
                    let memberBoards = JSON.parse(localStorage.getItem(memberBoardsKey)) || [];
                    const memberBoard = memberBoards.find(b => b.id === currentBoard.id);
                    
                    if (memberBoard && memberBoard.lastModified && currentBoard.lastModified) {
                        if (new Date(memberBoard.lastModified) > new Date(currentBoard.lastModified)) {
                            hasUpdates = true;
                            // Atualizar silenciosamente
                            currentBoard = memberBoard;
                            const boardIndex = boards.findIndex(b => b.id === currentBoard.id);
                            if (boardIndex > -1) {
                                boards[boardIndex] = currentBoard;
                                localStorage.setItem(getUserBoardsKey(), JSON.stringify(boards));
                            }
                            renderBoard();
                            showNotification('🔄 Quadro atualizado com alterações de ' + memberEmail.split('@')[0], 'success');
                        }
                    }
                });
            }
            
            // Se você NÃO é o owner, verificar proprietário
            if (currentBoard.owner && currentBoard.owner !== currentUser.email) {
                const ownerBoardsKey = `boards_${currentBoard.owner}`;
                let ownerBoards = JSON.parse(localStorage.getItem(ownerBoardsKey)) || [];
                const ownerBoard = ownerBoards.find(b => b.id === currentBoard.id);
                
                if (ownerBoard && ownerBoard.lastModified && currentBoard.lastModified) {
                    if (new Date(ownerBoard.lastModified) > new Date(currentBoard.lastModified)) {
                        hasUpdates = true;
                        // Atualizar silenciosamente
                        currentBoard = ownerBoard;
                        const boardIndex = boards.findIndex(b => b.id === currentBoard.id);
                        if (boardIndex > -1) {
                            boards[boardIndex] = currentBoard;
                            localStorage.setItem(getUserBoardsKey(), JSON.stringify(boards));
                        }
                        renderBoard();
                        showNotification('🔄 Quadro atualizado pelo proprietário', 'success');
                    }
                }
            }
        }
    }, 5000); // 5 segundos
}

function stopAutoSync() {
    if (autoSyncInterval) {
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
    }
}

// Iniciar sincronização automática quando o board é carregado
startAutoSync();

// Parar sincronização quando a página é fechada
window.addEventListener('beforeunload', stopAutoSync);

// ============================================
// INICIALIZAÇÃO FINAL
// ============================================
console.log('Florense Trello Clone carregado com sucesso!');
console.log('Boards disponíveis:', boards.length);
console.log('Board atual:', currentBoard ? currentBoard.name : 'Nenhum');
console.log('🔄 Sincronização automática ativada (verificação a cada 5 segundos)');
// ============================================
// MODAL DE ADICIONAR CART�O
// ============================================

let currentAddCardListId = null;

function openAddCardModal(listId) {
    currentAddCardListId = listId;
    const modal = document.getElementById('add-card-modal');
    
    // Limpar campos do modal
    document.getElementById('numero-pedido-modal').value = '';
    document.getElementById('cliente-name-modal').value = '';
    document.getElementById('telefone-cliente-modal').value = '';
    document.getElementById('engenheiro-name-modal').value = '';
    document.getElementById('arquiteto-name-modal').value = '';
    document.getElementById('solicitacao-cliente-modal').value = '';
    
    // Mostrar modal
    modal.classList.add('show');
    modal.style.display = 'flex';
    
    // Focar no primeiro campo
    setTimeout(() => {
        document.getElementById('numero-pedido-modal').focus();
    }, 100);
}

function closeAddCardModal() {
    const modal = document.getElementById('add-card-modal');
    modal.classList.remove('show');
    modal.style.display = 'none';
    currentAddCardListId = null;
}

function saveCardFromModal() {
    if (!currentAddCardListId) {
        console.error('Nenhuma lista selecionada');
        return;
    }
    
    // Pegar valores do formul�rio
    const numeroPedido = document.getElementById('numero-pedido-modal').value.trim();
    const cliente = document.getElementById('cliente-name-modal').value.trim();
    const telefone = document.getElementById('telefone-cliente-modal').value.trim();
    const engenheiro = document.getElementById('engenheiro-name-modal').value.trim();
    const arquiteto = document.getElementById('arquiteto-name-modal').value.trim();
    const solicitacao = document.getElementById('solicitacao-cliente-modal').value.trim();
    
    // Validar campos
    if (!numeroPedido || !cliente || !telefone || !engenheiro || !arquiteto || !solicitacao) {
        alert('Por favor, preencha todos os campos obrigat�rios.');
        return;
    }
    
    // Criar objeto do cart�o
    const cardData = {
        numeroPedido,
        cliente,
        telefone,
        engenheiro,
        arquiteto,
        solicitacao
    };
    
    // Adicionar cart�o � lista
    addCardWithDetails(currentAddCardListId, cardData);
    
    // Fechar modal
    closeAddCardModal();
}

// Fechar modal ao clicar fora dele
document.getElementById('add-card-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-card-modal') {
        closeAddCardModal();
    }
});

// Fechar modal com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('add-card-modal');
        if (modal && modal.classList.contains('show')) {
            closeAddCardModal();
        }
    }
});

// ============================================
// NAVEGAÇÃO
// ============================================

/**
 * Voltar para a página anterior (trello-home)
 */
// Função já definida anteriormente no arquivo, removida daqui para evitar duplicação

