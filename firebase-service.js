// ============================================
// SERVIÇOS FIREBASE - FLORENSE PROJECT
// ============================================

// ============================================
// AUTENTICAÇÃO
// ============================================

/**
 * Registrar novo usuário
 */
async function registerUser(username, email, password) {
    try {
        // Criar usuário no Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Atualizar perfil com nome de usuário
        await user.updateProfile({
            displayName: username
        });

        // Criar documento do usuário no Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            username: username,
            email: email,
            isAdmin: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            photoURL: null,
            workspaces: []
        });

        // Registrar acesso
        await registerUserAccess(user.uid, username, email);

        console.log('✅ Usuário registrado com sucesso!');
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Erro ao registrar usuário:', error);
        return { success: false, error: error };
    }
}

/**
 * Login de usuário
 */
async function loginUser(emailOrUsername, password) {
    try {
        let email = emailOrUsername;

        // Se não for email, buscar email pelo username
        if (!emailOrUsername.includes('@')) {
            const usersSnapshot = await db.collection('users')
                .where('username', '==', emailOrUsername)
                .limit(1)
                .get();

            if (usersSnapshot.empty) {
                throw new Error('Usuário não encontrado');
            }

            email = usersSnapshot.docs[0].data().email;
        }

        // Login no Firebase Auth
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        const user = userCredential.user;

        // Atualizar último login
        await db.collection('users').doc(user.uid).update({
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Registrar acesso
        await registerUserAccess(user.uid, user.displayName, user.email);

        console.log('✅ Login realizado com sucesso!');
        return { success: true, user: user };
    } catch (error) {
        console.error('❌ Erro ao fazer login:', error);
        return { success: false, error: error };
    }
}

/**
 * Logout de usuário
 */
async function logoutUser() {
    try {
        await auth.signOut();
        console.log('✅ Logout realizado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao fazer logout:', error);
        return { success: false, error: error };
    }
}

/**
 * Buscar perfil do usuário
 */
async function getUserProfile(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        
        if (!userDoc.exists) {
            console.warn('⚠️ Usuário não encontrado no Firestore');
            return { success: false, error: 'Usuário não encontrado' };
        }
        
        const userData = userDoc.data();
        console.log('✅ Perfil carregado do Firestore:', userData.username);
        
        return { 
            success: true, 
            user: userData 
        };
    } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return { success: false, error: error };
    }
}

/**
 * Atualizar perfil do usuário
 */
async function updateUserProfile(uid, profileData) {
    try {
        await db.collection('users').doc(uid).update({
            username: profileData.name,
            phone: profileData.phone || '',
            bio: profileData.bio || '',
            profilePhoto: profileData.photo || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        console.log('✅ Perfil atualizado no Firestore!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar perfil:', error);
        return { success: false, error: error };
    }
}

/**
 * Recuperar senha
 */
async function resetPassword(email) {
    try {
        await auth.sendPasswordResetEmail(email);
        console.log('✅ Email de recuperação enviado!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao enviar email de recuperação:', error);
        return { success: false, error: error };
    }
}

/**
 * Obter usuário atual
 */
function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Verificar se usuário é admin
 */
async function isUserAdmin(uid) {
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data().isAdmin === true;
    } catch (error) {
        console.error('❌ Erro ao verificar admin:', error);
        return false;
    }
}

// ============================================
// WORKSPACES (ESPAÇOS DE TRABALHO)
// ============================================

/**
 * Criar novo workspace
 */
async function createWorkspace(name, description, backgroundUrl = null) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const workspaceData = {
            name: name,
            description: description || '',
            backgroundUrl: backgroundUrl,
            ownerId: user.uid,
            members: [user.uid],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const workspaceRef = await db.collection('workspaces').add(workspaceData);

        // Adicionar workspace ao usuário
        await db.collection('users').doc(user.uid).update({
            workspaces: firebase.firestore.FieldValue.arrayUnion(workspaceRef.id)
        });

        console.log('✅ Workspace criado com sucesso!');
        return { success: true, workspaceId: workspaceRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar workspace:', error);
        return { success: false, error: error };
    }
}

/**
 * Obter workspaces do usuário
 */
async function getUserWorkspaces(userId) {
    try {
        const workspacesSnapshot = await db.collection('workspaces')
            .where('members', 'array-contains', userId)
            .orderBy('updatedAt', 'desc')
            .get();

        const workspaces = [];
        workspacesSnapshot.forEach(doc => {
            workspaces.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, workspaces: workspaces };
    } catch (error) {
        console.error('❌ Erro ao buscar workspaces:', error);
        return { success: false, error: error };
    }
}

/**
 * Atualizar workspace
 */
async function updateWorkspace(workspaceId, updates) {
    try {
        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('workspaces').doc(workspaceId).update(updates);

        console.log('✅ Workspace atualizado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar workspace:', error);
        return { success: false, error: error };
    }
}

/**
 * Deletar workspace
 */
async function deleteWorkspace(workspaceId) {
    try {
        // Deletar todos os boards do workspace
        const boardsSnapshot = await db.collection('boards')
            .where('workspaceId', '==', workspaceId)
            .get();

        const batch = db.batch();
        boardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Deletar o workspace
        batch.delete(db.collection('workspaces').doc(workspaceId));
        await batch.commit();

        console.log('✅ Workspace deletado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar workspace:', error);
        return { success: false, error: error };
    }
}

// ============================================
// BOARDS (QUADROS)
// ============================================

/**
 * Criar novo board
 */
async function createBoard(boardConfig) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Extrair dados do objeto de configuração
        const {
            name,
            background,
            backgroundColor,
            backgroundImage,
            lists = [],
            workspaceName,
            workspaceId = null
        } = boardConfig;

        const boardData = {
            name: name || 'Novo Quadro',
            background: background || 'default',
            backgroundColor: backgroundColor || '#0079bf',
            backgroundImage: backgroundImage || null,
            workspaceId: workspaceId,
            workspaceName: workspaceName || 'Florense Workspace',
            ownerId: user.uid,
            ownerEmail: user.email,
            members: [user.uid],
            sharedWith: [],
            starred: false,
            lists: lists,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastViewed: firebase.firestore.FieldValue.serverTimestamp()
        };

        console.log('📋 Criando board no Firebase:', boardData);

        const boardRef = await db.collection('boards').add(boardData);

        console.log('✅ Board criado com sucesso! ID:', boardRef.id);
        return { success: true, boardId: boardRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar board:', error);
        return { success: false, error: error.message || error };
    }
}

/**
 * Obter boards de um workspace
 */
async function getWorkspaceBoards(workspaceId) {
    try {
        const boardsSnapshot = await db.collection('boards')
            .where('workspaceId', '==', workspaceId)
            .orderBy('updatedAt', 'desc')
            .get();

        const boards = [];
        boardsSnapshot.forEach(doc => {
            boards.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, boards: boards };
    } catch (error) {
        console.error('❌ Erro ao buscar boards:', error);
        return { success: false, error: error };
    }
}

/**
 * Obter board específico
 */
async function getBoard(boardId) {
    try {
        const boardDoc = await db.collection('boards').doc(boardId).get();
        
        if (!boardDoc.exists) {
            throw new Error('Board não encontrado');
        }

        return { success: true, board: { id: boardDoc.id, ...boardDoc.data() } };
    } catch (error) {
        console.error('❌ Erro ao buscar board:', error);
        return { success: false, error: error };
    }
}

/**
 * Atualizar board
 */
async function updateBoard(boardId, updates) {
    try {
        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('boards').doc(boardId).update(updates);

        console.log('✅ Board atualizado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar board:', error);
        return { success: false, error: error };
    }
}

/**
 * Deletar board
 */
async function deleteBoard(boardId) {
    try {
        // Deletar todos os cards do board
        const cardsSnapshot = await db.collection('cards')
            .where('boardId', '==', boardId)
            .get();

        const batch = db.batch();
        cardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        // Deletar o board
        batch.delete(db.collection('boards').doc(boardId));
        await batch.commit();

        console.log('✅ Board deletado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar board:', error);
        return { success: false, error: error };
    }
}

// ============================================
// LISTAS
// ============================================

/**
 * Adicionar lista a um board
 */
async function addList(boardId, listName) {
    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            throw new Error('Board não encontrado');
        }

        const lists = boardDoc.data().lists || [];
        const newList = {
            id: Date.now().toString(),
            name: listName,
            position: lists.length,
            createdAt: new Date().toISOString()
        };

        lists.push(newList);

        await boardRef.update({
            lists: lists,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Lista adicionada com sucesso!');
        return { success: true, list: newList };
    } catch (error) {
        console.error('❌ Erro ao adicionar lista:', error);
        return { success: false, error: error };
    }
}

/**
 * Atualizar nome da lista
 */
async function updateListName(boardId, listId, newName) {
    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            throw new Error('Board não encontrado');
        }

        const lists = boardDoc.data().lists || [];
        const listIndex = lists.findIndex(l => l.id === listId);

        if (listIndex === -1) {
            throw new Error('Lista não encontrada');
        }

        lists[listIndex].name = newName;

        await boardRef.update({
            lists: lists,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Nome da lista atualizado!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar lista:', error);
        return { success: false, error: error };
    }
}

/**
 * Deletar lista
 */
async function deleteList(boardId, listId) {
    try {
        const boardRef = db.collection('boards').doc(boardId);
        const boardDoc = await boardRef.get();

        if (!boardDoc.exists) {
            throw new Error('Board não encontrado');
        }

        const lists = boardDoc.data().lists || [];
        const updatedLists = lists.filter(l => l.id !== listId);

        await boardRef.update({
            lists: updatedLists,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Deletar cards da lista
        const cardsSnapshot = await db.collection('cards')
            .where('boardId', '==', boardId)
            .where('listId', '==', listId)
            .get();

        const batch = db.batch();
        cardsSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        console.log('✅ Lista deletada com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar lista:', error);
        return { success: false, error: error };
    }
}

// ============================================
// CARDS (CARTÕES)
// ============================================

/**
 * Criar card
 */
async function createCard(boardId, listId, title, description = '') {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const cardData = {
            boardId: boardId,
            listId: listId,
            title: title,
            description: description,
            labels: [],
            members: [],
            dueDate: null,
            attachments: [],
            comments: [],
            checklist: [],
            createdBy: user.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        const cardRef = await db.collection('cards').add(cardData);

        // Atualizar board
        await db.collection('boards').doc(boardId).update({
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Card criado com sucesso!');
        return { success: true, cardId: cardRef.id };
    } catch (error) {
        console.error('❌ Erro ao criar card:', error);
        return { success: false, error: error };
    }
}

/**
 * Obter cards de uma lista
 */
async function getListCards(boardId, listId) {
    try {
        const cardsSnapshot = await db.collection('cards')
            .where('boardId', '==', boardId)
            .where('listId', '==', listId)
            .orderBy('createdAt', 'asc')
            .get();

        const cards = [];
        cardsSnapshot.forEach(doc => {
            cards.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, cards: cards };
    } catch (error) {
        console.error('❌ Erro ao buscar cards:', error);
        return { success: false, error: error };
    }
}

/**
 * Atualizar card
 */
async function updateCard(cardId, updates) {
    try {
        updates.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('cards').doc(cardId).update(updates);

        console.log('✅ Card atualizado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao atualizar card:', error);
        return { success: false, error: error };
    }
}

/**
 * Mover card para outra lista
 */
async function moveCard(cardId, newListId) {
    try {
        await db.collection('cards').doc(cardId).update({
            listId: newListId,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Card movido com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao mover card:', error);
        return { success: false, error: error };
    }
}

/**
 * Deletar card
 */
async function deleteCard(cardId) {
    try {
        await db.collection('cards').doc(cardId).delete();

        console.log('✅ Card deletado com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar card:', error);
        return { success: false, error: error };
    }
}

/**
 * Adicionar comentário ao card
 */
async function addCardComment(cardId, comment) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const newComment = {
            id: Date.now().toString(),
            userId: user.uid,
            userName: user.displayName,
            text: comment,
            createdAt: new Date().toISOString()
        };

        await db.collection('cards').doc(cardId).update({
            comments: firebase.firestore.FieldValue.arrayUnion(newComment),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Comentário adicionado!');
        return { success: true, comment: newComment };
    } catch (error) {
        console.error('❌ Erro ao adicionar comentário:', error);
        return { success: false, error: error };
    }
}

// ============================================
// STORAGE (ARQUIVOS)
// ============================================

/**
 * Upload de arquivo
 */
async function uploadFile(file, path) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const filePath = `${path}/${user.uid}/${fileName}`;
        
        const storageRef = storage.ref(filePath);
        const uploadTask = storageRef.put(file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    console.log(`Upload: ${progress}%`);
                },
                (error) => {
                    console.error('❌ Erro no upload:', error);
                    reject({ success: false, error: error });
                },
                async () => {
                    const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
                    console.log('✅ Upload concluído!');
                    resolve({ 
                        success: true, 
                        url: downloadURL,
                        path: filePath,
                        name: file.name
                    });
                }
            );
        });
    } catch (error) {
        console.error('❌ Erro ao fazer upload:', error);
        return { success: false, error: error };
    }
}

/**
 * Deletar arquivo
 */
async function deleteFile(filePath) {
    try {
        const fileRef = storage.ref(filePath);
        await fileRef.delete();

        console.log('✅ Arquivo deletado!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao deletar arquivo:', error);
        return { success: false, error: error };
    }
}

// ============================================
// LOGS E ANALYTICS
// ============================================

/**
 * Registrar acesso do usuário
 */
async function registerUserAccess(userId, username, email) {
    try {
        await db.collection('userAccess').add({
            userId: userId,
            username: username,
            email: email,
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        });

        console.log('✅ Acesso registrado!');
    } catch (error) {
        console.error('❌ Erro ao registrar acesso:', error);
    }
}

/**
 * Obter estatísticas de acesso
 */
async function getAccessStats() {
    try {
        const snapshot = await db.collection('userAccess')
            .orderBy('timestamp', 'desc')
            .limit(100)
            .get();

        const accesses = [];
        snapshot.forEach(doc => {
            accesses.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, accesses: accesses };
    } catch (error) {
        console.error('❌ Erro ao buscar estatísticas:', error);
        return { success: false, error: error };
    }
}

// ============================================
// LISTENER DE AUTENTICAÇÃO
// ============================================

/**
 * Observar mudanças no estado de autenticação
 */
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log('👤 Usuário autenticado:', user.displayName || user.email);
        
        // Atualizar UI se necessário
        if (window.updateUserUI) {
            window.updateUserUI(user);
        }
    } else {
        console.log('👤 Usuário não autenticado');
    }
});

/**
 * Salvar board completo do localStorage para o Firebase
 */
async function saveBoardToFirestore(boardData) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Preparar dados do board para o Firestore
        const firestoreBoard = {
            name: boardData.name || 'Sem título',
            background: boardData.background || 'default',
            backgroundColor: boardData.backgroundColor || '#0079bf',
            backgroundImage: boardData.backgroundImage || null,
            ownerId: user.uid,
            ownerEmail: user.email,
            members: [user.uid],
            sharedWith: [],
            starred: boardData.starred || false,
            lists: boardData.lists || [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastViewed: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Salvar no Firestore
        const boardRef = await db.collection('boards').add(firestoreBoard);

        console.log('✅ Board migrado para Firebase:', boardRef.id);
        return { success: true, boardId: boardRef.id, board: firestoreBoard };
    } catch (error) {
        console.error('❌ Erro ao salvar board no Firebase:', error);
        return { success: false, error: error };
    }
}

/**
 * Migrar todos os boards do localStorage para o Firebase
 */
async function migrateLocalBoardsToFirebase(localBoards) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        console.log(`🔄 Migrando ${localBoards.length} board(s) para o Firebase...`);
        
        const results = [];
        for (const board of localBoards) {
            const result = await saveBoardToFirestore(board);
            results.push({ oldId: board.id, ...result });
        }

        const successCount = results.filter(r => r.success).length;
        console.log(`✅ ${successCount}/${localBoards.length} board(s) migrado(s) com sucesso!`);

        return { success: true, results: results };
    } catch (error) {
        console.error('❌ Erro na migração:', error);
        return { success: false, error: error };
    }
}

/**
 * Compartilhar board com outro usuário (por email)
 */
async function shareBoardWithUser(boardId, userEmail) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Validar email
        if (!userEmail || !userEmail.includes('@')) {
            return { success: false, error: 'Email inválido' };
        }

        // Normalizar email
        userEmail = userEmail.toLowerCase().trim();

        // Não permitir compartilhar consigo mesmo
        if (userEmail === user.email) {
            return { success: false, error: 'Você não pode compartilhar com você mesmo' };
        }

        console.log('🔍 Buscando usuário:', userEmail);

        // Buscar usuário pelo email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', userEmail)
            .get();

        if (usersSnapshot.empty) {
            return { 
                success: false, 
                error: `❌ O email "${userEmail}" não está cadastrado no sistema. O usuário precisa criar uma conta primeiro.` 
            };
        }

        const targetUser = usersSnapshot.docs[0];
        const targetUserId = targetUser.id;
        const targetUserData = targetUser.data();

        console.log('✅ Usuário encontrado:', targetUserData.name || userEmail);

        // Buscar o board
        const boardDoc = await db.collection('boards').doc(boardId).get();
        if (!boardDoc.exists) {
            return { success: false, error: 'Quadro não encontrado' };
        }

        const boardData = boardDoc.data();

        // Verificar se o usuário é o dono do board
        if (boardData.ownerId !== user.uid) {
            return { success: false, error: 'Apenas o proprietário pode compartilhar o quadro' };
        }

        // Adicionar usuário aos membros se ainda não estiver
        const members = boardData.members || [];
        const sharedWith = boardData.sharedWith || [];
        
        if (members.includes(targetUserId) || sharedWith.includes(userEmail)) {
            return { 
                success: false, 
                error: `O usuário ${targetUserData.name || userEmail} já tem acesso a este quadro` 
            };
        }

        members.push(targetUserId);

        await db.collection('boards').doc(boardId).update({
            members: members,
            sharedWith: firebase.firestore.FieldValue.arrayUnion(userEmail),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Quadro compartilhado com sucesso!');
        return { 
            success: true,
            userName: targetUserData.name || userEmail
        };
    } catch (error) {
        console.error('❌ Erro ao compartilhar quadro:', error);
        return { success: false, error: error.message || 'Erro ao compartilhar quadro' };
    }
}

/**
 * Remover membro de um quadro
 */
async function removeBoardMember(boardId, userEmail) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar dados do usuário que será removido
        const usersSnapshot = await db.collection('users')
            .where('email', '==', userEmail)
            .get();

        if (usersSnapshot.empty) {
            throw new Error('Usuário não encontrado');
        }

        const targetUserId = usersSnapshot.docs[0].id;

        // Atualizar quadro no Firebase removendo o membro
        await db.collection('boards').doc(boardId).update({
            members: firebase.firestore.FieldValue.arrayRemove(targetUserId),
            sharedWith: firebase.firestore.FieldValue.arrayRemove(userEmail),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Membro removido com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao remover membro:', error);
        return { success: false, error: error.message || 'Erro ao remover membro' };
    }
}


/**
 * Remover acesso de um usuário ao board
 */
async function removeBoardAccess(boardId, userEmail) {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar usuário pelo email
        const usersSnapshot = await db.collection('users')
            .where('email', '==', userEmail)
            .get();

        if (usersSnapshot.empty) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const targetUserId = usersSnapshot.docs[0].id;

        await db.collection('boards').doc(boardId).update({
            members: firebase.firestore.FieldValue.arrayRemove(targetUserId),
            sharedWith: firebase.firestore.FieldValue.arrayRemove(userEmail),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        console.log('✅ Acesso removido com sucesso!');
        return { success: true };
    } catch (error) {
        console.error('❌ Erro ao remover acesso:', error);
        return { success: false, error: error };
    }
}

/**
 * Obter todos os boards do usuário (próprios + compartilhados)
 */
async function getUserBoards() {
    try {
        const user = getCurrentUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar boards onde o usuário é membro
        const boardsSnapshot = await db.collection('boards')
            .where('members', 'array-contains', user.uid)
            .orderBy('updatedAt', 'desc')
            .get();

        const boards = [];
        boardsSnapshot.forEach(doc => {
            const boardData = doc.data();
            boards.push({ 
                id: doc.id, 
                ...boardData,
                isOwner: boardData.ownerId === user.uid
            });
        });

        console.log(`✅ ${boards.length} board(s) carregado(s) do Firestore`);
        return { success: true, boards: boards };
    } catch (error) {
        console.error('❌ Erro ao buscar boards do usuário:', error);
        return { success: false, error: error };
    }
}

// Exportar funções globalmente
window.firebaseService = {
    // Auth
    registerUser,
    loginUser,
    logoutUser,
    resetPassword,
    getCurrentUser,
    isUserAdmin,
    getUserProfile,
    updateUserProfile,
    
    // Workspaces
    createWorkspace,
    getUserWorkspaces,
    updateWorkspace,
    deleteWorkspace,
    
    // Boards
    createBoard,
    getWorkspaceBoards,
    getBoard,
    updateBoard,
    deleteBoard,
    getUserBoards,
    shareBoardWithUser,
    removeBoardMember,
    removeBoardAccess,
    saveBoardToFirestore,
    migrateLocalBoardsToFirebase,
    
    // Lists
    addList,
    updateListName,
    deleteList,
    
    // Cards
    createCard,
    getListCards,
    updateCard,
    moveCard,
    deleteCard,
    addCardComment,
    
    // Storage
    uploadFile,
    deleteFile,
    
    // Analytics
    registerUserAccess,
    getAccessStats
};

console.log('✅ Firebase Service carregado!');
