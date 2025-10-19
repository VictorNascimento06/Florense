// ============================================
// ADMIN PANEL - FLORENSE (FIREBASE VERSION)
// ============================================

// Verificar autenticação e permissões de admin
let currentUser = null;
let isAdmin = false;
let authChecked = false;

console.log('🔄 Admin.js carregado. Aguardando Firebase...');

// Aguardar Firebase carregar
if (typeof firebase === 'undefined' || typeof auth === 'undefined' || typeof db === 'undefined') {
    console.error('❌ Firebase não carregado! Redirecionando...');
    // ALERTA REMOVIDO
    window.location.href = 'login.html';
    throw new Error('Firebase não carregado');
}

console.log('✅ Firebase detectado. Verificando autenticação...');

// Criar overlay de loading
const loadingOverlay = document.createElement('div');
loadingOverlay.id = 'auth-loading';
loadingOverlay.innerHTML = `
    <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        color: white;
        font-size: 20px;
    ">
        <div style="text-align: center;">
            <div style="font-size: 50px; margin-bottom: 20px;">🔐</div>
            <div>Verificando permissões...</div>
        </div>
    </div>
`;
document.body.appendChild(loadingOverlay);

// Verificar autenticação
auth.onAuthStateChanged(async (user) => {
    console.log('🔔 onAuthStateChanged disparado');
    
    if (!user) {
        console.log('❌ Usuário não autenticado');
        loadingOverlay.remove();
        // ALERTA REMOVIDO
        window.location.href = 'login.html';
        return;
    }

    console.log('✅ Usuário autenticado:', user.email, 'UID:', user.uid);
    currentUser = user;

    // Verificar se é admin no Firestore
    try {
        console.log('🔍 Buscando documento do usuário no Firestore...');
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        console.log('📄 Documento existe?', userDoc.exists);
        
        if (!userDoc.exists) {
            console.error('❌ Documento do usuário não encontrado no Firestore');
            console.log('ℹ️ UID procurado:', user.uid);
            loadingOverlay.remove();
            // ALERTA REMOVIDO
            await auth.signOut();
            window.location.href = 'login.html';
            return;
        }

        const userData = userDoc.data();
        console.log('📊 Dados completos do usuário:', JSON.stringify(userData, null, 2));
        
        isAdmin = userData.isAdmin === true;

        console.log('� Campo isAdmin:', userData.isAdmin);
        console.log('🔑 Tipo do campo:', typeof userData.isAdmin);
        console.log('🔑 É admin (verificação)?', isAdmin);

        if (!isAdmin) {
            console.error('❌ Usuário NÃO é admin');
            loadingOverlay.remove();
            // ALERTA REMOVIDO - Apenas redirecionar
            window.location.href = 'trello-home.html';
            return;
        }

        // Se chegou aqui, é admin! Inicializar painel
        console.log('✅✅✅ ACESSO DE ADMIN CONCEDIDO! ✅✅✅');
        authChecked = true;
        loadingOverlay.remove();
        
        initializeAdmin(userData);
        loadDashboardData();
        initializeEventListeners();

    } catch (error) {
        console.error('❌ Erro ao verificar permissões:', error);
        console.error('Stack:', error.stack);
        loadingOverlay.remove();
        // ALERTA REMOVIDO
        window.location.href = 'login.html';
    }
});

// ============================================
// INICIALIZAÇÃO
// ============================================
function initializeAdmin(userData) {
    const adminName = document.getElementById('admin-name');
    if (adminName) {
        adminName.textContent = userData.username || userData.email || 'Admin';
    }
    console.log('✅ Painel admin inicializado para:', userData.username);
}

// ============================================
// EVENT LISTENERS
// ============================================
function initializeEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Menu navigation
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.getAttribute('data-section');
            showSection(section);
        });
    });
    
    // Search filters
    const userSearch = document.getElementById('user-search');
    if (userSearch) {
        userSearch.addEventListener('input', filterUsers);
    }
    
    const boardSearch = document.getElementById('board-search');
    if (boardSearch) {
        boardSearch.addEventListener('input', filterBoards);
    }
    
    const accessFilter = document.getElementById('access-filter');
    if (accessFilter) {
        accessFilter.addEventListener('change', filterAccessLog);
    }
    
    const accessDateFilter = document.getElementById('access-date-filter');
    if (accessDateFilter) {
        accessDateFilter.addEventListener('change', filterAccessLog);
    }
}

function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.add('active');
    }
    
    // Update menu
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const activeMenuItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // Load data for specific sections
    if (sectionId === 'users') {
        loadUsersData();
    } else if (sectionId === 'access-log') {
        loadAccessLog();
    } else if (sectionId === 'boards') {
        loadAllBoards();
    } else if (sectionId === 'workspaces') {
        loadAllWorkspaces();
    } else if (sectionId === 'settings') {
        loadSettings();
    }
}

// ============================================
// DASHBOARD DATA
// ============================================
function loadDashboardData() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    
    // Total users
    document.getElementById('total-users').textContent = users.length;
    
    // Total boards
    let totalBoards = 0;
    users.forEach(user => {
        const userBoards = JSON.parse(localStorage.getItem(`boards_${user.email}`)) || [];
        totalBoards += userBoards.length;
    });
    document.getElementById('total-boards').textContent = totalBoards;
    
    // Total workspaces
    const workspaces = JSON.parse(localStorage.getItem('user-workspaces')) || [];
    document.getElementById('total-workspaces').textContent = workspaces.length + users.length;
    
    // Total logins
    document.getElementById('total-logins').textContent = accessLog.length;
    
    // Recent users
    loadRecentUsers(users);
    
    // Recent access
    loadRecentAccess(accessLog);
}

function loadRecentUsers(users) {
    const container = document.getElementById('recent-users-list');
    container.innerHTML = '';
    
    const recentUsers = users
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
    
    if (recentUsers.length === 0) {
        container.innerHTML = '<p style="color: #5e6c84; padding: 1rem;">Nenhum usuário registrado</p>';
        return;
    }
    
    recentUsers.forEach(user => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-avatar">${user.username.charAt(0).toUpperCase()}</div>
            <div class="list-item-info">
                <strong>${user.username}</strong>
                <small>${user.email}</small>
            </div>
            <small>${formatDate(user.createdAt)}</small>
        `;
        container.appendChild(item);
    });
}

function loadRecentAccess(accessLog) {
    const container = document.getElementById('recent-access-list');
    container.innerHTML = '';
    
    const recentAccess = accessLog
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);
    
    if (recentAccess.length === 0) {
        container.innerHTML = '<p style="color: #5e6c84; padding: 1rem;">Nenhum acesso registrado</p>';
        return;
    }
    
    recentAccess.forEach(access => {
        const item = document.createElement('div');
        item.className = 'list-item';
        item.innerHTML = `
            <div class="list-item-avatar">${access.username.charAt(0).toUpperCase()}</div>
            <div class="list-item-info">
                <strong>${access.username}</strong>
                <small>${access.action} - ${formatDateTime(access.timestamp)}</small>
            </div>
        `;
        container.appendChild(item);
    });
}

// ============================================
// USERS DATA
// ============================================
function loadUsersData() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    const tbody = document.getElementById('users-table-body');
    
    tbody.innerHTML = '';
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: #5e6c84;">Nenhum usuário registrado</td></tr>';
        return;
    }
    
    users.forEach(user => {
        const userBoards = JSON.parse(localStorage.getItem(`boards_${user.email}`)) || [];
        const lastAccess = accessLog
            .filter(log => log.email === user.email)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0];
        
        const row = document.createElement('tr');
        const passwordId = `pwd-${user.email.replace(/[@.]/g, '-')}`;
        
        row.innerHTML = `
            <td><strong>${user.username}</strong></td>
            <td>${user.email}</td>
            <td>
                <span id="${passwordId}" style="filter: blur(5px); user-select: none;">••••••••</span>
                <button class="btn btn-sm" onclick="togglePassword('${passwordId}', '${user.password}')" 
                        style="padding: 0.2rem 0.5rem; margin-left: 0.5rem;" title="Mostrar/Ocultar senha">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
            <td>${formatDate(user.createdAt)}</td>
            <td>${lastAccess ? formatDateTime(lastAccess.timestamp) : 'Nunca'}</td>
            <td><span class="badge badge-success">${userBoards.length} quadros</span></td>
            <td>
                <button class="btn btn-primary btn-sm" onclick="viewUserDetails('${user.email}')">
                    <i class="fas fa-info-circle"></i> Detalhes
                </button>
                <button class="btn btn-warning btn-sm" onclick="viewUserBoards('${user.email}')">
                    <i class="fas fa-th-large"></i> Quadros
                </button>
                <button class="btn btn-danger btn-sm" onclick="deleteUser('${user.email}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function filterUsers() {
    const query = document.getElementById('user-search').value.toLowerCase();
    const rows = document.querySelectorAll('#users-table-body tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(query) ? '' : 'none';
    });
}

function togglePassword(elementId, password) {
    const element = document.getElementById(elementId);
    const button = element.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (element.style.filter === 'blur(5px)') {
        // Mostrar senha
        element.textContent = password;
        element.style.filter = 'none';
        element.style.userSelect = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        // Ocultar senha
        element.textContent = '••••••••';
        element.style.filter = 'blur(5px)';
        element.style.userSelect = 'none';
        icon.className = 'fas fa-eye';
    }
}

function viewUserDetails(email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email);
    
    if (!user) return;
    
    const userBoards = JSON.parse(localStorage.getItem(`boards_${email}`)) || [];
    const accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    const userAccess = accessLog.filter(log => log.email === email);
    
    // Criar modal moderno para detalhes
    showUserDetailsModal(user, userBoards, userAccess);
}

function showUserDetailsModal(user, userBoards, userAccess) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('user-details-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Ordenar acessos por data
    const sortedAccess = userAccess.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const lastAccess = sortedAccess[0];
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'user-details-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 16px;
        padding: 0;
        max-width: 700px;
        width: 90%;
        max-height: 85vh;
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
        animation: slideUp 0.3s ease;
        display: flex;
        flex-direction: column;
    `;
    
    modalContent.innerHTML = `
        <!-- Header -->
        <div style="
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            position: relative;
        ">
            <button onclick="closeUserDetailsModal()" style="
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.2rem;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            " onmouseover="this.style.background='rgba(255, 255, 255, 0.3)'; this.style.transform='rotate(90deg)'" 
               onmouseout="this.style.background='rgba(255, 255, 255, 0.2)'; this.style.transform='rotate(0)'">
                <i class="fas fa-times"></i>
            </button>
            
            <div style="display: flex; align-items: center; gap: 1.5rem;">
                <div style="
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 2rem;
                    font-weight: 600;
                    color: #667eea;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                ">
                    ${user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h2 style="margin: 0; font-size: 1.8rem;">${user.username}</h2>
                    <p style="margin: 0.5rem 0 0 0; opacity: 0.9;">
                        <i class="fas fa-envelope"></i> ${user.email}
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Content -->
        <div style="
            padding: 2rem; 
            overflow-y: auto; 
            flex: 1;
            min-height: 0;
        ">
            <!-- Informações Principais -->
            <div style="
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                margin-bottom: 2rem;
            ">
                <div style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    padding: 1.5rem;
                    border-radius: 12px;
                    color: white;
                ">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">
                        <i class="fas fa-key"></i> Senha
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 600;">
                        ${user.password}
                    </div>
                </div>
                
                <div style="
                    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                    padding: 1.5rem;
                    border-radius: 12px;
                    color: white;
                ">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">
                        <i class="fas fa-th-large"></i> Quadros
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 600;">
                        ${userBoards.length}
                    </div>
                </div>
                
                <div style="
                    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                    padding: 1.5rem;
                    border-radius: 12px;
                    color: white;
                ">
                    <div style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 0.5rem;">
                        <i class="fas fa-sign-in-alt"></i> Acessos
                    </div>
                    <div style="font-size: 1.5rem; font-weight: 600;">
                        ${userAccess.length}
                    </div>
                </div>
            </div>
            
            <!-- Informações Detalhadas -->
            <div style="
                background: #f9fafc;
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1.5rem;
            ">
                <h3 style="margin: 0 0 1rem 0; color: #172b4d; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-info-circle"></i> Informações da Conta
                </h3>
                <div style="display: grid; gap: 1rem;">
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: white; border-radius: 8px;">
                        <span style="color: #5e6c84; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-calendar-plus"></i> Data de Criação
                        </span>
                        <strong style="color: #172b4d;">${formatDateTime(user.createdAt)}</strong>
                    </div>
                    <div style="display: flex; justify-content: space-between; padding: 0.75rem; background: white; border-radius: 8px;">
                        <span style="color: #5e6c84; display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fas fa-clock"></i> Último Acesso
                        </span>
                        <strong style="color: #172b4d;">${lastAccess ? formatDateTime(lastAccess.timestamp) : 'Nunca'}</strong>
                    </div>
                </div>
            </div>
            
            <!-- Quadros Criados -->
            <div style="
                background: #f9fafc;
                border-radius: 12px;
                padding: 1.5rem;
            ">
                <h3 style="margin: 0 0 1rem 0; color: #172b4d; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fas fa-clipboard-list"></i> Quadros Criados (${userBoards.length})
                </h3>
                ${userBoards.length > 0 ? `
                    <div style="display: grid; gap: 0.75rem;">
                        ${userBoards.map((board, i) => `
                            <div style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 1rem;
                                background: white;
                                border-radius: 8px;
                                border-left: 4px solid ${i % 2 === 0 ? '#667eea' : '#f5576c'};
                                transition: all 0.3s;
                                cursor: pointer;
                            " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'" 
                               onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'"
                               onclick="openUserBoard('${user.email}', '${board.id}')">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: #172b4d; margin-bottom: 0.25rem;">
                                        ${i + 1}. ${board.name}
                                    </div>
                                    <div style="font-size: 0.85rem; color: #5e6c84;">
                                        <i class="fas fa-list"></i> ${board.lists?.length || 0} listas
                                        ${board.starred ? '<i class="fas fa-star" style="color: #f2d600; margin-left: 0.5rem;"></i>' : ''}
                                    </div>
                                </div>
                                <button onclick="event.stopPropagation(); openUserBoard('${user.email}', '${board.id}')" style="
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: white;
                                    border: none;
                                    padding: 0.5rem 1rem;
                                    border-radius: 6px;
                                    cursor: pointer;
                                    font-weight: 600;
                                    transition: all 0.3s;
                                " onmouseover="this.style.transform='scale(1.05)'" 
                                   onmouseout="this.style.transform='scale(1)'">
                                    <i class="fas fa-external-link-alt"></i> Abrir
                                </button>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div style="
                        text-align: center;
                        padding: 2rem;
                        color: #5e6c84;
                    ">
                        <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p style="margin: 0;">Nenhum quadro criado ainda</p>
                    </div>
                `}
            </div>
        </div>
        
        <!-- Footer com ações -->
        <div style="
            padding: 1.5rem 2rem;
            background: #f9fafc;
            border-top: 1px solid #e0e0e0;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            flex-shrink: 0;
        ">
            <button onclick="viewUserBoards('${user.email}')" style="
                background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                color: white;
                border: none;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 5px 15px rgba(79, 172, 254, 0.4)'" 
               onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
                <i class="fas fa-th-large"></i>
                <span>Ver Todos os Quadros</span>
            </button>
            
            <button onclick="closeUserDetailsModal()" style="
                background: white;
                color: #5e6c84;
                border: 2px solid #e0e0e0;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            " onmouseover="this.style.background='#f4f5f7'; this.style.borderColor='#d0d0d0'; this.style.transform='translateY(-2px)'" 
               onmouseout="this.style.background='white'; this.style.borderColor='#e0e0e0'; this.style.transform='translateY(0)'">
                <i class="fas fa-times"></i>
                <span>Fechar</span>
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeUserDetailsModal();
        }
    });
}

function closeUserDetailsModal() {
    const modal = document.getElementById('user-details-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function viewUserBoards(email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email);
    
    if (!user) {
        // ALERTA REMOVIDO
        return;
    }
    
    const userBoards = JSON.parse(localStorage.getItem(`boards_${email}`)) || [];
    
    if (userBoards.length === 0) {
        // ALERTA REMOVIDO
        return;
    }
    
    // Criar modal para mostrar os quadros
    showUserBoardsModal(user, userBoards);
}

function showUserBoardsModal(user, boards) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('user-boards-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // Criar modal
    const modal = document.createElement('div');
    modal.id = 'user-boards-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 900px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        animation: slideUp 0.3s ease;
    `;
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 2px solid #f4f5f7; padding-bottom: 1rem;">
            <div>
                <h2 style="margin: 0; color: #172b4d;">
                    <i class="fas fa-th-large"></i> Quadros de ${user.username}
                </h2>
                <p style="margin: 0.5rem 0 0 0; color: #5e6c84;">
                    <i class="fas fa-envelope"></i> ${user.email}
                </p>
            </div>
            <button onclick="closeUserBoardsModal()" style="
                background: none;
                border: none;
                font-size: 1.5rem;
                cursor: pointer;
                color: #5e6c84;
                padding: 0.5rem;
                border-radius: 6px;
                transition: all 0.3s;
            " onmouseover="this.style.background='#f4f5f7'; this.style.color='#172b4d';" 
               onmouseout="this.style.background='none'; this.style.color='#5e6c84';">
                <i class="fas fa-times"></i>
            </button>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem;">
            ${boards.map(board => `
                <div style="
                    border-radius: 8px;
                    overflow: hidden;
                    cursor: pointer;
                    transition: all 0.3s;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                " onmouseover="this.style.transform='translateY(-5px)'; this.style.boxShadow='0 5px 20px rgba(0, 0, 0, 0.2)';" 
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(0, 0, 0, 0.1)';"
                   onclick="openUserBoard('${user.email}', '${board.id}')">
                    <div style="
                        background: ${getBoardBackground(board.background)};
                        height: 120px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-weight: 600;
                        font-size: 1.1rem;
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                        padding: 1rem;
                        text-align: center;
                    ">
                        ${board.name}
                    </div>
                    <div style="padding: 1rem; background: white;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: #5e6c84; font-size: 0.85rem;">
                                <i class="fas fa-list"></i> ${board.lists?.length || 0} listas
                            </span>
                            ${board.starred ? '<i class="fas fa-star" style="color: #f2d600;"></i>' : ''}
                        </div>
                        <div style="color: #5e6c84; font-size: 0.85rem;">
                            <i class="fas fa-clock"></i> ${formatDate(board.lastViewed)}
                        </div>
                        <button onclick="event.stopPropagation(); openUserBoard('${user.email}', '${board.id}')" style="
                            width: 100%;
                            margin-top: 0.75rem;
                            padding: 0.5rem;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                            color: white;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-weight: 600;
                            transition: all 0.3s;
                        " onmouseover="this.style.transform='scale(1.05)'" 
                           onmouseout="this.style.transform='scale(1)'">
                            <i class="fas fa-external-link-alt"></i> Abrir Quadro
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
        
        <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #f4f5f7; text-align: center;">
            <p style="color: #5e6c84; margin: 0;">
                Total: <strong style="color: #172b4d;">${boards.length}</strong> quadro(s)
            </p>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeUserBoardsModal();
        }
    });
}

function closeUserBoardsModal() {
    const modal = document.getElementById('user-boards-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
}

function openUserBoard(userEmail, boardId) {
    // Salvar usuário atual (admin) para voltar depois
    const currentAdmin = JSON.parse(localStorage.getItem('loggedUser'));
    localStorage.setItem('admin-temp', JSON.stringify(currentAdmin));
    
    // Buscar usuário do board
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === userEmail);
    
    if (!user) {
        // ALERTA REMOVIDO
        return;
    }
    
    // Fazer login temporário como o usuário
    localStorage.setItem('loggedUser', JSON.stringify(user));
    
    // Salvar o board ID
    localStorage.setItem(`currentBoardId_${userEmail}`, boardId);
    
    // Adicionar flag para indicar visualização admin
    localStorage.setItem('admin-viewing', 'true');
    
    // Redirecionar para o dashboard
    window.location.href = 'dashboard.html';
}

function deleteUser(email) {
    if (!confirm(`Tem certeza que deseja excluir este usuário?\n\nIsso irá apagar todos os seus dados, quadros e workspaces.`)) {
        return;
    }
    
    // Remover usuário
    let users = JSON.parse(localStorage.getItem('users')) || [];
    users = users.filter(u => u.email !== email);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Remover boards do usuário
    localStorage.removeItem(`boards_${email}`);
    localStorage.removeItem(`currentBoardId_${email}`);
    
    // Remover do access log
    let accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    accessLog = accessLog.filter(log => log.email !== email);
    localStorage.setItem('user-access-log', JSON.stringify(accessLog));
    
    // ALERTA REMOVIDO
    loadUsersData();
    loadDashboardData();
}

// ============================================
// ACCESS LOG
// ============================================
function loadAccessLog() {
    const accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    const tbody = document.getElementById('access-log-table-body');
    
    tbody.innerHTML = '';
    
    if (accessLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: #5e6c84;">Nenhum acesso registrado</td></tr>';
        return;
    }
    
    const sortedLog = accessLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    sortedLog.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td><strong>${log.username}</strong></td>
            <td>${log.email}</td>
            <td><span class="badge badge-success">${log.action}</span></td>
            <td>N/A</td>
        `;
        tbody.appendChild(row);
    });
}

function filterAccessLog() {
    const actionFilter = document.getElementById('access-filter').value;
    const dateFilter = document.getElementById('access-date-filter').value;
    const rows = document.querySelectorAll('#access-log-table-body tr');
    
    rows.forEach(row => {
        let show = true;
        
        if (actionFilter !== 'all') {
            const action = row.children[3].textContent.toLowerCase();
            if (!action.includes(actionFilter)) {
                show = false;
            }
        }
        
        if (dateFilter) {
            const rowDate = row.children[0].textContent.split(' ')[0];
            const filterDate = new Date(dateFilter).toLocaleDateString('pt-BR');
            if (rowDate !== filterDate) {
                show = false;
            }
        }
        
        row.style.display = show ? '' : 'none';
    });
}

// ============================================
// BOARDS
// ============================================
function loadAllBoards() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const container = document.getElementById('all-boards-grid');
    
    container.innerHTML = '';
    
    let totalBoards = 0;
    
    users.forEach(user => {
        const userBoards = JSON.parse(localStorage.getItem(`boards_${user.email}`)) || [];
        
        userBoards.forEach(board => {
            totalBoards++;
            const card = document.createElement('div');
            card.className = 'board-card-admin';
            card.innerHTML = `
                <div class="board-preview" style="background: ${getBoardBackground(board.background)}"></div>
                <div class="board-info">
                    <h4>${board.name}</h4>
                    <p>Criado por: ${user.username}</p>
                    <p>Listas: ${board.lists?.length || 0}</p>
                </div>
            `;
            container.appendChild(card);
        });
    });
    
    if (totalBoards === 0) {
        container.innerHTML = '<p style="color: #5e6c84; padding: 2rem;">Nenhum quadro criado ainda</p>';
    }
}

function filterBoards() {
    const query = document.getElementById('board-search').value.toLowerCase();
    const cards = document.querySelectorAll('.board-card-admin');
    
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? '' : 'none';
    });
}

function getBoardBackground(background) {
    const backgrounds = {
        gradient1: 'linear-gradient(45deg, #667eea, #764ba2)',
        gradient2: 'linear-gradient(45deg, #f093fb, #f5576c)',
        gradient3: 'linear-gradient(45deg, #4facfe, #00f2fe)',
        gradient4: 'linear-gradient(45deg, #43e97b, #38f9d7)',
        gradient5: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
        gradient6: 'linear-gradient(45deg, #a8edea, #fed6e3)'
    };
    return backgrounds[background] || backgrounds.gradient1;
}

// ============================================
// WORKSPACES
// ============================================
function loadAllWorkspaces() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userWorkspaces = JSON.parse(localStorage.getItem('user-workspaces')) || [];
    const container = document.getElementById('workspaces-list');
    
    container.innerHTML = '';
    
    // Workspaces padrão dos usuários
    users.forEach(user => {
        const userBoards = JSON.parse(localStorage.getItem(`boards_${user.email}`)) || [];
        
        const card = document.createElement('div');
        card.className = 'workspace-card-admin';
        card.innerHTML = `
            <div class="workspace-header-admin">
                <div class="workspace-avatar-admin">${user.username.charAt(0).toUpperCase()}</div>
                <div class="workspace-info-admin">
                    <h3>${user.username} - Workspace</h3>
                    <p>${user.email} • ${userBoards.length} quadros</p>
                </div>
            </div>
            <div class="workspace-boards">
                ${userBoards.map(board => `
                    <div class="board-preview" onclick="openUserBoard('${user.email}', '${board.id}')" 
                         style="background: ${getBoardBackground(board.background)}; height: 80px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                         onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)'" 
                         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
                         title="Clique para abrir este quadro">
                        ${board.name}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
    
    // Workspaces customizados
    userWorkspaces.forEach(workspace => {
        // Encontrar o usuário dono do workspace
        let ownerEmail = 'unknown';
        users.forEach(user => {
            const userWorkspacesData = JSON.parse(localStorage.getItem('user-workspaces')) || [];
            // Assumir que o primeiro usuário é o dono (pode ser melhorado)
            if (userWorkspacesData.length > 0) {
                ownerEmail = users[0].email; // Simplificação
            }
        });
        
        const card = document.createElement('div');
        card.className = 'workspace-card-admin';
        card.innerHTML = `
            <div class="workspace-header-admin">
                <div class="workspace-avatar-admin">${workspace.name.charAt(0).toUpperCase()}</div>
                <div class="workspace-info-admin">
                    <h3>${workspace.name}</h3>
                    <p>Workspace Customizado • ${workspace.boards?.length || 0} quadros</p>
                </div>
            </div>
            <div class="workspace-boards">
                ${(workspace.boards || []).map(board => `
                    <div class="board-preview" onclick="openUserBoard('${ownerEmail}', '${board.id}')" 
                         style="background: ${getBoardBackground(board.background)}; height: 80px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; cursor: pointer; transition: all 0.3s;"
                         onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 5px 15px rgba(0,0,0,0.3)'" 
                         onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none'"
                         title="Clique para abrir este quadro">
                        ${board.name}
                    </div>
                `).join('')}
            </div>
        `;
        container.appendChild(card);
    });
    
    if (users.length === 0 && userWorkspaces.length === 0) {
        container.innerHTML = '<p style="color: #5e6c84; padding: 2rem;">Nenhum workspace criado</p>';
    }
}

// ============================================
// SETTINGS
// ============================================
function loadSettings() {
    // Calculate storage usage
    let totalSize = 0;
    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            totalSize += localStorage[key].length + key.length;
        }
    }
    
    const sizeInKB = (totalSize / 1024).toFixed(2);
    document.getElementById('storage-used').textContent = `${sizeInKB} KB`;
    
    // Last backup
    const lastBackup = localStorage.getItem('last-backup');
    document.getElementById('last-backup').textContent = lastBackup ? formatDateTime(lastBackup) : 'Nunca';
}

function exportData() {
    const data = {
        users: JSON.parse(localStorage.getItem('users')) || [],
        accessLog: JSON.parse(localStorage.getItem('user-access-log')) || [],
        workspaces: JSON.parse(localStorage.getItem('user-workspaces')) || [],
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `florense-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    localStorage.setItem('last-backup', new Date().toISOString());
    // ALERTA REMOVIDO
    loadSettings();
}

function clearAllData() {
    if (!confirm('⚠️ ATENÇÃO!\n\nIsso irá apagar TODOS os dados do sistema:\n- Todos os usuários\n- Todos os quadros\n- Todos os workspaces\n- Todo o histórico\n\nEsta ação é IRREVERSÍVEL!\n\nDeseja realmente continuar?')) {
        return;
    }
    
    if (!confirm('Última confirmação: Tem CERTEZA ABSOLUTA?')) {
        return;
    }
    
    localStorage.clear();
    // ALERTA REMOVIDO
    window.location.href = 'login.html';
}

function changeAdminPassword() {
    const currentPassword = prompt('Digite a senha atual do admin:');
    if (currentPassword !== 'admin123') {
        // ALERTA REMOVIDO
        return;
    }
    
    const newPassword = prompt('Digite a nova senha:');
    if (!newPassword || newPassword.length < 6) {
        // ALERTA REMOVIDO
        return;
    }
    
    const confirmPassword = prompt('Confirme a nova senha:');
    if (newPassword !== confirmPassword) {
        // ALERTA REMOVIDO
        return;
    }
    
    // ALERTA REMOVIDO
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
}

function logout() {
    console.log('🚪 Fazendo logout...');
    
    // Logout do Firebase
    auth.signOut()
        .then(() => {
            console.log('✅ Logout concluído');
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        })
        .catch((error) => {
            console.error('❌ Erro ao fazer logout:', error);
            // ALERTA REMOVIDO
        });
}

// Make functions global
window.viewUserDetails = viewUserDetails;
window.closeUserDetailsModal = closeUserDetailsModal;
window.viewUserBoards = viewUserBoards;
window.togglePassword = togglePassword;
window.openUserBoard = openUserBoard;
window.closeUserBoardsModal = closeUserBoardsModal;
window.deleteUser = deleteUser;
window.exportData = exportData;
window.clearAllData = clearAllData;
window.changeAdminPassword = changeAdminPassword;

