const container = document.querySelector('.container');
const loginBtn = document.querySelector('.login-btn');
const registerBtn = document.querySelector('.register-btn');

// Seleciona os formulários
const registerForm = document.querySelector('.form-box.register form');
const loginForm = document.querySelector('.form-box.login form');

registerBtn.addEventListener('click', () => {
    container.classList.add('active');
});
loginBtn.addEventListener('click', () => {
    container.classList.remove('active');
});

// Salvar cadastro
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs = registerForm.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const email = inputs[1].value.trim();
    const emailRepeat = inputs[2].value.trim();
    const password = inputs[3].value;
    const passwordRepeat = inputs[4].value;

    // Validação simples
    if (email !== emailRepeat) {
        alert('Os e-mails não coincidem!');
        return;
    }
    if (password !== passwordRepeat) {
        alert('As senhas não coincidem!');
        return;
    }

    // Salva usuário no localStorage
    let users = JSON.parse(localStorage.getItem('users')) || [];
    // Verifica se já existe o usuário
    if (users.some(u => u.username === username)) {
        alert('Usuário já cadastrado!');
        return;
    }
    const newUser = { 
        username, 
        email, 
        password,
        createdAt: new Date().toISOString(),
        isAdmin: false
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Login automático
    newUser.loginTime = new Date().toISOString();
    localStorage.setItem('loggedUser', JSON.stringify(newUser));
    
    // Registrar primeiro acesso
    registerUserAccess(newUser);

    enviarEmailBoasVindas(username, password, email); // Só chama aqui
    registerForm.reset();
    // NÃO coloque window.location.href aqui!
});

// Login
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const inputs = loginForm.querySelectorAll('input');
    const username = inputs[0].value.trim();
    const password = inputs[1].value;

    // Verificar se é o admin
    if (username === 'admin' && password === 'admin123') {
        const adminUser = {
            username: 'admin',
            email: 'admin@florense.com',
            isAdmin: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('loggedUser', JSON.stringify(adminUser));
        
        // Registrar acesso do admin
        registerUserAccess(adminUser);
        
        window.location.href = "admin.html";
        return;
    }

    let users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => (u.username === username || u.email === username) && u.password === password);

    if (user) {
        // Adicionar timestamp de login
        user.loginTime = new Date().toISOString();
        user.isAdmin = false;
        
        localStorage.setItem('loggedUser', JSON.stringify(user));
        
        // Registrar acesso do usuário
        registerUserAccess(user);
        
        window.location.href = "trello-home.html";
    } else {
        alert('Usuário ou senha incorretos!');
    }
});

// Se digitar "resetar-tudo" no campo de usuário do login, apaga tudo
loginForm.addEventListener('submit', function(e) {
    const inputs = loginForm.querySelectorAll('input');
    const username = inputs[0].value.trim();
    if (username === 'resetar-tudo') {
        e.preventDefault();
        if (confirm('Deseja realmente apagar TODOS os dados do sistema?')) {
            localStorage.clear();
            alert('Todos os dados foram apagados!');
            location.reload();
        }
        return;
    }
}, true); // Use captura para garantir que pega antes do outro listener

function enviarEmailBoasVindas(usuario, senha, email) {
  emailjs.send("service_8p4opzm", "template_ovrpc2h", {
    email: email,
    usuario: usuario,
    senha: senha
  })
  .then(function(response) {
    // alert("E-mail de boas-vindas enviado!"); // Remova o alert se não quiser mostrar
    window.location.href = "trello-home.html";   // Redireciona só depois do envio
  }, function(error) {
    alert("Erro ao enviar e-mail: " + error.text);
  });
}

// Função para registrar acessos dos usuários
function registerUserAccess(user) {
    let accessLog = JSON.parse(localStorage.getItem('user-access-log')) || [];
    
    accessLog.push({
        username: user.username,
        email: user.email,
        timestamp: new Date().toISOString(),
        action: 'login',
        isAdmin: user.isAdmin || false
    });
    
    // Manter apenas os últimos 1000 acessos para não sobrecarregar
    if (accessLog.length > 1000) {
        accessLog = accessLog.slice(-1000);
    }
    
    localStorage.setItem('user-access-log', JSON.stringify(accessLog));
}