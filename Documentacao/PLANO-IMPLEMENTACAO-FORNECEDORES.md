# Plano de Implementação: Dados do Fornecedor Vencedor

**Objetivo:** Adicionar informações do fornecedor que ganhou cada item da licitação, com otimização para evitar chamadas duplicadas nas APIs externas.

---

## 📊 1. MODELAGEM DO BANCO DE DADOS

### Tabela: `fornecedores`

```sql
CREATE TABLE fornecedores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Dados básicos (PNCP)
  cnpj VARCHAR(18) NOT NULL, -- Formato: 00.000.000/0000-00
  tipo_pessoa VARCHAR(2) DEFAULT 'PJ', -- PJ ou PF

  -- Dados detalhados (ReceitaWS)
  razao_social VARCHAR(500) NOT NULL,
  nome_fantasia VARCHAR(500),
  porte VARCHAR(100),
  natureza_juridica VARCHAR(200),
  situacao VARCHAR(50),
  data_abertura DATE,

  -- Endereço
  logradouro VARCHAR(500),
  numero VARCHAR(20),
  complemento VARCHAR(200),
  bairro VARCHAR(200),
  municipio VARCHAR(200),
  uf VARCHAR(2),
  cep VARCHAR(10),

  -- Contato
  email VARCHAR(200),
  telefone VARCHAR(50),

  -- Atividades (JSON)
  atividade_principal JSONB, -- {code, text}
  atividades_secundarias JSONB, -- [{code, text}, ...]

  -- Controle
  dados_completos BOOLEAN DEFAULT false, -- true se buscou na ReceitaWS
  ultima_atualizacao_receita TIMESTAMP, -- quando buscou na ReceitaWS
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),

  UNIQUE (tenant_id, cnpj)
);

CREATE INDEX idx_fornecedores_cnpj ON fornecedores(cnpj);
CREATE INDEX idx_fornecedores_tenant ON fornecedores(tenant_id);
```

### Tabela: `itens_licitacao_fornecedores` (nova coluna)

**Alteração na tabela existente `itens_licitacao`:**

```sql
ALTER TABLE itens_licitacao
ADD COLUMN fornecedor_id UUID REFERENCES fornecedores(id) ON DELETE SET NULL;

CREATE INDEX idx_itens_licitacao_fornecedor ON itens_licitacao(fornecedor_id);
```

**OU criar tabela de junção (se quiser histórico completo):**

```sql
CREATE TABLE itens_licitacao_resultados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_licitacao_id UUID NOT NULL REFERENCES itens_licitacao(id) ON DELETE CASCADE,
  fornecedor_id UUID NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,

  -- Dados do resultado (da API PNCP)
  numero_item INTEGER NOT NULL,
  valor_total_homologado DECIMAL(15,4),
  quantidade_homologada DECIMAL(15,4),
  valor_unitario_homologado DECIMAL(15,4),
  percentual_desconto DECIMAL(5,2),
  ordem_classificacao INTEGER,
  data_resultado DATE,
  situacao_resultado_id INTEGER,
  situacao_resultado_nome VARCHAR(100),

  -- Controle
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW(),

  UNIQUE (item_licitacao_id, numero_item)
);
```

**Recomendação:** Usar a **primeira abordagem** (adicionar coluna `fornecedor_id`) se você só precisa do fornecedor vencedor. Usar a **segunda** se quer histórico completo de todos os resultados.

---

## 🔄 2. FLUXO DE BUSCA E ARMAZENAMENTO

### Fluxo Principal:

```
1. Usuário vincula item de licitação ao projeto
   ↓
2. Backend: Verificar se item_licitacao já tem fornecedor_id
   ↓ NÃO
3. Backend: Buscar na API PNCP resultados do item
   ↓
4. Backend: Extrair niFornecedor (CNPJ)
   ↓
5. Backend: Verificar se fornecedor já existe no banco (por CNPJ + tenant_id)
   ↓ NÃO
6. Backend: Buscar dados completos na ReceitaWS
   ↓
7. Backend: Salvar fornecedor no banco
   ↓ SIM (já existe)
8. Backend: Atualizar item_licitacao.fornecedor_id
   ↓
9. Backend: Retornar dados do item + fornecedor
```

### Otimizações:

#### ✅ **Otimização 1: Cache no item_licitacao**
```typescript
// Ao buscar item de licitação, verificar se já tem fornecedor vinculado
if (itemLicitacao.fornecedorId) {
  // JÁ TEM! Não chamar API PNCP
  const fornecedor = await getFornecedor(itemLicitacao.fornecedorId);
  return { itemLicitacao, fornecedor };
}
```

#### ✅ **Otimização 2: Verificar fornecedor por CNPJ antes de buscar ReceitaWS**
```typescript
// Antes de chamar ReceitaWS
const fornecedorExistente = await db.fornecedores.findOne({
  where: { cnpj: niFornecedor, tenantId }
});

if (fornecedorExistente) {
  // JÁ EXISTE! Apenas vincular
  return fornecedorExistente;
}
```

#### ✅ **Otimização 3: Batch processing para múltiplos itens**
```typescript
// Ao vincular VÁRIOS itens de uma mesma licitação:
// 1. Agrupar por licitação (cnpj/ano/sequencial)
// 2. Buscar resultados UMA vez
// 3. Mapear fornecedores únicos (por CNPJ)
// 4. Buscar na ReceitaWS apenas CNPJs novos
```

#### ✅ **Otimização 4: Flag dados_completos**
```typescript
// Se já existe fornecedor mas sem dados completos:
if (fornecedor && !fornecedor.dadosCompletos) {
  // Buscar na ReceitaWS e atualizar
  const dadosReceita = await receitaWS.buscar(fornecedor.cnpj);
  await updateFornecedor(fornecedor.id, dadosReceita);
}
```

---

## 🛠️ 3. ESTRUTURA DE CÓDIGO (Backend)

### 3.1. Services

**`src/services/fornecedores.service.ts`**

```typescript
interface DadosFornecedorPNCP {
  niFornecedor: string;
  tipoPessoa: string;
  nomeRazaoSocialFornecedor: string;
  valorUnitarioHomologado: number;
  quantidadeHomologada: number;
  numeroItem: number;
  // ... outros campos
}

interface DadosFornecedorReceita {
  cnpj: string;
  nome: string;
  fantasia: string;
  porte: string;
  natureza_juridica: string;
  situacao: string;
  abertura: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  atividade_principal: Array<{code: string, text: string}>;
  atividades_secundarias: Array<{code: string, text: string}>;
}

class FornecedoresService {
  /**
   * Busca ou cria fornecedor a partir de um item de licitação
   * Fluxo completo com otimizações
   */
  async buscarOuCriarFornecedor(
    itemLicitacaoId: string,
    tenantId: string
  ): Promise<Fornecedor> {
    // 1. Verificar se item já tem fornecedor vinculado
    const itemLicitacao = await db.itensLicitacao.findByPk(itemLicitacaoId);

    if (itemLicitacao.fornecedorId) {
      return await db.fornecedores.findByPk(itemLicitacao.fornecedorId);
    }

    // 2. Buscar resultado na API PNCP
    const dadosPNCP = await this.buscarResultadoPNCP(itemLicitacao);

    if (!dadosPNCP || !dadosPNCP.niFornecedor) {
      throw new Error('Fornecedor não encontrado no PNCP');
    }

    // 3. Verificar se fornecedor já existe no banco
    let fornecedor = await db.fornecedores.findOne({
      where: { cnpj: dadosPNCP.niFornecedor, tenantId }
    });

    if (!fornecedor) {
      // 4. Buscar dados completos na ReceitaWS
      const dadosReceita = await this.buscarDadosReceita(dadosPNCP.niFornecedor);

      // 5. Criar fornecedor
      fornecedor = await db.fornecedores.create({
        tenantId,
        cnpj: dadosPNCP.niFornecedor,
        tipoPessoa: dadosPNCP.tipoPessoa,
        razaoSocial: dadosReceita.nome,
        nomeFantasia: dadosReceita.fantasia,
        porte: dadosReceita.porte,
        naturezaJuridica: dadosReceita.natureza_juridica,
        situacao: dadosReceita.situacao,
        dataAbertura: this.parseDate(dadosReceita.abertura),
        logradouro: dadosReceita.logradouro,
        numero: dadosReceita.numero,
        complemento: dadosReceita.complemento,
        bairro: dadosReceita.bairro,
        municipio: dadosReceita.municipio,
        uf: dadosReceita.uf,
        cep: dadosReceita.cep,
        email: dadosReceita.email,
        telefone: dadosReceita.telefone,
        atividadePrincipal: dadosReceita.atividade_principal,
        atividadesSecundarias: dadosReceita.atividades_secundarias,
        dadosCompletos: true,
        ultimaAtualizacaoReceita: new Date(),
      });
    } else if (!fornecedor.dadosCompletos) {
      // Atualizar com dados completos se ainda não tem
      const dadosReceita = await this.buscarDadosReceita(fornecedor.cnpj);
      await this.atualizarDadosCompletos(fornecedor.id, dadosReceita);
    }

    // 6. Vincular fornecedor ao item de licitação
    await itemLicitacao.update({ fornecedorId: fornecedor.id });

    return fornecedor;
  }

  /**
   * Busca resultados de um item na API PNCP
   */
  async buscarResultadoPNCP(itemLicitacao: ItemLicitacao): Promise<DadosFornecedorPNCP> {
    const { cnpjOrgao, anoCompra, sequencialCompra, numeroItem } = itemLicitacao;

    const url = `https://pncp.gov.br/api/pncp/v1/orgaos/${cnpjOrgao}/compras/${anoCompra}/${sequencialCompra}/itens/${numeroItem}/resultados`;

    const response = await axios.get(url);

    // Retorna o primeiro resultado (vencedor)
    return response.data[0];
  }

  /**
   * Busca dados do CNPJ na ReceitaWS
   */
  async buscarDadosReceita(cnpj: string): Promise<DadosFornecedorReceita> {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    const url = `https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`;

    const response = await axios.get(url);

    if (response.data.status === 'ERROR') {
      throw new Error(`Erro ao buscar CNPJ: ${response.data.message}`);
    }

    return response.data;
  }

  /**
   * Processa múltiplos itens de uma vez (otimização)
   */
  async processarLoteItens(itemLicitacaoIds: string[], tenantId: string) {
    const resultados = [];

    for (const itemId of itemLicitacaoIds) {
      try {
        const fornecedor = await this.buscarOuCriarFornecedor(itemId, tenantId);
        resultados.push({ itemId, fornecedor, sucesso: true });
      } catch (error) {
        resultados.push({ itemId, erro: error.message, sucesso: false });
      }
    }

    return resultados;
  }
}
```

### 3.2. Endpoints (Backend)

**`src/routes/fornecedores.routes.ts`**

```typescript
// GET /api/fornecedores/:id
// Buscar fornecedor por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.query;

  const fornecedor = await db.fornecedores.findOne({
    where: { id, tenantId }
  });

  res.json({ success: true, fornecedor });
});

// POST /api/itens-licitacao/:id/vincular-fornecedor
// Busca e vincula fornecedor ao item de licitação
router.post('/:id/vincular-fornecedor', async (req, res) => {
  const { id } = req.params;
  const { tenantId } = req.body;

  try {
    const fornecedor = await fornecedoresService.buscarOuCriarFornecedor(id, tenantId);

    res.json({
      success: true,
      fornecedor,
      message: 'Fornecedor vinculado com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// POST /api/itens-licitacao/vincular-fornecedores-lote
// Processa vários itens de uma vez
router.post('/vincular-fornecedores-lote', async (req, res) => {
  const { itemLicitacaoIds, tenantId } = req.body;

  const resultados = await fornecedoresService.processarLoteItens(
    itemLicitacaoIds,
    tenantId
  );

  res.json({ success: true, resultados });
});
```

### 3.3. Atualizar endpoint de buscar item

**`src/routes/itens.routes.ts`** (já existente)

```typescript
// GET /api/itens/:id
// Incluir fornecedor no retorno
router.get('/:id', async (req, res) => {
  const item = await db.projetoItens.findByPk(req.params.id);

  const fontes = await db.itemFontes.findAll({
    where: { projetoItemId: item.id },
    include: [
      {
        model: db.itensLicitacao,
        as: 'itemLicitacao',
        include: [
          {
            model: db.fornecedores,
            as: 'fornecedor' // <<<< INCLUIR FORNECEDOR
          }
        ]
      }
    ]
  });

  res.json({ success: true, item, fontes });
});
```

---

## 🎨 4. ESTRUTURA DE CÓDIGO (Frontend)

### 4.1. Types

**`src/services/projetos.ts`** (atualizar)

```typescript
export interface Fornecedor {
  id: string;
  cnpj: string;
  tipoPessoa: 'PJ' | 'PF';
  razaoSocial: string;
  nomeFantasia?: string;
  porte?: string;
  naturezaJuridica?: string;
  situacao?: string;
  dataAbertura?: string;

  // Endereço
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;

  // Contato
  email?: string;
  telefone?: string;

  // Atividades
  atividadePrincipal?: { code: string; text: string };
  atividadesSecundarias?: Array<{ code: string; text: string }>;

  dadosCompletos: boolean;
  criadoEm: string;
}

export interface ItemFonteDetalhada extends ItemFonte {
  // ... campos existentes

  // NOVO: Dados do fornecedor
  fornecedor?: Fornecedor;
}
```

### 4.2. Service

**`src/services/fornecedores.ts`** (novo)

```typescript
export const fornecedoresService = {
  /**
   * Buscar fornecedor por ID
   */
  buscarPorId: async (id: string): Promise<ApiResponse<{ fornecedor: Fornecedor }>> => {
    const { tenantId } = getAuthParams();
    const response = await api.get(`/fornecedores/${id}`, {
      params: { tenantId }
    });
    return response.data;
  },

  /**
   * Vincular fornecedor a um item de licitação
   */
  vincularFornecedor: async (
    itemLicitacaoId: string
  ): Promise<ApiResponse<{ fornecedor: Fornecedor }>> => {
    const { tenantId } = getAuthParams();
    const response = await api.post(
      `/itens-licitacao/${itemLicitacaoId}/vincular-fornecedor`,
      { tenantId }
    );
    return response.data;
  },
};
```

### 4.3. Componente de exibição

**`src/components/fornecedor/DetalhesFornecedor.tsx`** (novo)

```typescript
interface DetalhesFornecedorProps {
  fornecedor: Fornecedor;
}

export function DetalhesFornecedor({ fornecedor }: DetalhesFornecedorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm text-muted-foreground mb-2">
          Fornecedor Vencedor
        </h4>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Razão Social</p>
            <p className="font-semibold">{fornecedor.razaoSocial}</p>
          </div>

          {fornecedor.nomeFantasia && (
            <div>
              <p className="text-xs text-muted-foreground">Nome Fantasia</p>
              <p className="font-medium">{fornecedor.nomeFantasia}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-muted-foreground">CNPJ</p>
              <p className="font-mono text-sm">{fornecedor.cnpj}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Porte</p>
              <p className="text-sm">{fornecedor.porte ?? '—'}</p>
            </div>
          </div>

          {fornecedor.municipio && (
            <div>
              <p className="text-xs text-muted-foreground">Localização</p>
              <p className="text-sm">
                {fornecedor.municipio} / {fornecedor.uf}
              </p>
            </div>
          )}

          {fornecedor.telefone && (
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm">{fornecedor.telefone}</p>
            </div>
          )}

          {fornecedor.atividadePrincipal && (
            <div>
              <p className="text-xs text-muted-foreground">Atividade Principal</p>
              <p className="text-sm">{fornecedor.atividadePrincipal.text}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### 4.4. Integrar no CardFonteExpandivel

**Atualizar aba "Detalhes":**

```typescript
<TabsContent value="detalhes" className="mt-4 space-y-4">
  {/* Dados da licitação */}
  <dl className="grid gap-3 text-sm">
    {/* ... campos existentes ... */}
  </dl>

  {/* NOVO: Dados do fornecedor */}
  {fonte.fornecedor && (
    <DetalhesFornecedor fornecedor={fonte.fornecedor} />
  )}

  {!fonte.fornecedor && (
    <Button
      variant="outline"
      size="sm"
      onClick={() => vincularFornecedor(fonte.itemLicitacaoId)}
    >
      Buscar dados do fornecedor
    </Button>
  )}
</TabsContent>
```

---

## 📋 5. CHECKLIST DE IMPLEMENTAÇÃO

### Backend (Ordem de execução)

- [ ] **Passo 1:** Criar migration para tabela `fornecedores`
- [ ] **Passo 2:** Adicionar coluna `fornecedor_id` em `itens_licitacao`
- [ ] **Passo 3:** Criar model `Fornecedor` (Sequelize/TypeORM)
- [ ] **Passo 4:** Criar `FornecedoresService` com métodos:
  - [ ] `buscarResultadoPNCP()`
  - [ ] `buscarDadosReceita()`
  - [ ] `buscarOuCriarFornecedor()`
  - [ ] `atualizarDadosCompletos()`
- [ ] **Passo 5:** Criar rotas:
  - [ ] `GET /api/fornecedores/:id`
  - [ ] `POST /api/itens-licitacao/:id/vincular-fornecedor`
- [ ] **Passo 6:** Atualizar endpoint `GET /api/itens/:id` para incluir fornecedor
- [ ] **Passo 7:** Testar APIs externas (PNCP e ReceitaWS)

### Frontend (Ordem de execução)

- [ ] **Passo 8:** Atualizar types em `projetos.ts`
  - [ ] Interface `Fornecedor`
  - [ ] Adicionar `fornecedor?` em `ItemFonteDetalhada`
- [ ] **Passo 9:** Criar `fornecedores.service.ts`
- [ ] **Passo 10:** Criar componente `DetalhesFornecedor.tsx`
- [ ] **Passo 11:** Atualizar `CardFonteExpandivel.tsx` para mostrar fornecedor
- [ ] **Passo 12:** Adicionar botão "Buscar fornecedor" (se não existir)
- [ ] **Passo 13:** Testar fluxo completo

### Testes

- [ ] **Teste 1:** Vincular item sem fornecedor (busca completa)
- [ ] **Teste 2:** Vincular item com fornecedor já existente (reutilização)
- [ ] **Teste 3:** Vincular múltiplos itens da mesma licitação
- [ ] **Teste 4:** Tratamento de erro (API indisponível)
- [ ] **Teste 5:** Verificar performance (tempo de resposta)

---

## ⚠️ 6. CONSIDERAÇÕES IMPORTANTES

### Limitações da ReceitaWS

- **Limite de requisições:** ~3 req/min (versão gratuita)
- **Solução:** Implementar retry com backoff exponencial
- **Alternativa:** Usar API paga ou cache mais agressivo

### Tratamento de erros

```typescript
try {
  const dadosReceita = await receitaWS.buscar(cnpj);
} catch (error) {
  // Se ReceitaWS falhar, salvar apenas dados básicos do PNCP
  fornecedor = await db.fornecedores.create({
    cnpj,
    razaoSocial: dadosPNCP.nomeRazaoSocialFornecedor,
    dadosCompletos: false, // Marcar como incompleto
  });
}
```

### Performance

- **Background job:** Buscar fornecedores em background (queue)
- **Webhook:** Notificar usuário quando fornecedor estiver pronto
- **Loading state:** Mostrar "Buscando fornecedor..." no card

### Privacidade e LGPD

- Dados de fornecedores são públicos (PNCP/Receita Federal)
- Mas armazene apenas o necessário
- Implemente TTL para atualizar dados periodicamente (ex: 6 meses)

---

## 🎯 7. RESULTADO ESPERADO

### No CardFonteExpandivel (aba Detalhes):

```
┌─ Detalhes da Licitação ──────────┐
│ Descrição: Notebook Dell...      │
│ Órgão: Prefeitura de BH          │
│ Quantidade: 10 UN                 │
│ Valor: R$ 2.500,00                │
└───────────────────────────────────┘

┌─ Fornecedor Vencedor ────────────┐
│ Razão Social:                     │
│ TB ORGANIZACOES DE EVENTOS LTDA   │
│                                   │
│ CNPJ: 47.594.466/0001-26         │
│ Porte: Não Informado              │
│ Localização: São Paulo / SP       │
│ Telefone: (11) 9999-9999         │
│                                   │
│ Atividade Principal:              │
│ Comércio de material hospitalar   │
└───────────────────────────────────┘
```

---

Este plano garante **otimização**, **escalabilidade** e **boa experiência do usuário**! 🚀
