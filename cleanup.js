// ============================================
// SCRIPT DE LIMPEZA E VALIDAÇÃO DE DADOS
// ============================================

(function() {
    console.log('🧹 Executando limpeza e validação...');
    
    // 1. Verificar e limpar dados corrompidos
    try {
        const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || 'null');
        
        if (loggedUser) {
            console.log('👤 Usuário encontrado:', loggedUser);
            
            // Verificar campos obrigatórios
            if (!loggedUser.email || !loggedUser.email.includes('@')) {
                console.warn('⚠️ Email inválido, limpando dados...');
                localStorage.clear();
                sessionStorage.clear();
                
                // Só redirecionar se não estiver na página de login
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = 'login.html';
                }
                return;
            }
            
            // Normalizar estrutura de dados
            let updated = false;
            
            // Converter username para fullName (se ainda não foi convertido)
            if (loggedUser.username && !loggedUser.fullName) {
                loggedUser.fullName = loggedUser.username;
                delete loggedUser.username; // Remover campo antigo
                updated = true;
            }
            
            // Garantir que fullName existe
            if (!loggedUser.fullName) {
                loggedUser.fullName = loggedUser.email.split('@')[0];
                updated = true;
            }
            
            // Salvar se houve atualização
            if (updated) {
                localStorage.setItem('loggedUser', JSON.stringify(loggedUser));
                console.log('✅ Dados normalizados:', loggedUser);
            }
            
            console.log('✅ Usuário válido:', loggedUser.fullName, '-', loggedUser.email);
        } else {
            console.log('ℹ️ Nenhum usuário logado');
            
            // Se não está na página de login, redirecionar
            if (!window.location.pathname.includes('login.html')) {
                console.log('🔄 Redirecionando para login...');
                window.location.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('❌ Erro ao validar dados:', error);
        
        // Em caso de erro, limpar tudo
        localStorage.clear();
        sessionStorage.clear();
        
        if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }
    
    // 2. Limpar dados de usuários antigos do array 'users'
    try {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        if (users.length > 0) {
            console.log(`📋 Encontrados ${users.length} usuários no sistema`);
            
            // Normalizar todos os usuários
            const normalizedUsers = users.map(user => {
                if (user.username && !user.fullName) {
                    user.fullName = user.username;
                    delete user.username;
                }
                return user;
            });
            
            localStorage.setItem('users', JSON.stringify(normalizedUsers));
            console.log('✅ Array de usuários normalizado');
        }
    } catch (error) {
        console.warn('⚠️ Erro ao normalizar array de usuários:', error);
    }
    
    console.log('✅ Limpeza e validação concluída!');
})();
