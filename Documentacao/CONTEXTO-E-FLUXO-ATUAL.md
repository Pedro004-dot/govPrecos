# Contexto e fluxo atual – GovPrecos (frontend)

Resumo do que foi feito, estrutura atual e fluxo do usuário.

---

## 1. O que fizemos (mudanças realizadas)

### Layout e navegação

| Mudança | Descrição |
|--------|------------|
| **Remoção do header superior** | A barra fixa no topo que mostrava "GovPrecos / [breadcrumb da página]" e os ícones (ajuda, notificações, usuário) foi **removida** do layout. O componente `Header.tsx` ainda existe em `components/common/` mas **não é mais usado** no `MainLayout`. |
| **Ícones no rodapé da sidebar** | Os três ícones (Ajuda, Notificações, Avatar/usuário com dropdown Perfil/Configurações/Sair) foram movidos para o **canto inferior esquerdo da sidebar**, numa faixa fixa no rodapé. |
| **Sidebar recolhível em telas grandes** | Em telas ≥ 1024px o usuário pode **recolher ou expandir** a sidebar por um botão ("Recolher menu" / ícone de painel). A preferência é salva em `localStorage` (`sidebar-collapsed`). Em telas menores a sidebar continua sempre recolhida (só ícones). |
| **Conteúdo full width** | Para as rotas `/projeto/:id` e `/projeto/:id/item/:itemId` o conteúdo usa **toda a largura** (sem container central); as demais telas usam `p-4 max-w-full` no `main`. |
| **Sidebar responsiva** | Abaixo de 1024px a sidebar fica com largura fixa (`w-16`), só ícones; itens com submenu viram `DropdownMenu` ao clicar no ícone. |

### Página de detalhes da cotação (ProjectDetails)

| Mudança | Descrição |
|--------|------------|
| **Botões de ação reposicionados** | Os três botões "Novo item", "Importar itens" e "Gerar relatório" saíram de dentro do primeiro card (onde ficavam ao lado de Valor Total e Fórmula) e foram para a **barra superior do card da tabela**, no **lado direito** do campo de busca "Nome do Item", na mesma linha (busca à esquerda, contador "X itens" + os três botões à direita). |
| **Card de detalhes simplificado** | O primeiro card ("Detalhes da cotação") passou a ter só as informações: Criado por, Criado em, Valor Total, Selecione a fórmula (sem os botões no meio). |

### Fluxo de orçamentos no item

| Mudança | Descrição |
|--------|------------|
| **Redirecionamento após vincular orçamentos** | Na página "Preços Governamentais Art 5º Inc. I" (`/projeto/:id/item/:itemId/buscar`), ao clicar em "Salvar orçamentos no item" (após vincular as fontes), o usuário passa a ser redirecionado para a **página de detalhamento do item** (`/projeto/:id/item/:itemId`) em vez da página da cotação (`/projeto/:id`). |

### Componentes e páginas criados (antes desta sessão, conforme histórico)

- **AdicionarItemSheet** – Modal/sheet para adicionar novo item à cotação (nome, quantidade, descrição, unidade, justificativas); aberto pelo botão "Novo item" em ProjectDetails.
- **BuscarItensParaItem** – Página dedicada para buscar preços governamentais no contexto de um item da cotação.
- **CardResultadoExpandivel** – Card de resultado da busca que expande para baixo com abas (Propostas/Detalhes).
- **ItemDetalhamento** – Página de detalhamento do item (estatísticas, fórmula, preços selecionados, navegação entre itens, sidebar com Preços governamentais / Cotação direta / Gráficos comparativos).
- **DetalheItemSheet** – Sheet com detalhes do item ao clicar em um resultado (na busca).
- Wireframe HTML e doc do detalhamento: `public/wireframe-detalhamento-item.html`, `Documentacao/WIREFRAME-DETALHAMENTO-ITEM.md`.

### O que foi removido do fluxo (sem apagar arquivos)

- **"Gerenciar fontes"** – Deixou de ser o fluxo principal; o usuário usa **"Buscar fontes"**, que leva à página BuscarItensParaItem. A página **ItemSourceManager** (`/item/:id/fontes`) ainda existe e está na rota, mas não é mais o caminho principal para gerenciar fontes do item.

---

## 2. Páginas que não foram apagadas

- **Nenhuma página (.tsx) foi deletada.**  
- O **Header** foi apenas **retirado do MainLayout**; o arquivo `Header.tsx` continua em `components/common/Header.tsx` e pode ser removido ou reutilizado no futuro.

---

## 3. Estrutura estática atual

### Rotas (App.tsx)

| Rota | Página | Descrição |
|------|--------|-----------|
| `/` | Dashboard | Minhas cotações (lista de projetos) |
| `/buscar` | Search | Busca rápida de preço (busca avançada, tabela, seleção para cotação ou para vincular ao item) |
| `/relatorios` | Relatorios | Meus relatórios (placeholder "Em construção") |
| `/inteligencia/fornecedores` | AnaliseFornecedores | Análise de fornecedores |
| `/projetos/novo` | ProjectEditor | Nova cotação |
| `/projeto/:id` | ProjectDetails | Detalhes da cotação (dados do projeto, fórmula, tabela de itens, botões Novo item / Importar / Gerar relatório na barra da tabela) |
| `/projeto/:id/editar` | ProjectEditor | Editar cotação |
| `/projeto/:id/item/:itemId` | ItemDetalhamento | Detalhamento do item (stats, preços selecionados, navegação entre itens, sidebar com seções) |
| `/projeto/:id/item/:itemId/buscar` | BuscarItensParaItem | Preços Governamentais Art 5º Inc. I – buscar e vincular orçamentos ao item |
| `/item/:id/fontes` | ItemSourceManager | Fontes do item (tela antiga de gerenciar fontes; ainda na rota, fluxo principal não passa por aqui) |

Todas as rotas acima usam o **MainLayout** (Sidebar + área principal, sem header superior).

### Layout (MainLayout)

- **Sidebar** à esquerda (expandida ou recolhida conforme preferência/tela).
- **Área principal** à direita: apenas o `<Outlet />` (conteúdo da rota), sem barra superior.
- Rotas **full width** (sem padding do container): `/projeto/:id` e `/projeto/:id/item/:itemId`.  
- Demais rotas: `main` com `p-4 max-w-full`.

### Sidebar

- **Topo:** Avatar + nome "Vinícius Mayrink" + afiliação + "Minha Conta" (dropdown). Em modo recolhido: só avatar.
- **Navegação:**
  - Cotações → Minhas cotações, Meus relatórios
  - Inteligência de mercado → Análise de fornecedores
  - Busca rápida de preço
- **Acima do rodapé:** Botão "Recolher menu" / ícone de expandir (só em telas grandes).
- **Rodapé:** Ícones Ajuda, Notificações, Avatar (dropdown usuário).

---

## 4. Fluxo do usuário (resumido)

### Criar cotação e itens

1. **Dashboard** (/) → "Nova cotação" ou card do projeto.
2. **ProjectEditor** (`/projetos/novo` ou `/projeto/:id/editar`) → Dados do projeto, itens; salvar.
3. **ProjectDetails** (`/projeto/:id`) → Ver detalhes, valor total, fórmula; **Novo item** abre AdicionarItemSheet; **Importar itens** abre ExcelUploadSheet; tabela lista itens com **Detalhamento** e **Buscar fontes**.

### Buscar e vincular orçamentos a um item

4. Em **ProjectDetails**, na linha do item → **Buscar fontes** → vai para **BuscarItensParaItem** (`/projeto/:id/item/:itemId/buscar`).
5. Em **BuscarItensParaItem** → Busca, seleção de resultados, "Vincular" / salvar orçamentos no item → redirecionamento para **ItemDetalhamento** (`/projeto/:id/item/:itemId`).
6. Em **ItemDetalhamento** → Ver estatísticas, preços selecionados, "Incluir preço" / "Buscar preços governamentais" → volta para **BuscarItensParaItem**; ou "Gerar relatório" → vai para **ProjectDetails** (`/projeto/:id`).

### Relatório e busca geral

7. Em **ProjectDetails**, com projeto finalizado → **Gerar relatório** → scroll até o bloco do PDFGenerator; gerar/baixar PDF.
8. **Busca rápida** (`/buscar`) → Busca avançada; pode criar cotação com itens selecionados ou (com `itemId` na URL) vincular orçamentos a um item.

---

## 5. Arquivos principais (referência rápida)

| Área | Arquivos |
|------|----------|
| Rotas e layout | `App.tsx`, `MainLayout.tsx`, `Sidebar.tsx` |
| Header (não usado) | `Header.tsx` |
| Páginas | `Dashboard`, `ProjectDetails`, `ProjectEditor`, `Search`, `BuscarItensParaItem`, `ItemDetalhamento`, `Relatorios`, `AnaliseFornecedores`, `ItemSourceManager` |
| Componentes de projeto | `AdicionarItemSheet`, `PDFGenerator`, `ExcelUploadSheet`, `ItemCard`, etc. |
| Busca / detalhe | `CardResultadoExpandivel`, `DetalheItemSheet` |
| Documentação | `WIREFRAME-DETALHAMENTO-ITEM.md`, `PROPOSTA-TELA-BUSCA-ITENS.md`, `IDENTIDADE-VISUAL.md`, este arquivo |

---

Este documento reflete o estado do frontend após as alterações descritas. Para próximos passos (gráficos, relatórios, fórmulas), ver o plano em `.cursor/plans/` ou o resumo em conversa anterior.
