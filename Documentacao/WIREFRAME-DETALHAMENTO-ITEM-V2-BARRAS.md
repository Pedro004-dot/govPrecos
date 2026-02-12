# Wireframe v2 – Detalhamento do item (distribuição com barras)

## Objetivo

Melhorar a **distribuição e hierarquia** da coluna esquerda na tela de detalhamento do item, deixando claro que as três opções (Preços governamentais, Cotação direta, Gráficos comparativos) **controlam o conteúdo exibido à direita**.

## Como visualizar

Com o frontend rodando (`npm run dev`), abra no navegador:

**http://localhost:5173/wireframe-detalhamento-item-v2-barras.html**

Ou abra o arquivo diretamente:

`frontend/public/wireframe-detalhamento-item-v2-barras.html`

---

## Proposta de distribuição (coluna esquerda)

| Bloco | Nome sugerido | Conteúdo | Observação |
|-------|----------------|----------|------------|
| **1** | Contexto do item | Cotação, número do item, nome, quantidade | Uma única barra compacta no topo; fundo levemente destacado (ex.: azul claro). Não um card grande. |
| **2** | O que exibir nesta tela | Label + 3 opções em barras/botões de mesmo peso visual | **Preços governamentais** / **Cotação direta** / **Gráficos comparativos**. Cada uma é um “modo” que altera o conteúdo da área direita. Espaçamento e bordas deixam claro que são um grupo. |
| **3** | Ação de página | Botão **Gerar relatório** | Separado por borda superior; não faz parte da escolha “o que exibir”, é ação global da cotação. |

## Relação esquerda ↔ direita

- **Preços governamentais** (ativo) → à direita: estatísticas (6 cards), seletor de fórmula, card “Preços selecionados” com lista e “Incluir preço”.
- **Cotação direta** → à direita: formulário ou fluxo para adicionar preço por cotação direta (a implementar).
- **Gráficos comparativos** → à direita: gráfico de comparação de preços entre as fontes (a implementar).

O wireframe em HTML usa **barras e blocos** para você validar proporções e ordem; após aprovação, essa estrutura pode ser aplicada no `ItemDetalhamento.tsx`.

## Arquivo do wireframe

- `frontend/public/wireframe-detalhamento-item-v2-barras.html`
