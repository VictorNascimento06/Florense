// ============================================
// FLORENSE TRELLO HOME - JavaScript
// ============================================

// Variáveis globais
let boards = [];
let currentUser = null;
let isInitialized = false;

// SISTEMA HÍBRIDO: Verificar autenticação Firebase OU localStorage
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        // Usuário logado no Firebase
        currentUser = user;
        console.log('✅ Usuário Firebase autenticado:', user.email);
        
        // Inicializar a aplicação apenas uma vez
        if (!isInitialized) {
            isInitialized = true;
            await initializeUser();
            initializeEventListeners();
            loadBoards();
            loadSavedWorkspaceSettings();
        }
    } else {
        // Não está no Firebase, verificar localStorage
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || 'null');
        
        if (loggedUser) {
            console.log('✅ Usuário localStorage encontrado:', loggedUser.fullName || loggedUser.email);
            
            // Criar objeto user fake para compatibilidade
            currentUser = {
                email: loggedUser.email,
                displayName: loggedUser.fullName || loggedUser.email.split('@')[0],
                uid: 'local_' + (loggedUser.email || 'user')
            };
            
            // Inicializar aplicação
            if (!isInitialized) {
                isInitialized = true;
                await initializeUser();
                initializeEventListeners();
                loadBoards();
                loadSavedWorkspaceSettings();
            }
        } else {
            // Não está logado em nenhum sistema
            console.log('❌ Usuário não autenticado, redirecionando...');
            window.location.href = "login.html";
        }
    }
});

// ============================================
// INICIALIZAÇÃO DO USUÁRIO
// ============================================
async function initializeUser() {
    if (!currentUser) return;
    
    try {
        // Buscar dados do localStorage SEMPRE (ignorar Firestore por enquanto)
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
        
        let inicial = currentUser.email[0].toUpperCase();
        let name = loggedUser.fullName || currentUser.displayName || currentUser.email.split('@')[0];
        let email = currentUser.email;
        let profilePhoto = loggedUser.photo || null;
        
        if (name) {
            inicial = name[0].toUpperCase();
        }
        
        console.log('✅ initializeUser: Dados do localStorage -', { name, email, temFoto: !!profilePhoto });

        // Atualizar avatar do header
        const userAvatar = document.getElementById('user-avatar');
        const userInitial = document.getElementById('user-initial');
        
        if (userAvatar && userInitial) {
            if (profilePhoto) {
                // Se tem foto, criar elemento img
                userInitial.style.display = 'none';
                let img = userAvatar.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    userAvatar.appendChild(img);
                }
                img.src = profilePhoto;
                console.log('📸 Foto de perfil aplicada no header');
            } else {
                // Se não tem foto, mostrar inicial
                userInitial.style.display = 'flex';
                userInitial.textContent = inicial;
                const img = userAvatar.querySelector('img');
                if (img) img.remove();
            }
        }
        
        // Atualizar avatar grande do dropdown
        const avatarLarge = document.querySelector('.avatar-large');
        const avatarLargeInitial = document.getElementById('avatar-large-initial');
        
        if (avatarLarge && avatarLargeInitial) {
            if (profilePhoto) {
                avatarLargeInitial.style.display = 'none';
                let img = avatarLarge.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    img.style.width = '100%';
                    img.style.height = '100%';
                    img.style.objectFit = 'cover';
                    img.style.borderRadius = '50%';
                    avatarLarge.appendChild(img);
                }
                img.src = profilePhoto;
            } else {
                avatarLargeInitial.style.display = 'flex';
                avatarLargeInitial.textContent = inicial;
                const img = avatarLarge.querySelector('img');
                if (img) img.remove();
            }
        }
        
        // Atualizar informações
        document.getElementById('user-name').textContent = name;
        document.getElementById('user-email').textContent = email;
        
        console.log('✅ Usuário inicializado:', name, profilePhoto ? '(com foto)' : '(sem foto)');
    } catch (error) {
        console.error('Erro ao inicializar usuário:', error);
    }
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    // User dropdown
    const userAvatar = document.getElementById('user-avatar');
    const userDropdown = document.getElementById('user-dropdown');
    const logoutBtn = document.getElementById('logout-btn');

    if (userAvatar) {
        userAvatar.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }

    // Create button
    const createBtn = document.getElementById('create-btn');
    if (createBtn) {
        createBtn.addEventListener('click', showCreateBoardModal);
    }

    // Notifications dropdown
    const notificationBtn = document.getElementById('notification-btn');
    const notificationsDropdown = document.getElementById('notifications-dropdown');

    if (notificationBtn && notificationsDropdown) {
        notificationBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('show');
            // Fechar outros dropdowns
            if (supportDropdown) supportDropdown.classList.remove('show');
            if (userDropdown) userDropdown.classList.remove('show');
            
            // Carregar notificações
            loadNotifications();
        });
    }

    // Mark all as read
    const markAllReadBtn = document.getElementById('mark-all-read');
    if (markAllReadBtn) {
        markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
    }

    // Clear all notifications
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
            // Fechar outros dropdowns
            if (notificationsDropdown) notificationsDropdown.classList.remove('show');
            if (userDropdown) userDropdown.classList.remove('show');
        });
    }

    // Profile button
    const profileBtn = document.getElementById('profile-btn');
    if (profileBtn) {
        profileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showProfileModal();
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Theme toggle button
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleTheme();
            if (userDropdown) {
                userDropdown.classList.remove('show');
            }
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !userAvatar.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
        if (supportDropdown && !supportDropdown.contains(e.target) && !supportBtn.contains(e.target)) {
            supportDropdown.classList.remove('show');
        }
        if (notificationsDropdown && !notificationsDropdown.contains(e.target) && !notificationBtn.contains(e.target)) {
            notificationsDropdown.classList.remove('show');
        }
    });

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
        
        // Change search icon color when focused
        searchInput.addEventListener('focus', () => {
            document.querySelector('.search-icon').style.color = '#6b778c';
        });
        
        searchInput.addEventListener('blur', () => {
            if (!searchInput.value) {
                document.querySelector('.search-icon').style.color = 'rgba(255, 255, 255, 0.7)';
            }
        });
    }

    // Navigation dropdowns
    initializeNavigationDropdowns();

    // Sidebar navigation
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Background selection in modal
    setupBackgroundSelection();
    
    // Initialize board preview
    initializeBoardPreview();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
    
    // Initialize tooltips
    initializeTooltips();
}

// ============================================
// NAVIGATION DROPDOWNS
// ============================================
function initializeNavigationDropdowns() {
    // Workspaces dropdown
    const workspacesDropdown = document.getElementById('workspaces-dropdown');
    const recentDropdown = document.getElementById('recent-dropdown');
    const starredDropdown = document.getElementById('starred-dropdown');
    const templatesDropdown = document.getElementById('templates-dropdown');

    // Add click listeners for dropdowns
    if (workspacesDropdown) {
        workspacesDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('workspaces', workspacesDropdown);
        });
    }

    if (recentDropdown) {
        recentDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('recent', recentDropdown);
        });
    }

    if (starredDropdown) {
        starredDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('starred', starredDropdown);
        });
    }

    if (templatesDropdown) {
        templatesDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleDropdown('templates', templatesDropdown);
        });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', closeAllDropdowns);
}

function toggleDropdown(type, element) {
    // Close all other dropdowns first
    closeAllDropdowns();

    // Create dropdown content
    const dropdownContent = createDropdownContent(type);
    
    // Remove existing dropdown if any
    const existingDropdown = element.querySelector('.dropdown-menu');
    if (existingDropdown) {
        existingDropdown.remove();
        return;
    }

    // Add dropdown menu
    element.appendChild(dropdownContent);
    element.classList.add('active');

    // Add event listeners for dropdown items
    addDropdownEventListeners(dropdownContent, type);

    // Animate dropdown
    requestAnimationFrame(() => {
        dropdownContent.style.opacity = '1';
        dropdownContent.style.transform = 'translateY(0)';
    });
}

function addDropdownEventListeners(dropdown, type) {
    if (type === 'workspaces') {
        const createWorkspaceBtn = dropdown.querySelector('.create-workspace');
        if (createWorkspaceBtn) {
            createWorkspaceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeAllDropdowns();
                showCreateWorkspaceModal();
            });
        }
    }
}

function createDropdownContent(type) {
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    dropdown.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        background: white;
        box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        border-radius: 8px;
        padding: 8px;
        min-width: 250px;
        z-index: 1000;
        opacity: 0;
        transform: translateY(-10px);
        transition: all 0.2s ease;
    `;

    let content = '';

    switch(type) {
        case 'workspaces':
            // Carregar workspaces salvos
            const savedWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
            
            // Workspace padrão sempre presente
            const defaultWorkspace = {
                id: 'default',
                name: 'Florense',
                type: 'Gratuito',
                avatar: 'F'
            };
            
            const allWorkspaces = [defaultWorkspace, ...savedWorkspaces];
            
            content = `
                <div class="dropdown-header">
                    <h4>Seus espaços de trabalho</h4>
                </div>
                ${allWorkspaces.map(workspace => `
                    <div class="dropdown-item">
                        <div class="workspace-item">
                            <div class="workspace-avatar">${workspace.avatar || workspace.name.charAt(0).toUpperCase()}</div>
                            <div class="workspace-info">
                                <div class="workspace-name">${workspace.name}</div>
                                <div class="workspace-type">${workspace.type || 'Privado'}</div>
                            </div>
                        </div>
                    </div>
                `).join('')}
                <hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;">
                <div class="dropdown-item create-workspace">
                    <i class="fas fa-plus"></i>
                    <span>Criar espaço de trabalho</span>
                </div>
            `;
            break;

        case 'recent':
            const recentBoards = boards
                .sort((a, b) => new Date(b.lastViewed || 0) - new Date(a.lastViewed || 0))
                .slice(0, 5);
            
            content = `
                <div class="dropdown-header">
                    <h4>Visualizados recentemente</h4>
                </div>
                ${recentBoards.map(board => `
                    <div class="dropdown-item board-item" onclick="openBoard('${board.id}')">
                        <div class="board-preview" style="background: ${getBoardBackground(board.background)}"></div>
                        <span>${board.name}</span>
                        ${board.starred ? '<i class="fas fa-star starred-icon"></i>' : ''}
                    </div>
                `).join('')}
            `;
            break;

        case 'starred':
            const starredBoards = boards.filter(board => board.starred);
            
            content = `
                <div class="dropdown-header">
                    <h4>Boards com estrela</h4>
                </div>
                ${starredBoards.length > 0 ? 
                    starredBoards.map(board => `
                        <div class="dropdown-item board-item" onclick="openBoard('${board.id}')">
                            <div class="board-preview" style="background: ${getBoardBackground(board.background)}"></div>
                            <span>${board.name}</span>
                            <i class="fas fa-star starred-icon"></i>
                        </div>
                    `).join('') :
                    '<div class="dropdown-item disabled">Nenhum board destacado</div>'
                }
            `;
            break;

        case 'templates':
            content = `
                <div class="dropdown-header">
                    <h4>Modelos populares</h4>
                </div>
                <div class="dropdown-item template-item">
                    <i class="fas fa-clipboard-list"></i>
                    <div>
                        <div class="template-name">Kanban Template</div>
                        <div class="template-desc">Organize tarefas em colunas</div>
                    </div>
                </div>
                <div class="dropdown-item template-item">
                    <i class="fas fa-calendar-alt"></i>
                    <div>
                        <div class="template-name">Sprint Planning</div>
                        <div class="template-desc">Planeje seus sprints</div>
                    </div>
                </div>
                <div class="dropdown-item template-item">
                    <i class="fas fa-rocket"></i>
                    <div>
                        <div class="template-name">Project Launch</div>
                        <div class="template-desc">Lance projetos com sucesso</div>
                    </div>
                </div>
            `;
            break;
    }

    dropdown.innerHTML = content;
    return dropdown;
}

function closeAllDropdowns() {
    const activeDropdowns = document.querySelectorAll('.dropdown.active, .nav-item.active');
    activeDropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (menu.parentNode) {
                    menu.remove();
                }
            }, 200);
        }
    });
}

function getBoardBackground(background) {
    const backgrounds = {
        'florense': 'url(https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80) center/cover',
        'gradient1': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient2': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'gradient3': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'image1': 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'image2': 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'default': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    };
    
    return backgrounds[background] || backgrounds['default'];
}

// ============================================
// BOARDS MANAGEMENT
// ============================================
async function loadBoards() {
    // TENTAR CARREGAR DO FIREBASE PRIMEIRO
    if (window.firebaseService && firebase.auth().currentUser) {
        try {
            console.log('🔄 Carregando boards do Firebase...');
            const result = await window.firebaseService.getUserBoards();
            
            if (result.success && result.boards.length > 0) {
                boards = result.boards;
                console.log(`✅ ${boards.length} board(s) carregado(s) do Firebase`);
                
                renderRecentBoards();
                renderWorkspaceBoards();
                renderSharedBoards();
                return;
            } else {
                // Firebase está vazio, verificar se há boards no localStorage para migrar
                console.log('📂 Firebase vazio, verificando localStorage...');
                const localBoards = getBoards();
                
                if (localBoards.length > 0) {
                    console.log(`🔄 Encontrados ${localBoards.length} board(s) no localStorage. Migrando para Firebase...`);
                    
                    const migrationResult = await window.firebaseService.migrateLocalBoardsToFirebase(localBoards);
                    
                    if (migrationResult.success) {
                        showNotification(`✅ ${localBoards.length} quadro(s) migrado(s) para o Firebase!`, 'success');
                        
                        // Recarregar do Firebase
                        const reloadResult = await window.firebaseService.getUserBoards();
                        if (reloadResult.success) {
                            boards = reloadResult.boards;
                            
                            // Limpar localStorage antigo
                            localStorage.removeItem(getUserBoardsKey());
                            console.log('🗑️ localStorage limpo após migração');
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('⚠️ Erro ao carregar do Firebase:', error);
        }
    }
    
    // FALLBACK PARA LOCALSTORAGE
    console.log('📂 Carregando boards do localStorage...');
    boards = getBoards();
    
    // Se não houver boards, criar alguns de exemplo
    if (boards.length === 0) {
        createSampleBoards();
    }
    
    renderRecentBoards();
    renderWorkspaceBoards();
    renderSharedBoards(); // Nova função para renderizar quadros compartilhados
}

async function createSampleBoards() {
    // CRIAR APENAS O QUADRO PADRÃO "PROJETO FLORENSE"
    const sampleBoards = [
        {
            id: generateId(),
            name: 'Projeto Florense',
            background: 'florense',
            starred: false,
            lastViewed: new Date().toISOString(),
            lists: createDefaultLists() // Criar listas padrão do Florense
        }
    ];

    boards = sampleBoards;
    await saveBoards(); // 🔥 Salvar no Firestore
    
    // Mostrar notificação sobre o board criado
    showNotification('✨ Quadro "Projeto Florense" criado com sucesso!', 'success', 3000);
}

// Função para sugerir background aleatório ao criar novos boards
function getRandomBackground() {
    const backgroundOptions = [
        'nature1', 'nature2', 'nature3', 'nature4', 'nature5', 'nature6',
        'mountain1', 'mountain2', 'ocean1', 'ocean2', 'forest1', 
        'sunset1', 'tropical1', 'tropical2', 'beach1', 'beach2',
        'jungle1', 'waterfall1', 'sky1', 'clouds1', 'sunrise1',
        'storm1', 'aurora1', 'stars1'
    ];
    
    return backgroundOptions[Math.floor(Math.random() * backgroundOptions.length)];
}

function renderRecentBoards() {
    const recentGrid = document.querySelector('.recent-section .boards-grid');
    if (!recentGrid) return;

    // Ordenar por última visualização
    const recentBoards = [...boards]
        .sort((a, b) => new Date(b.lastViewed || 0) - new Date(a.lastViewed || 0))
        .slice(0, 4);

    recentGrid.innerHTML = '';

    recentBoards.forEach(board => {
        const boardCard = createBoardCard(board);
        recentGrid.appendChild(boardCard);
    });
}

function renderWorkspaceBoards() {
    const workspaceGrid = document.querySelector('.workspace-section .boards-grid');
    if (!workspaceGrid) return;

    workspaceGrid.innerHTML = '';
    
    const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
    
    // Filtrar apenas quadros próprios (não compartilhados)
    const ownBoards = boards.filter(board => {
        // Se não tem owner, é um quadro antigo (consideramos como próprio)
        if (!board.owner) return true;
        // Se o owner é o usuário atual, é próprio
        if (board.owner === currentUser.email) return true;
        // Se chegou aqui, é compartilhado
        return false;
    });

    ownBoards.forEach(board => {
        const boardCard = createBoardCard(board);
        workspaceGrid.appendChild(boardCard);
    });

    // Adicionar card de criar board
    const createCard = document.createElement('div');
    createCard.className = 'create-board-card';
    createCard.onclick = showCreateBoardModal;
    createCard.innerHTML = `
        <div class="create-board-content">
            <span class="create-board-text">Criar novo quadro</span>
            <div class="create-board-subtitle">${ownBoards.length} quadro(s)</div>
        </div>
    `;
    
    workspaceGrid.appendChild(createCard);
}

function renderSharedBoards() {
    const currentUser = JSON.parse(localStorage.getItem('loggedUser'));
    if (!currentUser) return;
    
    // Filtrar quadros compartilhados (onde isOwner === false)
    const sharedBoards = boards.filter(board => {
        // No Firebase, verificamos isOwner
        if (board.isOwner !== undefined) {
            return board.isOwner === false;
        }
        // Fallback para localStorage (verificar owner)
        return board.owner && board.owner !== currentUser.email;
    });
    
    if (sharedBoards.length === 0) {
        // Se não há quadros compartilhados, esconder a seção
        const sharedSection = document.querySelector('.shared-workspace-section');
        if (sharedSection) {
            sharedSection.style.display = 'none';
        }
        return;
    }
    
    // Agrupar quadros por proprietário
    const boardsByOwner = {};
    sharedBoards.forEach(board => {
        const ownerEmail = board.owner || board.ownerEmail || 'Desconhecido';
        if (!boardsByOwner[ownerEmail]) {
            boardsByOwner[ownerEmail] = [];
        }
        boardsByOwner[ownerEmail].push(board);
    });
    
    // Verificar se a seção existe, se não, criar
    let sharedSection = document.querySelector('.shared-workspace-section');
    if (!sharedSection) {
        const mainWorkspace = document.querySelector('.workspace-section');
        sharedSection = document.createElement('div');
        sharedSection.className = 'workspace-section shared-workspace-section';
        mainWorkspace.parentNode.insertBefore(sharedSection, mainWorkspace.nextSibling);
    }
    
    sharedSection.style.display = 'block';
    sharedSection.innerHTML = '';
    
    // Criar conteúdo para cada proprietário
    Object.keys(boardsByOwner).forEach(ownerEmail => {
        const ownerBoards = boardsByOwner[ownerEmail];
        const ownerName = ownerEmail.split('@')[0];
        const userName = currentUser.username || currentUser.email.split('@')[0];
        
        const workspaceHeader = document.createElement('div');
        workspaceHeader.className = 'workspace-header';
        workspaceHeader.innerHTML = `
            <div class="workspace-info-section">
                <div class="workspace-avatar-large shared-workspace-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div>
                    <h2 class="workspace-name">Quadros Compartilhados: ${ownerName} & ${userName}</h2>
                    <p style="color: #6b778c; font-size: 14px; margin: 4px 0 0 0;">
                        <i class="fas fa-share-alt"></i> ${ownerBoards.length} quadro(s) compartilhado(s)
                    </p>
                </div>
            </div>
        `;
        
        const boardsGrid = document.createElement('div');
        boardsGrid.className = 'boards-grid';
        
        ownerBoards.forEach(board => {
            const boardCard = createBoardCard(board, true); // true indica que é compartilhado
            boardsGrid.appendChild(boardCard);
        });
        
        sharedSection.appendChild(workspaceHeader);
        sharedSection.appendChild(boardsGrid);
    });
}

function createBoardCard(board, isShared = false) {
    const card = document.createElement('div');
    card.className = 'board-card';
    
    // Adicionar classe especial se for compartilhado
    if (isShared) {
        card.classList.add('shared-board');
    }
    
    // Definir background - Sincronizado com dashboard-new.js
    const backgroundImages = {
        // Background Personalizado Florense
        florense: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Nature backgrounds
        nature1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        nature2: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        nature3: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        nature4: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        nature5: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        nature6: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Mountain backgrounds  
        mountain1: 'https://images.unsplash.com/photo-1464822759844-d150378684e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        mountain2: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Ocean backgrounds
        ocean1: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        ocean2: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Forest backgrounds
        forest1: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Sunset backgrounds
        sunset1: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Tropical backgrounds
        tropical1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        tropical2: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Beach backgrounds
        beach1: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        beach2: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Jungle backgrounds
        jungle1: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Waterfall backgrounds
        waterfall1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Sky backgrounds
        sky1: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Clouds backgrounds
        clouds1: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Sunrise backgrounds
        sunrise1: 'https://images.unsplash.com/photo-1484589065579-248aad0d8b13?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Storm backgrounds
        storm1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Aurora backgrounds
        aurora1: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
        // Stars backgrounds
        stars1: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
    };

    const gradients = {
        gradient1: 'linear-gradient(135deg, #667eea, #764ba2)',
        gradient2: 'linear-gradient(135deg, #f093fb, #f5576c)', 
        gradient3: 'linear-gradient(135deg, #4facfe, #00f2fe)',
        gradient4: 'linear-gradient(135deg, #43e97b, #38f9d7)',
        gradient5: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
        gradient6: 'linear-gradient(135deg, #a8edea, #fed6e3)'
    };

    if (backgroundImages[board.background]) {
        // É uma imagem de fundo
        card.style.backgroundImage = `url('${backgroundImages[board.background]}')`;
        card.style.backgroundSize = 'cover';
        card.style.backgroundPosition = 'center';
    } else if (gradients[board.background]) {
        // É um gradiente
        card.style.background = gradients[board.background];
    } else {
        // Fallback para gradiente padrão
        card.style.background = gradients.gradient1;
    }

    card.innerHTML = `
        <button class="delete-board-btn" onclick="deleteBoard('${board.id}', event)" title="Excluir quadro">
            <i class="fas fa-times"></i>
        </button>
        <button class="star-board-btn ${board.starred ? 'starred' : ''}" onclick="toggleStarBoard('${board.id}', event)" title="${board.starred ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
            <i class="fas fa-star"></i>
        </button>
        ${isShared ? '<div class="shared-badge"><i class="fas fa-users"></i> Compartilhado</div>' : ''}
        <div class="board-overlay">
            <span class="board-name">${board.name}</span>
            <span class="board-info">
                <i class="fas fa-clock"></i>
                ${formatLastViewed(board.lastViewed)}
            </span>
        </div>
    `;

    // Adicionar funcionalidades interativas
    card.addEventListener('click', () => openBoard(board.id));
    
    // Drag and drop functionality
    card.draggable = true;
    card.setAttribute('data-board-id', board.id);
    
    card.addEventListener('dragstart', handleDragStart);
    card.addEventListener('dragover', handleDragOver);
    card.addEventListener('drop', handleDrop);
    card.addEventListener('dragend', handleDragEnd);
    
    // Hover effects
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px) scale(1.02)';
        card.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    });

    return card;
}

// ============================================
// BOARD INTERACTIVE FUNCTIONS
// ============================================
function toggleStarBoard(boardId, event) {
    event.stopPropagation();
    
    const board = boards.find(b => b.id === boardId);
    if (board) {
        board.starred = !board.starred;
        saveBoards();
        
        // Atualizar visualizações
        renderRecentBoards();
        renderWorkspaceBoards();
        renderSharedBoards();
        
        // Mostrar notificação
        const message = board.starred ? 
            `Board "${board.name}" adicionado aos favoritos!` : 
            `Board "${board.name}" removido dos favoritos!`;
        showNotification(message, board.starred ? 'success' : 'info');
    }
}

function formatLastViewed(lastViewed) {
    if (!lastViewed) return 'Nunca visualizado';
    
    const now = new Date();
    const viewed = new Date(lastViewed);
    const diffMs = now - viewed;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) return `${diffDays}d atrás`;
    if (diffHours > 0) return `${diffHours}h atrás`;
    if (diffMinutes > 0) return `${diffMinutes}m atrás`;
    return 'Agora mesmo';
}

// Drag and Drop functionality
let draggedElement = null;

function handleDragStart(e) {
    draggedElement = this;
    this.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.outerHTML);
    
    // Adicionar classe visual durante drag
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    
    // Adicionar indicador visual
    this.classList.add('drag-over');
    
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        // Trocar posições dos boards
        const draggedId = draggedElement.getAttribute('data-board-id');
        const targetId = this.getAttribute('data-board-id');
        
        swapBoardPositions(draggedId, targetId);
        
        // Recarregar grids
        renderRecentBoards();
        renderWorkspaceBoards();
        
        showNotification('Boards reordenados!', 'success', 2000);
    }
    
    this.classList.remove('drag-over');
    
    return false;
}

function handleDragEnd(e) {
    this.style.opacity = '1';
    this.classList.remove('dragging');
    
    // Remover indicadores visuais de todos os cards
    document.querySelectorAll('.board-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    draggedElement = null;
}

function swapBoardPositions(id1, id2) {
    const index1 = boards.findIndex(b => b.id === id1);
    const index2 = boards.findIndex(b => b.id === id2);
    
    if (index1 !== -1 && index2 !== -1) {
        // Trocar posições no array
        [boards[index1], boards[index2]] = [boards[index2], boards[index1]];
        saveBoards();
    }
}

// ============================================
// BOARD OPERATIONS
// ============================================
function openBoard(boardId) {
    console.log('Tentando abrir board:', boardId);
    
    // Procurar primeiro no array global (workspace principal)
    let board = boards.find(b => b.id === boardId);
    let isUserWorkspaceBoard = false;
    let userWorkspaces = [];
    
    // Se não encontrou, procurar nos workspaces criados
    if (!board) {
        userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
        
        for (const workspace of userWorkspaces) {
            if (workspace.boards) {
                board = workspace.boards.find(b => b.id === boardId);
                if (board) {
                    isUserWorkspaceBoard = true;
                    console.log('Board encontrado no workspace:', workspace.name);
                    break;
                }
            }
        }
    }
    
    if (board) {
        // Atualizar última visualização
        board.lastViewed = new Date().toISOString();
        
        if (isUserWorkspaceBoard) {
            // Salvar de volta nos dados do workspace
            localStorage.setItem('user-workspaces', JSON.stringify(userWorkspaces));
        } else {
            // Salvar no array global
            saveBoards();
        }
        
        // Salvar board atual e redirecionar
        localStorage.setItem(getCurrentBoardIdKey(), boardId);
        console.log('Abrindo board:', board.name);
        window.location.href = 'dashboard.html';
    } else {
        console.error('Board não encontrado:', boardId);
        showNotification('Board não encontrado!', 'error');
    }
}

function deleteBoard(boardId, event) {
    // Prevenir que o clique no botão de exclusão abra o quadro
    event.stopPropagation();
    
    // Procurar primeiro no array global (workspace principal)
    let board = boards.find(b => b.id === boardId);
    let boardIndex = boards.findIndex(b => b.id === boardId);
    let isUserWorkspaceBoard = false;
    let workspaceData = null;
    
    // Se não encontrou no workspace principal, procurar nos workspaces criados
    if (boardIndex === -1) {
        const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
        
        for (let workspace of userWorkspaces) {
            if (workspace.boards) {
                const workspaceBoardIndex = workspace.boards.findIndex(b => b.id === boardId);
                if (workspaceBoardIndex > -1) {
                    board = workspace.boards[workspaceBoardIndex];
                    boardIndex = workspaceBoardIndex;
                    isUserWorkspaceBoard = true;
                    workspaceData = workspace;
                    console.log('Board encontrado no workspace:', workspace.name);
                    break;
                }
            }
        }
    }
    
    // Se não encontrou o board em nenhum lugar
    if (!board || boardIndex === -1) {
        console.error('Board não encontrado:', boardId);
        showNotification('Erro: Quadro não encontrado!', 'error');
        return;
    }
    
    // Excluir o board
    if (isUserWorkspaceBoard && workspaceData) {
        // Excluir do workspace do usuário
        workspaceData.boards.splice(boardIndex, 1);
        
        // Salvar de volta no localStorage
        const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
        const workspaceIndex = userWorkspaces.findIndex(ws => ws.id === workspaceData.id);
        if (workspaceIndex > -1) {
            userWorkspaces[workspaceIndex] = workspaceData;
            localStorage.setItem('user-workspaces', JSON.stringify(userWorkspaces));
        }
        
        // Atualizar a interface do workspace específico
        updateWorkspaceBoards(workspaceData.id, workspaceData.name);
        
        console.log(`Board "${board.name}" excluído do workspace "${workspaceData.name}"`);
    } else {
        // Excluir do workspace principal
        boards.splice(boardIndex, 1);
        saveBoards();
        
        // Re-renderizar listas de boards
        renderRecentBoards();
        renderWorkspaceBoards();
        renderSharedBoards();
    }
    
    // Se era o board atual, limpar referência
    const currentBoardId = localStorage.getItem(getCurrentBoardIdKey());
    if (currentBoardId === boardId) {
        localStorage.removeItem(getCurrentBoardIdKey());
    }
    
    // Mostrar notificação de sucesso
    showNotification(`Quadro "${board.name}" excluído com sucesso!`, 'success');
    
    // Adicionar notificação no sistema
    addNotification(
        'Quadro Excluído',
        `O quadro "${board.name}" foi excluído com sucesso.`,
        'warning'
    );
}

function showCreateBoardModal(workspaceElement) {
    const modal = document.getElementById('create-board-modal');
    modal.classList.add('show');

    // Identificar qual workspace está criando o board
    let workspaceName = 'Florense Workspace';
    let workspaceId = null;
    let isUserWorkspace = false;
    
    if (workspaceElement) {
        const section = workspaceElement.closest('.workspace-section');
        if (section) {
            const nameElement = section.querySelector('.workspace-name');
            if (nameElement) {
                workspaceName = nameElement.textContent;
            }
            
            workspaceId = section.getAttribute('data-workspace-id');
            const dataName = section.getAttribute('data-workspace-name');
            
            if (workspaceId || dataName) {
                isUserWorkspace = true;
                workspaceName = dataName || workspaceName;
            }
        }
    }
    
    // Guardar informações do workspace no modal
    modal.setAttribute('data-target-workspace', workspaceName);
    modal.setAttribute('data-target-workspace-id', workspaceId || '');
    modal.setAttribute('data-is-user-workspace', isUserWorkspace.toString());
    
    console.log('Abrindo modal para criar board no workspace:', {
        name: workspaceName,
        id: workspaceId,
        isUserWorkspace: isUserWorkspace
    });

    // Reset form
    const form = document.querySelector('.create-board-form');
    form.reset();

    // Setup background selection
    setupBackgroundSelection();

    // Selecionar primeiro background
    const firstBg = document.querySelector('.bg-option[data-bg="gradient1"]');
    document.querySelectorAll('.bg-option').forEach(bg => bg.classList.remove('selected'));
    firstBg.classList.add('selected');

    // Focus no input
    document.getElementById('board-title-input').focus();
}

function closeCreateBoardModal() {
    const modal = document.getElementById('create-board-modal');
    modal.classList.remove('show');
}

function createNewBoard(event) {
    event.preventDefault();
    
    const titleInput = document.getElementById('board-title-input');
    const selectedBg = document.querySelector('.bg-option.selected');
    const modal = document.getElementById('create-board-modal');
    
    const title = titleInput.value.trim();
    
    if (!title) {
        showNotification('Por favor, digite um nome para o board', 'warning');
        return;
    }
    
    // Pegar informações do workspace alvo
    const targetWorkspaceName = modal.getAttribute('data-target-workspace') || 'Florense Workspace';
    const targetWorkspaceId = modal.getAttribute('data-target-workspace-id');
    const isUserWorkspace = modal.getAttribute('data-is-user-workspace') === 'true';
    
    console.log('Criando board para workspace:', {
        name: targetWorkspaceName,
        id: targetWorkspaceId,
        isUserWorkspace: isUserWorkspace
    });

    // Se nenhum background foi selecionado, usar um aleatório inspirador
    let background;
    if (selectedBg) {
        background = selectedBg.getAttribute('data-bg');
    } else {
        background = getRandomBackground();
        showNotification('✨ Background inspirador selecionado automaticamente!', 'info', 2500);
    }

    const newBoard = {
        id: generateId(),
        name: title,
        background: background,
        starred: false,
        lastViewed: new Date().toISOString(),
        lists: createDefaultLists(), // Criar listas padrão do Florense
        workspaceId: targetWorkspaceId || null,
        workspaceName: targetWorkspaceName
    };

    if (isUserWorkspace) {
        // Se for workspace criado pelo usuário, salvar nos dados do workspace
        const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
        const workspace = userWorkspaces.find(ws => ws.id === targetWorkspaceId || ws.name === targetWorkspaceName);
        
        if (workspace) {
            if (!workspace.boards) {
                workspace.boards = [];
            }
            workspace.boards.push(newBoard);
            localStorage.setItem('user-workspaces', JSON.stringify(userWorkspaces));
            
            console.log('Board adicionado ao workspace do usuário:', workspace.name);
            
            // Atualizar a interface do workspace específico
            updateWorkspaceBoards(targetWorkspaceId, targetWorkspaceName);
        }
    } else {
        // Se for workspace principal
        boards.push(newBoard);
        saveBoards(); // VOLTAR PARA LOCALSTORAGE
        
        // Atualizar visualizações do workspace principal
        renderRecentBoards();
        renderWorkspaceBoards();
        renderSharedBoards();
    }
    
    closeCreateBoardModal();
    
    // Mostrar notificação de sucesso
    showNotification(`🎉 Board "${newBoard.name}" criado no workspace "${targetWorkspaceName}"!`, 'success');
    
    // Adicionar notificação no sistema
    addNotification(
        'Novo Quadro Criado',
        `O quadro "${newBoard.name}" foi criado com sucesso no workspace "${targetWorkspaceName}".`,
        'success'
    );
    
    // Abrir o board recém-criado
    setTimeout(() => {
        openBoard(newBoard.id);
    }, 300);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================
function handleSearch(e) {
    const query = e.target.value.toLowerCase();
    
    if (!query) {
        renderRecentBoards();
        renderWorkspaceBoards();
        return;
    }

    // Filtrar boards por nome
    const filteredBoards = boards.filter(board => 
        board.name.toLowerCase().includes(query)
    );

    // Atualizar grids com resultados filtrados
    updateBoardGrids(filteredBoards);
}

function updateBoardGrids(filteredBoards) {
    const recentGrid = document.querySelector('.recent-section .boards-grid');
    const workspaceGrid = document.querySelector('.workspace-section .boards-grid');

    // Atualizar recent boards
    if (recentGrid) {
        recentGrid.innerHTML = '';
        filteredBoards.slice(0, 4).forEach(board => {
            const boardCard = createBoardCard(board);
            recentGrid.appendChild(boardCard);
        });
    }

    // Atualizar workspace boards
    if (workspaceGrid) {
        workspaceGrid.innerHTML = '';
        filteredBoards.forEach(board => {
            const boardCard = createBoardCard(board);
            workspaceGrid.appendChild(boardCard);
        });

        // Adicionar card de criar board se não estiver pesquisando
        const createCard = document.createElement('div');
        createCard.className = 'create-board-card';
        createCard.onclick = showCreateBoardModal;
        createCard.innerHTML = `
            <div class="create-board-content">
                <span class="create-board-text">Criar novo quadro</span>
                <div class="create-board-subtitle">${boards.length} quadro(s)</div>
            </div>
        `;
        
        workspaceGrid.appendChild(createCard);
    }
}

// ============================================
// BACKGROUND SELECTION
// ============================================
function setupBackgroundSelection() {
    const bgOptions = document.querySelectorAll('.bg-option');
    
    bgOptions.forEach(option => {
        option.addEventListener('click', () => {
            bgOptions.forEach(bg => bg.classList.remove('selected'));
            option.classList.add('selected');
        });
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
    return user ? `currentBoardId_${user.email}` : 'currentBoardId_default';
}

function getBoards() {
    // VOLTAR PARA LOCALSTORAGE TEMPORARIAMENTE
    return JSON.parse(localStorage.getItem(getUserBoardsKey())) || [];
}

function saveBoards() {
    // VOLTAR PARA LOCALSTORAGE TEMPORARIAMENTE
    localStorage.setItem(getUserBoardsKey(), JSON.stringify(boards));
}

function showNotification(message, type = 'info', duration = 3000) {
    // Remove notificações anteriores se existirem
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach((notif, index) => {
        notif.style.top = (20 + (index + 1) * 70) + 'px';
    });
    
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Definir cor baseada no tipo
    const colors = {
        success: '#4caf50',
        error: '#f44336',
        warning: '#ff9800',
        info: '#0079bf'
    };
    
    // Definir ícone baseado no tipo
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${icons[type] || icons.info}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.closest('.notification').remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type] || colors.info};
        color: white;
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.2);
        z-index: 2000;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        font-family: 'Poppins', sans-serif;
        min-width: 300px;
        max-width: 400px;
        overflow: hidden;
        animation: slideInRight 0.3s ease forwards;
    `;
    
    // Adicionar estilos CSS para animação e conteúdo
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                padding: 16px;
                gap: 12px;
            }
            
            .notification-icon {
                font-weight: bold;
                font-size: 16px;
                flex-shrink: 0;
            }
            
            .notification-message {
                flex: 1;
                font-size: 14px;
                line-height: 1.4;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: background 0.2s ease;
                flex-shrink: 0;
            }
            
            .notification-close:hover {
                background: rgba(255, 255, 255, 0.2);
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.style.opacity = '1';
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remover após duração especificada
    setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.animation = 'slideOutRight 0.3s ease forwards';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
                
                // Reajustar posições das outras notificações
                const remainingNotifications = document.querySelectorAll('.notification');
                remainingNotifications.forEach((notif, index) => {
                    notif.style.top = (20 + index * 70) + 'px';
                });
            }, 300);
        }
    }, duration);
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

// ============================================
// MODAL CONTROLS
// ============================================
document.addEventListener('click', (e) => {
    // Fechar modal ao clicar no backdrop
    if (e.target.classList.contains('modal-backdrop')) {
        closeCreateBoardModal();
    }
});

document.addEventListener('keydown', (e) => {
    // Fechar modal com ESC
    if (e.key === 'Escape') {
        closeCreateBoardModal();
    }
});

// ============================================
// NAVIGATION FUNCTIONS
// ============================================
function goBack() {
    // Atualiza a página atual ao invés de redirecionar
    window.location.reload();
}

// ============================================
// BACKGROUND SELECTION FUNCTIONS
// ============================================
function setupBackgroundSelection() {
    const bgOptions = document.querySelectorAll('.bg-option');
    
    // Remove event listeners anteriores
    bgOptions.forEach(option => {
        option.replaceWith(option.cloneNode(true));
    });
    
    // Adicionar novos event listeners
    const newBgOptions = document.querySelectorAll('.bg-option');
    newBgOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remover seleção anterior
            newBgOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Adicionar seleção na opção clicada
            this.classList.add('selected');
        });
    });

    // Garantir que a primeira opção esteja selecionada
    if (newBgOptions.length > 0) {
        newBgOptions[0].classList.add('selected');
    }
}

// ============================================
// WORKSPACE NAVIGATION FUNCTIONS
// ============================================
function showBoards() {
    // Rola para a seção de quadros
    const boardsSection = document.querySelector('.boards-grid');
    if (boardsSection) {
        boardsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Adiciona um efeito visual para destacar os quadros
        boardsSection.style.border = '2px solid #0079bf';
        boardsSection.style.borderRadius = '8px';
        boardsSection.style.padding = '16px';
        
        setTimeout(() => {
            boardsSection.style.border = 'none';
            boardsSection.style.padding = '0';
        }, 2000);
    }
    
    console.log('Visualizando todos os quadros disponíveis');
}

function showMembers() {
    // Cria um modal para mostrar e gerenciar membros
    const existingModal = document.getElementById('members-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'members-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-users"></i> Membros do Workspace</h3>
                <button class="close-btn" onclick="closeMembersModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="members-list">
                    <div class="member-item">
                        <div class="member-avatar">F</div>
                        <div class="member-info">
                            <h4>Florense Admin</h4>
                            <p>admin@florense.com</p>
                            <span class="member-role">Administrador</span>
                        </div>
                    </div>
                    <div class="member-item">
                        <div class="member-avatar">U</div>
                        <div class="member-info">
                            <h4>Usuário Atual</h4>
                            <p>${JSON.parse(localStorage.getItem('loggedUser') || '{}').email || 'usuario@florense.com'}</p>
                            <span class="member-role">Membro</span>
                        </div>
                    </div>
                </div>
                <div class="add-member-section">
                    <h4>Convidar Membros</h4>
                    <div class="invite-form">
                        <input type="email" placeholder="Digite o email para convidar" id="invite-email">
                        <button onclick="inviteMember()" class="invite-btn">
                            <i class="fas fa-paper-plane"></i> Convidar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    console.log('Abrindo gerenciamento de membros');
}

function showSettings(workspaceElement) {
    // Cria um modal para configurações do workspace
    const existingModal = document.getElementById('settings-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Identificar qual workspace está sendo configurado
    let currentWorkspaceName = 'Florense Workspace';
    let workspaceId = null;
    let isUserCreated = false;
    
    if (workspaceElement) {
        // Se foi passado um elemento específico, usar seus dados
        const nameElement = workspaceElement.closest('.workspace-section')?.querySelector('.workspace-name');
        if (nameElement) {
            currentWorkspaceName = nameElement.textContent;
        }
        
        // Verificar se tem data attributes
        const section = workspaceElement.closest('.workspace-section');
        if (section) {
            workspaceId = section.getAttribute('data-workspace-id');
            const dataName = section.getAttribute('data-workspace-name');
            if (dataName) {
                currentWorkspaceName = dataName;
                isUserCreated = true;
            }
        }
    } else {
        // Fallback: usar configurações salvas do workspace principal
        const savedSettings = JSON.parse(localStorage.getItem('workspace-settings') || '{}');
        currentWorkspaceName = savedSettings.name || 'Florense Workspace';
    }
    
    // Verificar se é workspace criado pelo usuário
    const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
    const userWorkspace = userWorkspaces.find(ws => ws.name === currentWorkspaceName || ws.id === workspaceId);
    
    if (userWorkspace) {
        isUserCreated = true;
        workspaceId = userWorkspace.id;
    }
    
    const currentDescription = userWorkspace?.description || '';
    const currentPrivacy = userWorkspace?.privacy || 'private';
    
    console.log('Abrindo configurações para:', { 
        name: currentWorkspaceName, 
        id: workspaceId, 
        isUserCreated: isUserCreated 
    });
    
    const modal = document.createElement('div');
    modal.id = 'settings-modal';
    modal.className = 'modal';
    modal.setAttribute('data-workspace-name', currentWorkspaceName);
    modal.setAttribute('data-workspace-id', workspaceId || '');
    modal.setAttribute('data-is-user-created', isUserCreated.toString());
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-cog"></i> Configurações do Workspace</h3>
                <button class="close-btn" onclick="closeSettingsModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="settings-section">
                    <h4>Informações do Workspace</h4>
                    <div class="setting-item">
                        <label>Nome do Workspace:</label>
                        <input type="text" value="${currentWorkspaceName}" id="workspace-name">
                    </div>
                    <div class="setting-item">
                        <label>Descrição:</label>
                        <textarea placeholder="Adicione uma descrição para o workspace" id="workspace-description">${currentDescription}</textarea>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Privacidade</h4>
                    <div class="setting-item">
                        <label>
                            <input type="radio" name="privacy" value="private" ${currentPrivacy === 'private' ? 'checked' : ''}>
                            Privado - Apenas membros convidados podem ver
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="radio" name="privacy" value="public" ${currentPrivacy === 'public' ? 'checked' : ''}>
                            Público - Qualquer pessoa pode ver (mas não editar)
                        </label>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h4>Ações Avançadas</h4>
                    <button class="danger-btn" onclick="exportWorkspaceData()">
                        <i class="fas fa-download"></i> Exportar Dados
                    </button>
                    <button class="danger-btn" onclick="confirmDeleteWorkspace()">
                        <i class="fas fa-trash"></i> Excluir Workspace
                    </button>
                </div>
                
                <div class="settings-actions">
                    <button onclick="saveSettings()" class="save-btn">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    console.log('Abrindo configurações do workspace');
}

function closeMembersModal() {
    const modal = document.getElementById('members-modal');
    if (modal) {
        modal.remove();
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.remove();
    }
}

function inviteMember() {
    const emailInput = document.getElementById('invite-email');
    const email = emailInput.value.trim();
    
    if (email && email.includes('@')) {
        alert(`Convite enviado para ${email}!`);
        emailInput.value = '';
    } else {
        alert('Por favor, digite um email válido.');
    }
}

function saveSettings() {
    const workspaceName = document.getElementById('workspace-name').value;
    const workspaceDescription = document.getElementById('workspace-description').value;
    const privacy = document.querySelector('input[name="privacy"]:checked').value;
    
    // Salva no localStorage
    localStorage.setItem('workspace-settings', JSON.stringify({
        name: workspaceName,
        description: workspaceDescription,
        privacy: privacy,
        updatedAt: new Date().toISOString()
    }));
    
    // Atualizar o nome do workspace na interface
    updateWorkspaceNameInInterface(workspaceName);
    
    // Fechar modal sem notificação
    closeSettingsModal();
    
    // Feedback discreto
    showSuccessToast('Configurações atualizadas!');
}

function exportWorkspaceData() {
    const boards = JSON.parse(localStorage.getItem(getUserBoardsKey()) || '[]');
    const settings = JSON.parse(localStorage.getItem('workspace-settings') || '{}');
    
    const exportData = {
        workspace: settings,
        boards: boards,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `florense-workspace-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('Dados do workspace exportados');
}

function confirmDeleteWorkspace() {
    // Pegar dados do modal que foram definidos quando o modal foi aberto
    const settingsModal = document.getElementById('settings-modal');
    if (!settingsModal) return;
    
    const currentWorkspaceName = settingsModal.getAttribute('data-workspace-name');
    const workspaceId = settingsModal.getAttribute('data-workspace-id');
    const isUserCreated = settingsModal.getAttribute('data-is-user-created') === 'true';
    
    console.log('Excluindo workspace:', {
        name: currentWorkspaceName,
        id: workspaceId,
        isUserCreated: isUserCreated
    });
    
    if (!isUserCreated) {
        // Se for o workspace principal, apenas reseta suas configurações
        localStorage.removeItem('workspace-settings');
        
        // Reseta o nome para o padrão
        updateWorkspaceNameInInterface('Florense Workspace');
        
        showSuccessToast('Workspace resetado para configurações padrão!');
    } else {
        // Se for um workspace criado pelo usuário, remove da lista
        console.log('Removendo workspace criado pelo usuário:', currentWorkspaceName);
        
        const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
        const filteredWorkspaces = userWorkspaces.filter(ws => 
            ws.name !== currentWorkspaceName && ws.id !== workspaceId
        );
        localStorage.setItem('user-workspaces', JSON.stringify(filteredWorkspaces));
        
        // Remove a seção da interface usando ID primeiro, depois nome
        let removed = false;
        
        if (workspaceId) {
            const workspaceSection = document.querySelector(`[data-workspace-id="${workspaceId}"]`);
            if (workspaceSection) {
                console.log('Removendo seção da interface via ID:', workspaceId);
                workspaceSection.remove();
                removed = true;
            }
        }
        
        if (!removed) {
            const workspaceSection = document.querySelector(`[data-workspace-name="${currentWorkspaceName}"]`);
            if (workspaceSection) {
                console.log('Removendo seção da interface via nome:', currentWorkspaceName);
                workspaceSection.remove();
                removed = true;
            }
        }
        
        // Fallback final: remover por texto
        if (!removed) {
            const workspaceSections = document.querySelectorAll('.workspace-section.new-workspace');
            workspaceSections.forEach(section => {
                const nameElement = section.querySelector('.workspace-name');
                if (nameElement && nameElement.textContent.trim() === currentWorkspaceName.trim()) {
                    console.log('Removendo seção da interface via texto:', currentWorkspaceName);
                    section.remove();
                }
            });
        }
        
        showSuccessToast(`Workspace "${currentWorkspaceName}" excluído!`);
    }
    
    // Fechar modal de configurações
    closeSettingsModal();
}

// ============================================
// CREATE WORKSPACE FUNCTIONS
// ============================================
function showCreateWorkspaceModal() {
    // Remove modal existente se houver
    const existingModal = document.getElementById('create-workspace-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'create-workspace-modal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <div class="modal-header">
                <h3><i class="fas fa-plus"></i> Criar Espaço de Trabalho</h3>
                <button class="close-btn" onclick="closeCreateWorkspaceModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label for="workspace-name-input">Nome do Espaço de Trabalho *</label>
                    <input type="text" id="workspace-name-input" placeholder="Ex: Equipe de Marketing" required>
                    <small>O nome será usado para identificar o espaço de trabalho.</small>
                </div>
                
                <div class="form-group">
                    <label for="workspace-desc-input">Descrição (opcional)</label>
                    <textarea id="workspace-desc-input" rows="3" placeholder="Descreva o propósito deste espaço de trabalho"></textarea>
                </div>
                
                <div class="form-group">
                    <label>Tipo de Espaço</label>
                    <div class="workspace-type-options">
                        <label class="radio-option">
                            <input type="radio" name="workspace-type" value="team" checked>
                            <div class="option-content">
                                <div class="option-title">Equipe</div>
                                <div class="option-desc">Para colaboração em projetos com colegas</div>
                            </div>
                        </label>
                        <label class="radio-option">
                            <input type="radio" name="workspace-type" value="personal">
                            <div class="option-content">
                                <div class="option-title">Pessoal</div>
                                <div class="option-desc">Para organizar seus projetos pessoais</div>
                            </div>
                        </label>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closeCreateWorkspaceModal()">Cancelar</button>
                <button type="button" class="btn-primary" onclick="createNewWorkspace()">Criar Espaço de Trabalho</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // Focar no campo de nome
    setTimeout(() => {
        document.getElementById('workspace-name-input').focus();
    }, 100);
    
    console.log('Modal de criação de workspace aberto');
}

function closeCreateWorkspaceModal() {
    const modal = document.getElementById('create-workspace-modal');
    if (modal) {
        modal.remove();
    }
}

function createNewWorkspace() {
    const nameInput = document.getElementById('workspace-name-input');
    const descInput = document.getElementById('workspace-desc-input');
    const typeInput = document.querySelector('input[name="workspace-type"]:checked');
    
    if (!nameInput.value.trim()) {
        nameInput.style.borderColor = '#dc3545';
        nameInput.placeholder = 'Este campo é obrigatório';
        nameInput.focus();
        
        // Remover o erro quando o usuário começar a digitar
        nameInput.addEventListener('input', function() {
            if (this.value.trim()) {
                this.style.borderColor = '#e4e6ea';
                this.placeholder = 'Ex: Equipe de Marketing';
            }
        }, { once: true });
        
        return;
    }
    
    const workspaceData = {
        id: 'workspace_' + Date.now(),
        name: nameInput.value.trim(),
        description: descInput.value.trim(),
        type: typeInput.value,
        createdAt: new Date().toISOString(),
        members: [
            {
                id: 'admin',
                name: 'Florense Admin',
                email: 'admin@florense.com',
                role: 'admin',
                avatar: 'F'
            }
        ],
        privacy: 'private'
    };
    
    // Salvar no localStorage
    const workspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
    workspaces.push(workspaceData);
    localStorage.setItem('user-workspaces', JSON.stringify(workspaces));
    
    // Fechar modal
    closeCreateWorkspaceModal();
    
    // Atualizar a interface para mostrar o novo workspace
    updateWorkspaceInInterface(workspaceData);
    
    // Mostrar feedback visual discreto
    showSuccessToast(`Espaço de trabalho "${workspaceData.name}" criado com sucesso!`);
    
    console.log('Novo workspace criado:', workspaceData);
}

function clearAllWorkspaces(showToast = true) {
    // ATENÇÃO: Esta função remove TODOS os workspaces criados
    // Só deve ser chamada manualmente quando quiser limpar tudo
    
    // Limpa todos os workspaces criados
    localStorage.removeItem('user-workspaces');
    
    // Remove todas as seções de workspace criadas dinamicamente
    const workspaceSections = document.querySelectorAll('.workspace-section.new-workspace');
    workspaceSections.forEach(section => section.remove());
    
    // Mostrar feedback apenas se solicitado
    if (showToast) {
        showSuccessToast('Todos os workspaces foram limpos!');
    }
    
    console.log('Todos os workspaces foram limpos');
}

function forceRemoveWorkspace(workspaceName) {
    console.log('Forçando remoção do workspace:', workspaceName);
    
    // Remove do localStorage
    const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
    const filteredWorkspaces = userWorkspaces.filter(ws => ws.name !== workspaceName);
    localStorage.setItem('user-workspaces', JSON.stringify(filteredWorkspaces));
    
    // Remove seção da interface usando data-attribute primeiro
    let removedCount = 0;
    const workspaceByAttribute = document.querySelector(`[data-workspace-name="${workspaceName}"]`);
    if (workspaceByAttribute) {
        workspaceByAttribute.remove();
        removedCount++;
    }
    
    // Fallback: remover por texto
    const workspaceSections = document.querySelectorAll('.workspace-section.new-workspace');
    workspaceSections.forEach(section => {
        const nameElement = section.querySelector('.workspace-name');
        if (nameElement && nameElement.textContent.trim() === workspaceName.trim()) {
            section.remove();
            removedCount++;
        }
    });
    
    console.log(`Workspace "${workspaceName}" removido. Seções removidas: ${removedCount}`);
    showSuccessToast(`Workspace "${workspaceName}" removido à força!`);
}

function debugWorkspaces() {
    console.log('=== DEBUG WORKSPACES ===');
    console.log('Workspaces salvos:', JSON.parse(localStorage.getItem('user-workspaces') || '[]'));
    
    console.log('Seções na interface:');
    const sections = document.querySelectorAll('.workspace-section');
    sections.forEach((section, index) => {
        const nameEl = section.querySelector('.workspace-name');
        const name = nameEl ? nameEl.textContent : 'N/A';
        const id = section.getAttribute('data-workspace-id');
        const dataName = section.getAttribute('data-workspace-name');
        
        console.log(`Seção ${index + 1}:`, {
            name: name,
            id: id,
            dataName: dataName,
            classes: section.className
        });
    });
}

function updateWorkspaceNameInInterface(newName) {
    // Atualizar nome do workspace principal na página
    const workspaceNameElement = document.querySelector('.workspace-section .workspace-name');
    if (workspaceNameElement) {
        workspaceNameElement.textContent = newName;
    }
    
    // Atualizar nome no cabeçalho da seção se existir
    const workspaceHeaderName = document.querySelector('.workspace-info-section .workspace-name');
    if (workspaceHeaderName) {
        workspaceHeaderName.textContent = newName;
    }
    
    // Atualizar avatar se necessário (primeira letra do nome)
    const workspaceAvatar = document.querySelector('.workspace-section .workspace-avatar-large');
    if (workspaceAvatar && newName) {
        workspaceAvatar.textContent = newName.charAt(0).toUpperCase();
    }
    
    console.log('Nome do workspace atualizado para:', newName);
}

function updateWorkspaceBoards(workspaceId, workspaceName) {
    // Encontrar a seção do workspace e atualizar seus boards
    let workspaceSection = null;
    
    if (workspaceId) {
        workspaceSection = document.querySelector(`[data-workspace-id="${workspaceId}"]`);
    }
    
    if (!workspaceSection && workspaceName) {
        workspaceSection = document.querySelector(`[data-workspace-name="${workspaceName}"]`);
    }
    
    if (!workspaceSection) {
        console.error('Seção do workspace não encontrada:', { workspaceId, workspaceName });
        return;
    }
    
    // Pegar os boards do workspace
    const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
    const workspace = userWorkspaces.find(ws => ws.id === workspaceId || ws.name === workspaceName);
    
    if (!workspace) {
        console.error('Workspace não encontrado nos dados:', { workspaceId, workspaceName });
        return;
    }
    
    const workspaceBoards = workspace.boards || [];
    
    // Encontrar o grid de boards na seção
    const boardsGrid = workspaceSection.querySelector('.boards-grid');
    if (!boardsGrid) {
        console.error('Grid de boards não encontrado na seção do workspace');
        return;
    }
    
    // Limpar boards existentes (manter apenas o botão "Criar novo quadro")
    const createButton = boardsGrid.querySelector('.create-board-card');
    boardsGrid.innerHTML = '';
    
    // Adicionar boards do workspace
    workspaceBoards.forEach(board => {
        const boardCard = createBoardCard(board);
        boardsGrid.appendChild(boardCard);
    });
    
    // Re-adicionar o botão de criar
    if (createButton) {
        boardsGrid.appendChild(createButton);
    }
    
    console.log(`Boards atualizados para workspace "${workspaceName}":`, workspaceBoards.length);
}

function loadSavedWorkspaceSettings() {
    // Carregar configurações salvas do localStorage
    const savedSettings = JSON.parse(localStorage.getItem('workspace-settings') || '{}');
    
    if (savedSettings.name) {
        // Atualizar nome na interface
        updateWorkspaceNameInInterface(savedSettings.name);
    }
    
    // Recriar workspaces salvos na interface (evitando duplicações)
    const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces') || '[]');
    console.log('Carregando workspaces salvos:', userWorkspaces);
    
    userWorkspaces.forEach(workspace => {
        // Verificar se já existe na interface por ID ou nome
        const existingSection = document.querySelector(`[data-workspace-id="${workspace.id}"]`) || 
                               document.querySelector(`[data-workspace-name="${workspace.name}"]`);
        
        console.log(`Workspace "${workspace.name}" - Já existe na interface:`, !!existingSection);
        
        if (!existingSection) {
            console.log(`Recriando workspace na interface: ${workspace.name}`);
            updateWorkspaceInInterface(workspace);
        } else {
            // Se já existe, atualizar seus boards
            console.log(`Atualizando boards do workspace: ${workspace.name}`);
            updateWorkspaceBoards(workspace.id, workspace.name);
        }
    });
}

function updateWorkspaceInInterface(workspaceData) {
    // Encontrar a área de conteúdo onde adicionar o novo workspace
    const contentArea = document.querySelector('.content-area');
    if (!contentArea) return;
    
    // Verificar se o workspace já existe na interface
    const existingWorkspace = Array.from(document.querySelectorAll('.workspace-name'))
        .find(el => el.textContent === workspaceData.name);
    
    if (existingWorkspace) {
        // Se já existe, apenas rola para ele
        existingWorkspace.closest('.workspace-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        return;
    }
    
    // Criar nova seção de workspace
    const newWorkspaceSection = document.createElement('section');
    newWorkspaceSection.className = 'workspace-section new-workspace';
    newWorkspaceSection.setAttribute('data-workspace-id', workspaceData.id);
    newWorkspaceSection.setAttribute('data-workspace-name', workspaceData.name);
    newWorkspaceSection.style.opacity = '0';
    newWorkspaceSection.style.transform = 'translateY(20px)';
    newWorkspaceSection.innerHTML = `
        <div class="workspace-header">
            <div class="workspace-info-section">
                <div class="workspace-avatar-large">${workspaceData.name.charAt(0).toUpperCase()}</div>
                <h2 class="workspace-name">${workspaceData.name}</h2>
            </div>
            
            <div class="workspace-actions">
                <button class="workspace-btn" onclick="showBoards()">
                    <i class="fas fa-th-large"></i>
                    Quadros
                </button>
                <button class="workspace-btn" onclick="showMembers()">
                    <i class="fas fa-users"></i>
                    Membros
                </button>
                <button class="workspace-btn" onclick="showSettings(this)">
                    <i class="fas fa-cog"></i>
                    Configurações
                </button>
            </div>
        </div>

        <div class="boards-grid">
            <div class="create-board-card" onclick="showCreateBoardModal(this)">
                <div class="create-board-content">
                    <span class="create-board-text">Criar novo quadro</span>
                    <div class="create-board-subtitle">10 restante(s)</div>
                </div>
            </div>
        </div>

        <div class="view-closed-boards">
            <button class="view-closed-btn">
                Ver todos os quadros fechados
            </button>
        </div>
    `;
    
    // Adicionar a nova seção após a última seção workspace existente
    const existingWorkspaceSection = document.querySelector('.workspace-section');
    if (existingWorkspaceSection) {
        existingWorkspaceSection.parentNode.insertBefore(newWorkspaceSection, existingWorkspaceSection.nextSibling);
    } else {
        contentArea.appendChild(newWorkspaceSection);
    }
    
    // Atualizar o dropdown de workspaces
    const workspacesDropdown = document.getElementById('workspaces-dropdown');
    if (workspacesDropdown) {
        // Forçar a atualização do dropdown na próxima vez que for aberto
        workspacesDropdown.setAttribute('data-needs-refresh', 'true');
    }
    
    // Animar a entrada da nova seção
    setTimeout(() => {
        newWorkspaceSection.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
        newWorkspaceSection.style.opacity = '1';
        newWorkspaceSection.style.transform = 'translateY(0)';
        
        // Rolar para a nova seção criada após a animação
        setTimeout(() => {
            newWorkspaceSection.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 200);
    }, 100);
    
    // IMPORTANTE: Adicionar os boards do workspace se existirem
    if (workspaceData.boards && workspaceData.boards.length > 0) {
        const boardsGrid = newWorkspaceSection.querySelector('.boards-grid');
        const createButton = boardsGrid.querySelector('.create-board-card');
        
        // Adicionar cada board
        workspaceData.boards.forEach(board => {
            const boardCard = createBoardCard(board);
            boardsGrid.insertBefore(boardCard, createButton);
        });
        
        console.log(`Adicionados ${workspaceData.boards.length} board(s) ao workspace "${workspaceData.name}"`);
    }
}

function showSuccessToast(message) {
    // Remove toast existente se houver
    const existingToast = document.getElementById('success-toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Criar novo toast
    const toast = document.createElement('div');
    toast.id = 'success-toast';
    toast.className = 'success-toast';
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Adicionar ao body
    document.body.appendChild(toast);
    
    // Mostrar toast com animação
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remover toast após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, 3000);
}

// ============================================
// GLOBAL FUNCTIONS
// ============================================
window.openBoard = openBoard;
window.deleteBoard = deleteBoard;
window.showCreateBoardModal = showCreateBoardModal;
window.closeCreateBoardModal = closeCreateBoardModal;
window.createNewBoard = createNewBoard;
window.goBack = goBack;
window.setupBackgroundSelection = setupBackgroundSelection;
window.showBoards = showBoards;
window.showMembers = showMembers;
window.showSettings = showSettings;
window.closeMembersModal = closeMembersModal;
window.closeSettingsModal = closeSettingsModal;
window.inviteMember = inviteMember;
window.saveSettings = saveSettings;
window.exportWorkspaceData = exportWorkspaceData;
window.confirmDeleteWorkspace = confirmDeleteWorkspace;
window.toggleStarBoard = toggleStarBoard;
window.showCreateWorkspaceModal = showCreateWorkspaceModal;
window.closeCreateWorkspaceModal = closeCreateWorkspaceModal;
window.createNewWorkspace = createNewWorkspace;
window.updateWorkspaceInInterface = updateWorkspaceInInterface;
window.showSuccessToast = showSuccessToast;
window.clearAllWorkspaces = clearAllWorkspaces;
window.updateWorkspaceNameInInterface = updateWorkspaceNameInInterface;
window.loadSavedWorkspaceSettings = loadSavedWorkspaceSettings;
window.forceRemoveWorkspace = forceRemoveWorkspace;
window.updateWorkspaceBoards = updateWorkspaceBoards;
window.debugWorkspaces = debugWorkspaces;

// Função para recriar boards com novos backgrounds (temporária para desenvolvimento)
window.recreateBoardsWithNewBackgrounds = function() {
    if (confirm('Isso irá recriar os boards padrão com novos backgrounds. Continuar?')) {
        // Limpar boards existentes
        boards = [];
        
        // Criar novos boards com backgrounds atualizados
        createSampleBoards();
        
        // Recarregar visualizações
        renderRecentBoards();
        renderWorkspaceBoards();
        
        showNotification('Boards recriados com novos backgrounds!', 'success');
    }
};

// ============================================
// KEYBOARD SHORTCUTS
// ============================================
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + N = Novo Board
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            showCreateBoardModal();
        }
        
        // Ctrl/Cmd + F = Focar na busca
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            const searchInput = document.querySelector('.search-input');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Escape = Fechar modais e dropdowns
        if (e.key === 'Escape') {
            closeAllModals();
            closeAllDropdowns();
        }
        
        // ? = Mostrar atalhos de teclado
        if (e.key === '?' && !e.shiftKey) {
            e.preventDefault();
            showKeyboardShortcuts();
        }
    });
}

function closeAllModals() {
    // Fechar modal de criação de board
    const createModal = document.getElementById('create-board-modal');
    if (createModal && createModal.style.display === 'flex') {
        closeCreateBoardModal();
    }
    
    // Fechar modal de membros
    const membersModal = document.getElementById('members-modal');
    if (membersModal && membersModal.style.display === 'flex') {
        closeMembersModal();
    }
    
    // Fechar modal de configurações
    const settingsModal = document.getElementById('settings-modal');
    if (settingsModal && settingsModal.style.display === 'flex') {
        closeSettingsModal();
    }
}

function showKeyboardShortcuts() {
    const modal = document.createElement('div');
    modal.className = 'keyboard-shortcuts-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 12px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        ">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="color: #172b4d; margin: 0;">Atalhos de Teclado</h2>
                <button onclick="this.closest('.keyboard-shortcuts-modal').remove()" style="
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #6b778c;
                    cursor: pointer;
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">&times;</button>
            </div>
            
            <div class="shortcuts-list">
                <div class="shortcut-item">
                    <span class="shortcut-key">Ctrl + N</span>
                    <span class="shortcut-desc">Criar novo board</span>
                </div>
                <div class="shortcut-item">
                    <span class="shortcut-key">Ctrl + F</span>
                    <span class="shortcut-desc">Focar na pesquisa</span>
                </div>
                <div class="shortcut-item">
                    <span class="shortcut-key">Esc</span>
                    <span class="shortcut-desc">Fechar modais</span>
                </div>
                <div class="shortcut-item">
                    <span class="shortcut-key">?</span>
                    <span class="shortcut-desc">Mostrar atalhos</span>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar estilos dos atalhos
    const style = document.createElement('style');
    style.textContent = `
        .shortcuts-list {
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        
        .shortcut-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background: #f4f5f7;
            border-radius: 8px;
        }
        
        .shortcut-key {
            background: #ddd;
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-weight: bold;
            color: #172b4d;
        }
        
        .shortcut-desc {
            color: #5e6c84;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// ============================================
// TOOLTIPS
// ============================================
function initializeTooltips() {
    // Adicionar tooltips aos elementos principais
    const tooltipElements = [
        { selector: '#create-btn', text: 'Criar novo board (Ctrl+N)' },
        { selector: '.search-input', text: 'Pesquisar boards (Ctrl+F)' },
        { selector: '#user-avatar', text: 'Menu do usuário' },
        { selector: '#workspaces-dropdown .nav-button', text: 'Espaços de trabalho' },
        { selector: '#recent-dropdown .nav-button', text: 'Boards recentes' },
        { selector: '#starred-dropdown .nav-button', text: 'Boards favoritos' },
        { selector: '#templates-dropdown .nav-button', text: 'Modelos de board' }
    ];
    
    tooltipElements.forEach(({ selector, text }) => {
        const element = document.querySelector(selector);
        if (element) {
            addTooltip(element, text);
        }
    });
}

function addTooltip(element, text) {
    element.setAttribute('data-tooltip', text);
    
    element.addEventListener('mouseenter', showTooltip);
    element.addEventListener('mouseleave', hideTooltip);
    element.addEventListener('focus', showTooltip);
    element.addEventListener('blur', hideTooltip);
}

function showTooltip(e) {
    const text = e.target.getAttribute('data-tooltip');
    if (!text) return;
    
    // Remove tooltip existente
    const existingTooltip = document.querySelector('.custom-tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = text;
    tooltip.style.cssText = `
        position: absolute;
        background: #172b4d;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 10000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s ease;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    `;
    
    document.body.appendChild(tooltip);
    
    // Posicionar tooltip
    const rect = e.target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    let top = rect.bottom + 8;
    let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
    
    // Ajustar se sair da tela
    if (left < 8) left = 8;
    if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
    }
    
    if (top + tooltipRect.height > window.innerHeight - 8) {
        top = rect.top - tooltipRect.height - 8;
    }
    
    tooltip.style.top = top + 'px';
    tooltip.style.left = left + 'px';
    
    // Mostrar com animação
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
    });
}

function hideTooltip() {
    const tooltip = document.querySelector('.custom-tooltip');
    if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.remove();
            }
        }, 200);
    }
}

// ============================================
// BOARD PREVIEW FUNCTIONALITY
// ============================================
function initializeBoardPreview() {
    // Atualizar preview quando o título mudar
    const titleInput = document.getElementById('board-title-input');
    if (titleInput) {
        titleInput.addEventListener('input', updateBoardPreview);
    }
    
    // Atualizar preview quando background mudar
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('bg-option')) {
            updateBoardPreview();
        }
    });
    
    // Inicializar com preview padrão
    updateBoardPreview();
}

function updateBoardPreview() {
    const titleInput = document.getElementById('board-title-input');
    const selectedBg = document.querySelector('.bg-option.selected');
    const previewTitle = document.getElementById('preview-title');
    const previewBackground = document.getElementById('preview-background');
    
    if (!previewTitle || !previewBackground) return;
    
    // Atualizar título
    const title = titleInput ? titleInput.value.trim() : '';
    previewTitle.textContent = title || 'Meu Novo Board';
    
    // Atualizar background
    if (selectedBg) {
        const bgType = selectedBg.getAttribute('data-bg');
        const backgroundImages = {
            // Nature backgrounds
            nature1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            nature2: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            nature3: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            nature4: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            nature5: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            nature6: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Mountain backgrounds  
            mountain1: 'https://images.unsplash.com/photo-1464822759844-d150378684e8?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            mountain2: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Ocean backgrounds
            ocean1: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            ocean2: 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Forest backgrounds
            forest1: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Sunset backgrounds
            sunset1: 'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Tropical backgrounds
            tropical1: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            tropical2: 'https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            // Beach backgrounds
            beach1: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
            beach2: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80'
        };

        const gradients = {
            gradient1: 'linear-gradient(135deg, #667eea, #764ba2)',
            gradient2: 'linear-gradient(135deg, #f093fb, #f5576c)', 
            gradient3: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            gradient4: 'linear-gradient(135deg, #43e97b, #38f9d7)',
            gradient5: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
            gradient6: 'linear-gradient(135deg, #a8edea, #fed6e3)'
        };

        if (backgroundImages[bgType]) {
            // É uma imagem de fundo
            previewBackground.style.backgroundImage = `url('${backgroundImages[bgType]}')`;
            previewBackground.style.backgroundSize = 'cover';
            previewBackground.style.backgroundPosition = 'center';
            previewBackground.style.background = '';
        } else if (gradients[bgType]) {
            // É um gradiente
            previewBackground.style.background = gradients[bgType];
            previewBackground.style.backgroundImage = '';
        }
    }
}

// ============================================
// SISTEMA DE NOTIFICAÇÕES
// ============================================

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

function addNotification(title, message, type = 'info') {
    const notifications = getNotifications();
    const newNotification = {
        id: generateId(),
        title: title,
        message: message,
        type: type, // info, success, warning, error
        timestamp: new Date().toISOString(),
        read: false
    };
    
    notifications.unshift(newNotification);
    
    // Manter apenas as últimas 50 notificações
    if (notifications.length > 50) {
        notifications.splice(50);
    }
    
    saveNotifications(notifications);
    showNotificationToast(title, message, type);
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

function showNotificationToast(title, message, type) {
    // Som de notificação (opcional)
    // new Audio('notification.mp3').play();
    
    // Notificação do navegador (se permitido)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico'
        });
    }
}

// Solicitar permissão para notificações do navegador
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Atualizar badge ao carregar a página
updateNotificationBadge();

// Adicionar notificações de exemplo para demonstração do sistema
// (Você pode remover isso em produção)
function addSystemUpdateNotifications() {
    const lastCheck = localStorage.getItem('lastSystemCheck');
    const now = new Date().toISOString();
    
    if (!lastCheck || new Date(now) - new Date(lastCheck) > 24 * 60 * 60 * 1000) {
        // Adiciona notificação de boas-vindas ou atualizações do sistema
        addNotification(
            'Bem-vindo ao Sistema Florense',
            'Sistema atualizado com novos recursos e melhorias de performance.',
            'success'
        );
        localStorage.setItem('lastSystemCheck', now);
    }
}

// Verificar atualizações do sistema ao carregar
setTimeout(() => {
    addSystemUpdateNotifications();
}, 2000);

// Função global para adicionar notificações (pode ser chamada de qualquer lugar)
window.addSystemNotification = addNotification;

// ============================================
// GERENCIAMENTO DE PERFIL
// ============================================

async function getUserProfile() {
    if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        return {
            name: '',
            email: '',
            phone: '',
            bio: '',
            photo: null
        };
    }
    
    try {
        console.log('🔍 Buscando perfil do usuário...');
        
        // 1. Verificar localStorage primeiro (mais rápido)
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
        if (loggedUser.email === currentUser.email) {
            console.log('✅ Perfil encontrado no localStorage');
            return {
                name: loggedUser.fullName || loggedUser.username || currentUser.email.split('@')[0],
                email: loggedUser.email,
                phone: loggedUser.phone || '',
                bio: loggedUser.bio || '',
                photo: loggedUser.photo || null
            };
        }
        
        // 2. Tentar buscar do Firestore usando firebaseService
        if (window.firebaseService && currentUser.uid && !currentUser.uid.startsWith('local_')) {
            const result = await window.firebaseService.getUserProfile(currentUser.uid);
            if (result.success && result.user) {
                const userData = result.user;
                console.log('✅ Perfil encontrado no Firestore');
                return {
                    name: userData.username || currentUser.email.split('@')[0],
                    email: currentUser.email,
                    phone: userData.phone || '',
                    bio: userData.bio || '',
                    photo: userData.profilePhoto || null
                };
            }
        }
        
        // 3. Fallback: usar dados básicos do currentUser
        console.log('⚠️ Usando dados básicos como fallback');
        return {
            name: currentUser.displayName || currentUser.email.split('@')[0],
            email: currentUser.email,
            phone: '',
            bio: '',
            photo: null
        };
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return {
            name: currentUser.email.split('@')[0],
            email: currentUser.email,
            phone: '',
            bio: '',
            photo: null
        };
    }
}

async function saveUserProfile(profile) {
    if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        return;
    }
    
    try {
        console.log('💾 Salvando perfil:', profile);
        
        // SISTEMA HÍBRIDO: Salvar no Firebase E no localStorage
        
        // 1. Tentar salvar no Firestore (se for usuário Firebase)
        if (window.firebaseService && currentUser.uid && !currentUser.uid.startsWith('local_')) {
            try {
                const result = await window.firebaseService.updateUserProfile(currentUser.uid, profile);
                if (result.success) {
                    console.log('✅ Perfil salvo no Firestore!');
                } else {
                    console.warn('⚠️ Erro ao salvar no Firestore:', result.error);
                }
            } catch (firestoreError) {
                console.warn('⚠️ Erro ao salvar no Firestore:', firestoreError);
            }
        }
        
        // 2. Sempre salvar no localStorage (para usuários locais E como backup)
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
        loggedUser.fullName = profile.name;
        loggedUser.phone = profile.phone;
        loggedUser.bio = profile.bio;
        loggedUser.photo = profile.photo;
        localStorage.setItem('loggedUser', JSON.stringify(loggedUser));
        console.log('✅ Perfil salvo no localStorage!');
        
        // 3. Atualizar também na lista de users do localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].fullName = profile.name;
            users[userIndex].phone = profile.phone;
            users[userIndex].bio = profile.bio;
            users[userIndex].photo = profile.photo;
            localStorage.setItem('users', JSON.stringify(users));
            console.log('✅ Perfil atualizado na lista de usuários!');
        }
        
        // 4. Atualizar display na interface
        await initializeUser();
        
        console.log('✅ Perfil salvo com sucesso em todos os sistemas!');
    } catch (error) {
        console.error('❌ Erro ao salvar perfil:', error);
        throw error; // Propagar erro para mostrar notificação
    }
}

async function showProfileModal() {
    console.log('🔍 Abrindo modal de perfil...');
    const modal = document.getElementById('profile-modal');
    
    if (!modal) {
        console.error('Modal de perfil não encontrado no HTML!');
        return;
    }
    
    const profile = await getUserProfile();
    console.log('Perfil carregado:', profile);
    
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

async function saveProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('profile-name').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const bio = document.getElementById('profile-bio').value.trim();
    const avatarImage = document.getElementById('profile-avatar-image');
    const photo = (avatarImage.style.display !== 'none' && avatarImage.src && !avatarImage.src.includes(window.location.href)) ? avatarImage.src : null;
    
    if (!name) {
        showNotification('Por favor, digite seu nome', 'warning');
        return;
    }
    
    const profile = {
        name: name,
        phone: phone,
        bio: bio,
        photo: photo
    };
    
    await saveUserProfile(profile);
    closeProfileModal();
    
    showNotification('Perfil atualizado com sucesso!', 'success');
    
    // Adicionar notificação no sistema
    addNotification(
        'Perfil Atualizado',
        'Suas informações de perfil foram atualizadas com sucesso.',
        'success'
    );
}

async function handlePhotoUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    console.log('📷 Arquivo selecionado:', file.name, file.type, file.size);
    
    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
        showNotification('Por favor, selecione uma imagem válida', 'error');
        return;
    }
    
    // Validar tamanho (máx 500KB para base64)
    if (file.size > 500 * 1024) {
        showNotification('A imagem deve ter no máximo 500KB', 'error');
        return;
    }
    
    if (!currentUser) {
        console.error('❌ Usuário não autenticado');
        showNotification('Erro: usuário não autenticado', 'error');
        return;
    }
    
    console.log('👤 Usuário autenticado:', currentUser.uid);
    
    try {
        showNotification('Carregando foto...', 'info');
        
        // Converter imagem para base64
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const base64Image = e.target.result;
            console.log('✅ Imagem convertida para base64');
            
            // Atualizar preview
            const avatarImage = document.getElementById('profile-avatar-image');
            const avatarInitial = document.getElementById('profile-avatar-initial');
            const removePhotoBtn = document.getElementById('remove-photo-btn');
            
            if (!avatarImage || !avatarInitial || !removePhotoBtn) {
                console.error('❌ Elementos do modal não encontrados');
                return;
            }
            
            avatarImage.src = base64Image;
            avatarImage.style.display = 'block';
            avatarInitial.style.display = 'none';
            removePhotoBtn.style.display = 'inline-flex';
            
            console.log('🎨 Preview atualizado');
            showNotification('Foto carregada! Clique em "Salvar alterações" para confirmar.', 'success');
        };
        
        reader.onerror = function(error) {
            console.error('❌ Erro ao ler arquivo:', error);
            showNotification('Erro ao carregar foto', 'error');
        };
        
        reader.readAsDataURL(file);
        
    } catch (error) {
        console.error('❌ Erro ao processar foto:', error);
        showNotification(`Erro: ${error.message}`, 'error');
    }
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

async function updateUserDisplay() {
    if (!currentUser) {
        console.warn('⚠️ updateUserDisplay: Usuário não autenticado');
        return;
    }
    
    const profile = await getUserProfile();
    
    if (!profile || !profile.email) {
        console.error('❌ updateUserDisplay: Perfil inválido', profile);
        return;
    }
    
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
    
    console.log('✅ updateUserDisplay: Display atualizado para', displayName);
    
    // Atualizar foto se existir
    const userAvatar = document.getElementById('user-avatar');
    const avatarLarge = document.querySelector('.avatar-large');
    
    if (profile.photo) {
        // Adicionar foto ao avatar pequeno
        if (userAvatar && !userAvatar.querySelector('img')) {
            const img = document.createElement('img');
            img.src = profile.photo;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 50%;';
            userInitial.style.display = 'none';
            userAvatar.appendChild(img);
        } else if (userAvatar) {
            const img = userAvatar.querySelector('img');
            if (img) img.src = profile.photo;
        }
        
        // Adicionar foto ao avatar grande
        if (avatarLarge && !avatarLarge.querySelector('img')) {
            const img = document.createElement('img');
            img.src = profile.photo;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0; border-radius: 50%;';
            avatarLargeInitial.style.display = 'none';
            avatarLarge.appendChild(img);
        } else if (avatarLarge) {
            const img = avatarLarge.querySelector('img');
            if (img) img.src = profile.photo;
        }
    } else {
        // Remover fotos se não existirem
        if (userAvatar) {
            const img = userAvatar.querySelector('img');
            if (img) img.remove();
            userInitial.style.display = 'flex';
        }
        
        if (avatarLarge) {
            const img = avatarLarge.querySelector('img');
            if (img) img.remove();
            avatarLargeInitial.style.display = 'flex';
        }
    }
}

// Atualizar display do usuário ao carregar
updateUserDisplay();

// Tornar funções globais
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.saveProfile = saveProfile;
window.handlePhotoUpload = handlePhotoUpload;
window.removePhoto = removePhoto;

// ============================================
// GERENCIAMENTO DE TEMA (CLARO/ESCURO)
// ============================================

function getTheme() {
    return localStorage.getItem('florense-theme') || 'light';
}

function setTheme(theme) {
    localStorage.setItem('florense-theme', theme);
    applyTheme(theme);
}

function applyTheme(theme) {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (theme === 'dark') {
        body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        if (themeText) {
            themeText.textContent = 'Tema Escuro';
        }
    } else {
        body.classList.remove('dark-theme');
        if (themeIcon) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        }
        if (themeText) {
            themeText.textContent = 'Tema Claro';
        }
    }
}

function toggleTheme() {
    const currentTheme = getTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    // Notificação
    const themeName = newTheme === 'dark' ? 'escuro' : 'claro';
    showNotification(`Tema ${themeName} ativado!`, 'success');
    
    // Adicionar notificação no sistema
    addNotification(
        'Tema Alterado',
        `Você alterou para o tema ${themeName}.`,
        'info'
    );
}

// Aplicar tema salvo ao carregar a página
applyTheme(getTheme());

// Tornar função global
window.toggleTheme = toggleTheme;

// ============================================
// INICIALIZAÇÃO FINAL
// ============================================
console.log('Florense Trello Home carregado com sucesso!');
console.log('Boards disponíveis:', boards.length);
console.log('Tema atual:', getTheme());
