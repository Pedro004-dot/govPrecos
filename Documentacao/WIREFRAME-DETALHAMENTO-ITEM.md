# Wireframe: Detalhamento do item (visão por item da cotação)

## Como visualizar

Com o frontend rodando (`npm run dev`), abra no navegador:

**http://localhost:5173/wireframe-detalhamento-item.html**

Ou abra o arquivo diretamente:

`frontend/public/wireframe-detalhamento-item.html`

---

## Objetivo

Tela dedicada **por item** da cotação, inspirada no concorrente, para o usuário:

- Ver como está a cotação de preços **naquele item**
- Navegar entre itens (← Item anterior | Item seguinte →) sem sair da tela
- Escolher o tipo de fonte de orçamento no sidebar: **Preços governamentais**, **Cotação direta**, **Gráficos comparativos**
- Ver estatísticas (qtd preços, média, mediana, desvio, coef. variação) e fórmula de cálculo
- Ver lista de preços selecionados/vinculados e incluir novos

Assim cada item da cotação tem “uma sessão” com essa visualização, o que facilita buscar orçamentos para todos os itens em sequência.

---

## Estrutura do wireframe

| Área | Conteúdo |
|------|----------|
| **Topo** | Breadcrumb (Cotações / [projeto] / [item]) + “Detalhamento do item” |
| **Topo direita** | Navegação entre itens: ← Item anterior \| **Caneta azul (2 de 5)** \| Item seguinte → |
| **Sidebar esquerda** | Card contexto (Cotação de, Item, Nome, Quantidade) + 3 opções: **Preços governamentais** (ativa), **Cotação direta**, **Gráficos comparativos** + botão **Gerar relatório** |
| **Área central** | Cards de estatísticas (Qnt. Preços, Média, Mediana, etc.) + select “Selecione a fórmula” + bloco “Preços selecionados” com botão “+ Incluir preço” + lista de preços (descrição, qtd, UF, data, valor, ações) |

---

## Próximos passos (implementação)

1. **Rota:** por exemplo `/projeto/:id/item/:itemId` (detalhamento do item).
2. **Navegação entre itens:** usar a lista de itens do projeto; “Item anterior” / “Item seguinte” alteram o `itemId` na URL (ou estado) e recarregam o contexto.
3. **Sidebar:** três “fontes” — ao clicar em “Preços governamentais” mostrar a busca/lista atual; “Cotação direta” (formulário ou upload); “Gráficos comparativos” (gráfico de comparação de preços).
4. **Estatísticas e fórmula:** consumir dados do backend (fontes do item, mediana, etc.) e select da fórmula já existente no projeto.
5. **Preços selecionados:** listar fontes vinculadas ao item (já existe em parte no backend); “Incluir preço” pode abrir a tela “Preços Governamentais Art 5º Inc. I” ou um modal de cotação direta.

Identidade visual do wireframe: Inter, primary #1A71FF, bordas e cards alinhados ao GovPrecos/shadcn.
