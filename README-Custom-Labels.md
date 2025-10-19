# 🏷️ Marcadores Personalizáveis - Documentação

## 📋 Visão Geral

Implementação de sistema de marcadores (labels) personalizáveis para os cards do dashboard, permitindo que cada usuário nomeie as cores dos marcadores conforme sua necessidade.

## ✨ Funcionalidades Implementadas

### 1. **Nomeação de Marcadores**
- Cada cor de marcador pode ter um nome personalizado
- Nomes são salvos por usuário no localStorage
- Limite de 20 caracteres por nome
- Nomes padrão: Verde, Amarelo, Laranja, Vermelho, Roxo, Azul

### 2. **Interface do Modal de Marcadores**
- Inputs de texto ao lado de cada cor
- Click na cor: adiciona/remove o marcador do card
- Click no input: permite editar o nome
- Enter ou blur: salva automaticamente o nome

### 3. **Exibição nos Cards**
- Marcadores exibidos como barras coloridas
- Tooltip com o nome personalizado ao passar o mouse
- Efeito visual de elevação no hover
- Cores mantidas conforme padrão Trello

## 🎨 Cores Disponíveis

| Cor | Código Hex | Nome Padrão |
|-----|------------|-------------|
| Verde | #61bd4f | Verde |
| Amarelo | #f2d600 | Amarelo |
| Laranja | #ff9f1a | Laranja |
| Vermelho | #eb5a46 | Vermelho |
| Roxo | #c377e0 | Roxo |
| Azul | #0079bf | Azul |

## 💾 Armazenamento

### LocalStorage Keys:
```javascript
// Nomes dos marcadores por usuário
`label-names_${userEmail}` = {
    green: "Nome Personalizado",
    yellow: "Outro Nome",
    // ...
}
```

### Estrutura de Dados:
```javascript
{
    green: "Verde",
    yellow: "Amarelo",
    orange: "Laranja",
    red: "Vermelho",
    purple: "Roxo",
    blue: "Azul"
}
```

## 🔧 Arquivos Modificados

### 1. **dashboard.html**
```html
<!-- Modal de Marcadores com inputs -->
<div class="label-option-wrapper">
    <div class="label-option" data-color="green">
        <div class="label-color green"></div>
        <input type="text" class="label-name-input" 
               data-color="green" 
               placeholder="Verde" 
               maxlength="20">
    </div>
</div>
```

### 2. **dashboard.css**
```css
/* Estilos para inputs de nome */
.label-name-input {
    flex: 1;
    border: 2px solid transparent;
    background: transparent;
    padding: 4px 8px;
    border-radius: 3px;
    transition: all 0.2s;
}

.label-name-input:focus {
    background: white;
    border-color: #0079bf;
}
```

### 3. **dashboard-new.js**

#### Funções Principais:

**showLabelsModal()**
- Abre o modal de marcadores
- Carrega nomes personalizados
- Configura event listeners

**loadLabelNames()**
- Carrega nomes salvos do localStorage
- Preenche os inputs com nomes personalizados

**saveLabelName(color, name)**
- Salva nome personalizado no localStorage
- Atualiza display do card atual

**getLabelNames()**
- Retorna objeto com nomes dos marcadores
- Usa nomes personalizados se existirem
- Fallback para nomes padrão

**renderCardLabels(card)**
- Renderiza marcadores com nomes personalizados
- Exibe no modal de detalhes do card

**createCardHTML(card)**
- Adiciona tooltip com nome do marcador
- Usa nomes personalizados na visualização

## 📱 Fluxo de Uso

### Personalizar Nome de Marcador:
1. Abrir um card
2. Clicar em "Marcadores"
3. Clicar no campo de texto ao lado da cor desejada
4. Digitar o nome personalizado (máx. 20 caracteres)
5. Pressionar Enter ou clicar fora para salvar

### Adicionar Marcador ao Card:
1. No modal de marcadores
2. Clicar na cor desejada (não no input)
3. Marcador é adicionado/removido do card
4. Nome personalizado é exibido automaticamente

### Ver Nome do Marcador:
1. Passar o mouse sobre o marcador no card
2. Tooltip exibe o nome personalizado
3. Efeito visual de elevação

## 🎯 Benefícios

✅ **Personalização**: Cada usuário nomeia conforme sua necessidade
✅ **Isolamento**: Nomes salvos por usuário (não interferem entre si)
✅ **Usabilidade**: Interface intuitiva e responsiva
✅ **Visual**: Tooltips informativos e efeitos visuais
✅ **Persistência**: Nomes mantidos entre sessões

## 🔄 Compatibilidade

- ✅ Compatível com sistema existente de marcadores
- ✅ Não afeta cards já criados
- ✅ Nomes padrão como fallback
- ✅ Funciona com sistema de admin (cada usuário tem seus nomes)

## 📝 Exemplos de Uso

### Equipe de Desenvolvimento:
- Verde → "Aprovado"
- Amarelo → "Em Revisão"
- Laranja → "Urgente"
- Vermelho → "Bloqueado"
- Roxo → "Design"
- Azul → "Backend"

### Equipe de Marketing:
- Verde → "Publicado"
- Amarelo → "Rascunho"
- Laranja → "Aguardando Aprovação"
- Vermelho → "Cancelado"
- Roxo → "Campanha"
- Azul → "Social Media"

### Florense (Projetos):
- Verde → "Aprovado pelo Cliente"
- Amarelo → "Aguardando Retorno"
- Laranja → "Alteração Necessária"
- Vermelho → "Projeto Pausado"
- Roxo → "Em Produção"
- Azul → "Entregue"

## 🐛 Tratamento de Erros

- Se nome vazio → usa nome padrão
- Se localStorage cheio → mantém nomes atuais
- Se usuário não logado → usa chave genérica
- Se cor inválida → fallback para nome da cor

## 🚀 Futuras Melhorias Possíveis

- [ ] Criar marcadores customizados (além das 6 cores)
- [ ] Importar/exportar configurações de marcadores
- [ ] Marcadores com ícones personalizados
- [ ] Categorias de marcadores
- [ ] Sugestões automáticas de nomes baseadas no contexto

---

**Desenvolvido por:** GitHub Copilot  
**Data:** 17/10/2025  
**Versão:** 1.0
