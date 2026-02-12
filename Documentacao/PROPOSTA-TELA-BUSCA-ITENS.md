# Proposta: Tela de Busca e Seleção de Itens para Cotação

Objetivo: tela inspirada no concorrente onde o usuário **busca itens** (por descrição e pelos únicos filtros que temos), **vê resultados em cards**, **abre o detalhe ao clicar em um card** e pode **selecionar itens** para adicionar à cotação.  
**Restrições:** não temos “fontes” (bases) para selecionar; as únicas “fontes” de filtro são **raio de distância da cidade** e **tipo (material / serviço / ambos)**.

---

## 1. Sessão de pesquisa (filtros)

Campos sugeridos, alinhados ao que o backend já suporta ou pode suportar com pouco esforço:

| Campo | Obrigatório | Uso | Backend |
|-------|-------------|-----|---------|
| **Descrição** | Sim | Termo de busca no nome/descrição do item | Já existe: `q` |
| **Tipo** | Não | Material / Serviço / Material e Serviço | **Ajuste:** filtrar por `material_ou_servico` e incluir na resposta |
| **Município (cidade de referência)** | Não | Para calcular “raio a partir da cidade” | **Ajuste:** front envia `lat`, `lng` (obtidos do município) + `raioKm`; backend já aceita |
| **Raio (km)** | Não | Só faz sentido se “Município” estiver preenchido | Já existe: `raioKm` |

- **Sem** campo “Bases” ou “Fontes” (não temos fontes para selecionar).
- Botões: **Limpar filtros** e **Buscar** (verde).
- Opcional no futuro: “Busca exata”, “Período” (se o backend passar a filtrar por data).

**Como obter lat/lng do município**

- **Opção A (recomendada):** Backend expõe `GET /api/municipios?q=nome` que retorna lista com `codigoIbge`, `nome`, `latitude`, `longitude`. Front guarda lista de municípios (ou tabela `municipios` já existe); ao escolher o município, envia `lat`, `lng` e `raioKm` na busca.
- **Opção B:** Lista fixa de municípios no front (ex.: capitais) com lat/lng.
- **Opção C:** Serviço de geocoding no front (ex.: Nominatim) para “digitar cidade” e obter lat/lng.

---

## 2. Resultados em cards

- Cada **card** = um item retornado por `GET /api/itens/buscar`.
- **Informações no card** (todas que vocês disseram ter):
  - **Descrição** (título do card, pode truncar com “… ”).
  - **Quantidade** + **Unidade** (ex.: “42 CX”, “10 UN”).
  - **UF**
  - **Data** (ex.: data da licitação/publicação – precisa vir na resposta da busca; ver ajuste abaixo).
  - **Valor unitário** (R$)
  - **Distância (km)** – apenas quando houver filtro por município + raio.
  - **Tipo** – Material / Serviço (opcional no card, se quisermos destacar).
  - **Checkbox** para seleção.
- **Paginação:** `limit` / `offset`; botões “Anterior” / “Próxima” ou “Carregar mais”.
- Botão **“Selecionar todos”** (opcional): seleciona todos os itens da página atual.

Ajustes no backend para os cards:

- Incluir na resposta de `GET /api/itens/buscar`: `materialOuServico`, `materialOuServicoNome` e **data da licitação** (ex.: `dataPublicacaoPncp` do JOIN com `licitacoes`), para exibir “Data” e “Tipo” no card.

---

## 3. Detalhe ao clicar no card

Ao clicar em um card (não no checkbox), abrir **modal ou sheet** com o detalhe do item.

- **Cabeçalho do detalhe:** mesmo resumo do card (descrição, quantidade, unidade, UF, data, valor unit.).
- **Abas:** por exemplo **“Propostas”** e **“Detalhes”**, como na referência.

Conteúdo sugerido (com base no que existe no domínio):

**Aba Propostas**

- Valor estimado / valor unitário que já temos.
- Se no futuro houver “fornecedor vencedor” ou propostas por fornecedor no backend, exibir aqui.

**Aba Detalhes**

- **Item:** Descrição, Descrição complementar (`informacaoComplementar`), CATMAT/CATSER (se tiver), Tipo (Material/Serviço).
- **Licitação:** Órgão (`razaoSocialOrgao`), UASG (`codigoUnidade`), Modalidade (`modalidadeNome`), Município, UF, Data (publicação/homologação), Link do processo (`linkProcessoEletronico`), SRP (Sim/Não).
- **Fornecedor:** Se o backend tiver CNPJ, razão social etc. (ex.: vindos do PNCP em outra API), exibir; senão, omitir ou mostrar “—”.

Para isso, é necessário um **endpoint de detalhe do item da base** (não do item do projeto):

- **Sugestão:** `GET /api/itens/:id/detalhe` onde `id` = `itens_licitacao.id`.
- Resposta: objeto do item + objeto da licitação (campos úteis para a aba Detalhes). Assim o front monta as abas sem lógica pesada.

---

## 4. Fluxo “adicionar à cotação”

- Usuário pode **selecionar um ou vários itens** (checkbox) nos cards.
- Botão **“Adicionar X itens à cotação”** (ou “Usar selecionados”).
- Ação: para cada `itemLicitacaoId` selecionado, criar um item na cotação atual (projeto) e, se o backend permitir, já vincular como “fonte” esse `itemLicitacaoId` (para puxar preço/dados). Isso depende de como está o fluxo hoje: “novo item” manual vs. “adicionar item a partir da busca”.
- Duas variantes possíveis:
  1. Esta tela **substitui** o “Novo item” em parte: em “Novo item” o usuário pode escolher “Digitar manualmente” ou “Buscar na base”; ao escolher “Buscar na base”, abre esta tela de busca; ao selecionar e confirmar, os itens são adicionados à cotação.
  2. Ou esta tela é uma **página/rota separada** (ex.: “Busca rápida de preço” na sidebar) e, ao final, “Adicionar à cotação” exige escolher para qual cotação (ou abre na cotação já aberta).

---

## 5. Resumo dos ajustes no backend

| Ajuste | Descrição |
|--------|-----------|
| **GET /api/itens/buscar** | Incluir na resposta: `materialOuServico`, `materialOuServicoNome`, e data da licitação (ex.: `dataPublicacaoPncp`) para exibir “Data” e “Tipo” nos cards. |
| **GET /api/itens/buscar** | Novo parâmetro opcional `tipo`: `material` \| `servico` \| `ambos`. No repositório, filtrar por `material_ou_servico` (ex.: M, S ou ambos). |
| **GET /api/itens/:id/detalhe** | Novo endpoint: recebe `id` do `itens_licitacao`; retorna item + licitação (campos necessários para as abas Propostas e Detalhes). |
| **GET /api/municipios?q=** (opcional) | Listar/buscar municípios por nome; retornar `codigoIbge`, `nome`, `latitude`, `longitude` para o filtro “cidade + raio”. |

---

## 6. Ordem sugerida de implementação

1. **Backend:** Incluir `materialOuServico`, `materialOuServicoNome` e data da licitação na resposta de `GET /api/itens/buscar`; adicionar filtro opcional `tipo`.
2. **Backend:** Criar `GET /api/itens/:id/detalhe` (item + licitação).
3. **Frontend:** Página ou fluxo “Busca de itens” com: filtros (Descrição, Tipo, Município + Raio), chamada a `GET /api/itens/buscar`, listagem em cards com os campos acima, paginação.
4. **Frontend:** Ao clicar em um card, abrir modal/sheet com abas Propostas e Detalhes consumindo `GET /api/itens/:id/detalhe`.
5. **Frontend:** Checkbox nos cards + botão “Adicionar selecionados à cotação” e integração com a cotação atual (criar itens e, se existir, vínculo com `itemLicitacaoId`).
6. **Backend (opcional):** `GET /api/municipios?q=` para o filtro de cidade; front usa isso para preencher lat/lng + raio.

Com isso, a tela fica coerente com “não temos fontes para selecionar” e usa apenas **raio de distância da cidade** e **tipo (material/serviço/ambos)** como filtros, além da **descrição**, com sessão de pesquisa, cards e detalhe ao clicar, usando apenas informações que vocês já têm ou que o backend pode expor com esses ajustes.
