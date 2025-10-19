// ============================================
// SCRIPT PRINCIPAL - LOGIN E CADASTRO COM FIREBASE
// ============================================

// Aguardar carregamento do DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Iniciando script de autenticação...');
    
    // Verificar se Firebase está carregado
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase não está carregado!');
        alert('Erro ao carregar sistema. Recarregue a página.');
        return;
    }
    
    if (typeof firebaseService === 'undefined') {
        console.error('❌ Firebase Service não está carregado!');
        alert('Erro ao carregar serviços. Recarregue a página.');
        return;
    }
    
    console.log('✅ Firebase carregado com sucesso!');
    
    const container = document.querySelector('.container');
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');

    // Seleciona os formulários
    const registerForm = document.querySelector('.form-box.register form');
    const loginForm = document.querySelector('.form-box.login form');

    if (!container || !loginBtn || !registerBtn || !registerForm || !loginForm) {
        console.error('❌ Elementos do formulário não encontrados!');
        return;
    }

    // Alternância entre formulários
    registerBtn.addEventListener('click', () => {
        container.classList.add('active');
    });

    loginBtn.addEventListener('click', () => {
        container.classList.remove('active');
    });

// ============================================
// FUNÇÃO: ENVIAR EMAIL DE BOAS-VINDAS COM FORMSPREE
// ============================================
function enviarEmailBoasVindas(username, password, email) {
    console.log('📧 Preparando envio de email via Formspree...');
    console.log('📊 Dados:', { username, email });
    
    // Dados do email
    const emailData = {
        email: email,
        message: `Olá ${username}!\n\nSeu cadastro no Sistema Florense foi realizado com sucesso!\n\n👤 Nome: ${username}\n📧 Email: ${email}\n🔑 Senha: ${password}\n\nGuarde essas informações em um local seguro.\n\nBem-vindo(a) ao Sistema Florense!\n\nAcesse: https://victornascimento06.github.io/Florense/`
    };

    console.log('📤 Enviando email via Formspree...');

    // Enviar via Formspree
    fetch('https://formspree.io/f/mblzbyrc', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    })
    .then(response => {
        if (response.ok) {
            console.log('✅ Email enviado com sucesso via Formspree!');
            alert('✅ Cadastro realizado com sucesso!\n\n📧 Verifique seu e-mail para as credenciais de acesso.');
            window.location.href = "trello-home.html";
        } else {
            throw new Error('Erro ao enviar email');
        }
    })
    .catch(error => {
        console.error('❌ ERRO ao enviar email via Formspree:', error);
        
        // FALLBACK: Mostrar credenciais na tela
        alert(`✅ Cadastro realizado com sucesso!\n\n⚠️ O email não pôde ser enviado.\n\n👤 Nome: ${username}\n📧 Email: ${email}\n🔑 Senha: ${password}\n\n⚠️ ANOTE SUAS CREDENCIAIS!\n\nVocê será redirecionado...`);
        window.location.href = "trello-home.html";
    });
}

// ============================================
// CADASTRO DE USUÁRIO (FIREBASE)
// ============================================
registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const inputs = registerForm.querySelectorAll('input');
    const fullName = inputs[0].value.trim(); // Nome e Sobrenome
    const email = inputs[1].value.trim();
    const emailRepeat = inputs[2].value.trim();
    const password = inputs[3].value;
    const passwordRepeat = inputs[4].value;

    // Validações
    if (email !== emailRepeat) {
        alert('Os e-mails não coincidem!');
        return;
    }
    if (password !== passwordRepeat) {
        alert('As senhas não coincidem!');
        return;
    }
    if (password.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return;
    }

    // Mostrar loading
    const submitBtn = registerForm.querySelector('.btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Cadastrando...';
    submitBtn.disabled = true;

    try {
        console.log('📝 Tentando cadastrar:', { fullName, email });
        
        // Registrar usuário no Firebase SOMENTE
        const result = await firebaseService.registerUser(fullName, email, password);

        console.log('📊 Resultado do cadastro:', result);

        if (result.success) {
            console.log('✅ Usuário cadastrado no Firebase:', result.user);
            
            // SALVAR DADOS DO USUÁRIO NO LOCALSTORAGE
            const userData = {
                email: result.user.email,
                fullName: fullName,
                username: fullName,
                photo: null,
                uid: result.user.uid,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('loggedUser', JSON.stringify(userData));
            console.log('✅ Dados salvos no localStorage:', userData);
            
            // Enviar email de boas-vindas
            console.log('📧 Enviando email de boas-vindas...');
            enviarEmailBoasVindas(fullName, password, email);
            
            // Nota: o redirecionamento acontece dentro da função enviarEmailBoasVindas
            // após o email ser enviado com sucesso
        } else {
            // Tratar erros específicos
            let errorMessage = 'Erro ao cadastrar usuário.';
            
            console.error('❌ Erro retornado:', result.error);
            
            if (result.error && result.error.code) {
                if (result.error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Este e-mail já está cadastrado!';
                } else if (result.error.code === 'auth/invalid-email') {
                    errorMessage = 'E-mail inválido!';
                } else if (result.error.code === 'auth/weak-password') {
                    errorMessage = 'Senha muito fraca!';
                } else {
                    errorMessage = `Erro: ${result.error.code}\n${result.error.message}`;
                }
            } else {
                errorMessage = `Erro desconhecido:\n${JSON.stringify(result.error)}`;
            }
            
            alert(errorMessage);
            console.error('Mensagem de erro:', errorMessage);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('❌ Erro no cadastro (CATCH):', error);
        console.error('Tipo do erro:', typeof error);
        console.error('Erro completo:', JSON.stringify(error, null, 2));
        
        let errorMessage = 'Erro ao cadastrar usuário.\n\n';
        errorMessage += 'Detalhes técnicos:\n';
        errorMessage += `Tipo: ${error.name || 'Desconhecido'}\n`;
        errorMessage += `Mensagem: ${error.message || 'Sem mensagem'}\n`;
        errorMessage += `Código: ${error.code || 'Sem código'}`;
        
        alert(errorMessage);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// LOGIN DE USUÁRIO (FIREBASE)
// ============================================
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    e.stopPropagation();

    console.log('🔐 Formulário de login submetido');

    const inputs = loginForm.querySelectorAll('input');
    const usernameOrEmail = inputs[0].value.trim();
    const password = inputs[1].value;

    if (!usernameOrEmail || !password) {
        alert('Preencha usuário e senha!');
        return false;
    }

    // Mostrar loading
    const submitBtn = loginForm.querySelector('.btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Entrando...';
    submitBtn.disabled = true;

    try {
        console.log('🔐 Tentando fazer login com Firebase:', usernameOrEmail);
        
        // Login SOMENTE via Firebase
        const result = await firebaseService.loginUser(usernameOrEmail, password);

        console.log('📊 Resultado do login:', result);

        if (result.success) {
            console.log('✅ Login Firebase realizado com sucesso!');
            
            // SALVAR DADOS DO USUÁRIO NO LOCALSTORAGE
            const userData = {
                email: result.user.email,
                fullName: result.user.displayName || result.user.email.split('@')[0],
                username: result.user.displayName || result.user.email.split('@')[0],
                photo: result.user.photoURL || null,
                uid: result.user.uid,
                loginTime: new Date().toISOString()
            };
            
            localStorage.setItem('loggedUser', JSON.stringify(userData));
            console.log('✅ Dados salvos no localStorage:', userData);
            
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            console.log('🔄 Redirecionando para trello-home...');
            window.location.href = "trello-home.html";
            return;
        } else {
            console.error('❌ Erro no login Firebase:', result.error);
            
            let errorMessage = 'Email ou senha incorretos!';
            if (result.error && result.error.code === 'auth/user-not-found') {
                errorMessage = 'Usuário não encontrado. Cadastre-se primeiro!';
            } else if (result.error && result.error.code === 'auth/wrong-password') {
                errorMessage = 'Senha incorreta!';
            }
            
            alert(errorMessage);
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
        
    } catch (error) {
        console.error('❌ Erro no login (CATCH):', error);
        alert('Erro ao fazer login. Tente novamente.');
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// ============================================
// VERIFICAR SE JÁ ESTÁ LOGADO
// ============================================
    // Verificar autenticação do Firebase (SEM redirecionamento automático)
    auth.onAuthStateChanged((user) => {
        if (user) {
            console.log('👤 Usuário detectado:', user.displayName || user.email);
            // NÃO redirecionar automaticamente para evitar loops
        } else {
            console.log('👤 Nenhum usuário logado');
        }
    });
    
    console.log('✅ Script de autenticação carregado!');
}); // Fecha o DOMContentLoaded
