// ============================================
// CONFIGURAÇÃO DO FIREBASE - FLORENSE PROJECT
// ============================================

// Configuração do Firebase (substitua com suas credenciais do console Firebase)
const firebaseConfig = {
    apiKey: "AIzaSyDhpF6Q6fHt_U9NGZfEV6fnu8TXJeR9z24",
    authDomain: "florense-project.firebaseapp.com",
    projectId: "florense-project",
    storageBucket: "florense-project.firebasestorage.app",
    messagingSenderId: "35635953727",
    appId: "1:35635953727:web:9d3ccbe7026323dbc8f88a",
    measurementId: "G-Y3VP7YRHEL"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);

// Inicializar serviços
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
// const analytics = firebase.analytics(); // Desabilitado temporariamente para debug

// Configurações do Firestore
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// PERSISTÊNCIA DESABILITADA para evitar problemas de redirecionamento
// db.enablePersistence()
//     .catch((err) => {
//         if (err.code === 'failed-precondition') {
//             console.warn('Persistência falhou: múltiplas abas abertas');
//         } else if (err.code === 'unimplemented') {
//             console.warn('Navegador não suporta persistência');
//         }
//     });

// Configuração de idioma para português
auth.languageCode = 'pt-BR';

// Exportar para uso global
window.firebaseApp = app;
window.auth = auth;
window.db = db;
window.storage = storage;

console.log('✅ Firebase inicializado com sucesso!');
