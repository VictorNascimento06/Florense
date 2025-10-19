# 🚀 Guia Completo: Deploy no GitHub Pages

## 📋 Pré-requisitos

- [ ] Conta no GitHub (gratuita)
- [ ] Git instalado no computador
- [ ] Projeto Florense na sua máquina

---

## 🎯 MÉTODO 1: Upload Direto (Mais Fácil)

### Passo 1: Criar Conta no GitHub

1. Acesse: https://github.com
2. Clique em **"Sign up"**
3. Preencha:
   - Email
   - Senha
   - Username (ex: `florense-dev`)
4. Verifique seu email
5. Pronto! ✅

### Passo 2: Criar Repositório

1. No GitHub, clique no **"+"** (canto superior direito)
2. Selecione **"New repository"**
3. Preencha:
   ```
   Repository name: florense-trello
   Description: Sistema de Gerenciamento de Projetos Florense
   ✅ Public (para usar GitHub Pages grátis)
   ✅ Add a README file (marque)
   ```
4. Clique em **"Create repository"**

### Passo 3: Upload dos Arquivos

1. No repositório criado, clique em **"Add file"** → **"Upload files"**

2. Arraste TODOS os arquivos da pasta `Projeto princinpal`:
   ```
   ✅ index.html
   ✅ login.html
   ✅ recuperar.html
   ✅ trello-home.html
   ✅ dashboard.html
   ✅ admin.html
   ✅ Todos os arquivos .css
   ✅ Todos os arquivos .js
   ✅ Todos os arquivos .md
   ✅ .gitignore
   ```

3. **IMPORTANTE:** Arraste a pasta inteira de uma vez ou selecione todos os arquivos

4. Adicione uma mensagem:
   ```
   Commit message: "Primeira versão do sistema Florense"
   ```

5. Clique em **"Commit changes"**

### Passo 4: Ativar GitHub Pages

1. No repositório, vá em **"Settings"** (aba no topo)

2. No menu lateral esquerdo, clique em **"Pages"**

3. Em **"Branch"**:
   - Selecione: **main**
   - Pasta: **/ (root)**
   - Clique em **"Save"**

4. Aguarde 1-2 minutos ⏱️

5. Recarregue a página

6. Você verá uma mensagem:
   ```
   ✅ Your site is live at https://seu-usuario.github.io/florense-trello/
   ```

### Passo 5: Acessar o Site

Seu site estará disponível em:
```
https://seu-usuario.github.io/florense-trello/
```

**Exemplo:**
```
https://florense-dev.github.io/florense-trello/
```

---

## 🎯 MÉTODO 2: Usando Git (Mais Profissional)

### Passo 1: Instalar Git

**Windows:**
1. Baixe: https://git-scm.com/download/win
2. Instale com as opções padrão
3. Abra **Git Bash**

**Verificar instalação:**
```bash
git --version
```

### Passo 2: Configurar Git

```bash
# Configurar nome
git config --global user.name "Seu Nome"

# Configurar email (mesmo do GitHub)
git config --global user.email "seu@email.com"
```

### Passo 3: Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. Crie o repositório como no Método 1
3. **NÃO marque "Add a README file"** desta vez
4. Copie a URL do repositório (ex: `https://github.com/seu-usuario/florense-trello.git`)

### Passo 4: Inicializar Git Localmente

Abra o **PowerShell** ou **Git Bash** na pasta do projeto:

```powershell
# Navegar até a pasta do projeto
cd "c:\Users\vhnas\OneDrive\Área de Trabalho\Florense\Projeto princinpal"

# Inicializar repositório Git
git init

# Adicionar todos os arquivos
git add .

# Fazer o primeiro commit
git commit -m "Primeira versão do sistema Florense"

# Renomear branch para main
git branch -M main

# Adicionar repositório remoto (substitua pela SUA URL)
git remote add origin https://github.com/seu-usuario/florense-trello.git

# Enviar para o GitHub
git push -u origin main
```

### Passo 5: Ativar GitHub Pages

Mesmo processo do Método 1 (Settings → Pages → Branch: main → Save)

---

## 📝 Atualizando o Site

### Método 1 (Upload Direto):
1. Vá no repositório
2. Clique no arquivo que quer editar
3. Clique no ícone do lápis ✏️
4. Faça as alterações
5. Scroll para baixo
6. **"Commit changes"**
7. Aguarde 1-2 minutos
8. Mudanças no ar! ✅

### Método 2 (Git):
```bash
# Fazer alterações nos arquivos localmente

# Ver o que foi alterado
git status

# Adicionar alterações
git add .

# Commit com mensagem descritiva
git commit -m "Descrição do que foi alterado"

# Enviar para GitHub
git push

# Aguardar 1-2 minutos - deploy automático!
```

---

## 🔧 Configurações Avançadas

### Adicionar Domínio Personalizado

1. No GitHub: **Settings** → **Pages**
2. Em **"Custom domain"**, digite: `www.seudominio.com`
3. Clique em **"Save"**
4. No seu provedor de domínio, adicione:
   ```
   Tipo: CNAME
   Nome: www
   Valor: seu-usuario.github.io
   ```

### Forçar HTTPS

1. No GitHub: **Settings** → **Pages**
2. Marque: ✅ **"Enforce HTTPS"**

---

## ✅ Checklist Final

Antes de considerar concluído:

- [ ] Site acessível pela URL do GitHub Pages
- [ ] Todas as páginas funcionando (index, login, dashboard, etc.)
- [ ] Imagens carregando corretamente
- [ ] CSS aplicado corretamente
- [ ] JavaScript funcionando
- [ ] LocalStorage salvando dados
- [ ] Login/Logout funcionando
- [ ] Quadros sendo criados e salvos
- [ ] Responsivo no celular

---

## 🐛 Solução de Problemas

### ❌ Erro: "404 - Page not found"

**Causa:** GitHub não encontra o arquivo inicial

**Solução:**
1. Verifique se existe `index.html` na raiz
2. GitHub Pages procura por `index.html` primeiro
3. Se seu arquivo principal tem outro nome, renomeie para `index.html`

### ❌ CSS não carrega

**Causa:** Caminhos relativos quebrados

**Solução:**
Verifique os links no HTML:
```html
<!-- ERRADO -->
<link rel="stylesheet" href="/estilo.css">

<!-- CORRETO -->
<link rel="stylesheet" href="estilo.css">
```

### ❌ JavaScript não funciona

**Causa:** Caminhos de scripts ou CORS

**Solução:**
```html
<!-- ERRADO -->
<script src="/script.js"></script>

<!-- CORRETO -->
<script src="script.js"></script>
```

### ❌ LocalStorage não funciona

**Causa:** Protocolo file:// não suporta localStorage

**Solução:**
- ✅ Sempre acesse via HTTPS (GitHub Pages)
- ✅ Não abra diretamente do arquivo (file://)

### ❌ Deploy demora muito

**Normal:** Pode levar até 10 minutos no primeiro deploy

**Se passar de 10 minutos:**
1. Vá em **Actions** (aba no GitHub)
2. Veja se há erros
3. Tente fazer um commit vazio:
   ```bash
   git commit --allow-empty -m "Trigger deploy"
   git push
   ```

---

## 📊 Monitoramento

### Ver quantas pessoas acessam

GitHub Pages não oferece analytics nativamente, mas você pode adicionar:

**Google Analytics (Grátis):**
1. Crie conta em: https://analytics.google.com
2. Adicione o código de tracking no `<head>` de todas as páginas

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎓 Recursos Úteis

- [Documentação GitHub Pages](https://docs.github.com/en/pages)
- [Guia Git em Português](https://git-scm.com/book/pt-br/v2)
- [Tutorial Interativo de Git](https://learngitbranching.js.org/?locale=pt_BR)
- [Markdown Cheatsheet](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet)

---

## 🆘 Precisa de Ajuda?

### Opção 1: Issues do GitHub
Crie uma issue no repositório descrevendo o problema

### Opção 2: Comunidade GitHub
- [GitHub Community](https://github.community/)
- [Stack Overflow](https://stackoverflow.com/)

### Opção 3: Documentação
- [GitHub Docs](https://docs.github.com/)

---

## 🎉 Próximos Passos

Depois que estiver no ar:

1. **Compartilhe o link** com a equipe
2. **Monitore o uso** com analytics
3. **Colete feedback** dos usuários
4. **Faça melhorias** baseadas no feedback
5. **Mantenha atualizado** com novos recursos

---

**Versão do Guia:** 1.0  
**Última atualização:** Outubro 2025  
**Status:** ✅ Testado e Funcionando

---

🎯 **Dica Final:** Marque o repositório com uma ⭐ no GitHub para encontrá-lo facilmente depois!
