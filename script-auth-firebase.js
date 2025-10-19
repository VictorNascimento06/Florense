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
// FUNÇÃO: ENVIAR EMAIL DE BOAS-VINDAS
// ============================================
function enviarEmailBoasVindas(username, password, email) {
    const templateParams = {
        to_name: username,
        user_password: password,
        to_email: email
    };

    emailjs.send('service_4bk2wwi', 'template_k4q0kfq', templateParams)
        .then(function(response) {
            console.log('✅ Email enviado!', response.status, response.text);
            alert('Cadastro realizado! Verifique seu e-mail.');
            window.location.href = "trello-home.html";
        }, function(error) {
            console.error('❌ Erro ao enviar email:', error);
            alert('Cadastro realizado, mas houve um problema ao enviar o e-mail.');
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
            
            // Mostrar mensagem de sucesso e redirecionar
            alert('✅ Cadastro realizado com sucesso!\n\nVocê será redirecionado para fazer login.');
            registerForm.reset();
            
            // Redirecionar para o login após 2 segundos
            setTimeout(() => {
                // Trocar para o formulário de login
                container.classList.remove('active');
            }, 2000);
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
