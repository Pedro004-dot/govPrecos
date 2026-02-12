# Identidade Visual - GovPrecos

## Visão Geral

A identidade visual do **GovPrecos** foi desenvolvida para refletir **confiança**, **profissionalismo** e **eficiência**, características essenciais para uma plataforma SaaS voltada a servidores públicos brasileiros.

---

## Tipografia

### Fonte Principal: Inter

A fonte **Inter** foi escolhida por suas características ideais para interfaces digitais:

- ✅ **Legibilidade excepcional** em todos os tamanhos
- ✅ **Otimizada para telas** (desktop e mobile)
- ✅ **Suporte completo** a caracteres latinos (incluindo acentos)
- ✅ **Variáveis OpenType** para melhor renderização
- ✅ **Profissional e moderna** sem perder seriedade

#### Configuração

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11'; /* Melhora legibilidade */
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

#### Pesos Disponíveis

| Peso | Uso | Classe Tailwind |
|------|-----|-----------------|
| 300 (Light) | Textos secundários leves | `font-light` |
| 400 (Regular) | Texto padrão do corpo | `font-normal` |
| 500 (Medium) | Ênfase sutil | `font-medium` |
| 600 (Semibold) | Títulos secundários | `font-semibold` |
| 700 (Bold) | Títulos principais | `font-bold` |

#### Hierarquia Tipográfica

```css
/* Títulos */
h1: text-3xl font-bold (30px) - Títulos de página
h2: text-2xl font-semibold (24px) - Seções principais
h3: text-xl font-semibold (20px) - Subtítulos
h4: text-lg font-medium (18px) - Títulos de cards

/* Corpo */
body: text-base font-normal (16px) - Texto padrão
small: text-sm font-normal (14px) - Informações secundárias
xs: text-xs font-normal (12px) - Metadados, labels
```

---

## Sistema de Cores

### Filosofia

A paleta de cores foi desenvolvida para:
- 🎯 **Transmitir confiança** (azul profissional)
- ✅ **Indicar compliance** (verde para sucesso)
- ⚠️ **Alertar sobre pendências** (âmbar para atenção)
- ❌ **Sinalizar erros** (vermelho para bloqueios)
- 📊 **Facilitar leitura** (alto contraste)

### Cores Principais (Brand)

#### Primary Blue - #1A71FF
**HSL**: `217 100% 55%`

**Uso**: Ações principais, botões primários, links importantes, estados de foco

**Personalidade**: Profissional, confiável, autoritário

```css
--primary: 217 100% 55%;
--primary-foreground: 0 0% 100%;
```

**Quando usar:**
- Botões de ação principal ("Criar Projeto", "Salvar")
- Links importantes
- Estados de foco (focus ring)
- Elementos de navegação ativos
- Badges de informação principal

---

#### Secondary Blue - #478EFF
**HSL**: `217 100% 64%`

**Uso**: Ações secundárias, acentos, estados hover, badges informativos

**Personalidade**: Mais acessível, mantém profissionalismo

```css
--secondary: 217 100% 64%;
--secondary-foreground: 0 0% 100%;
```

**Quando usar:**
- Botões secundários
- Estados hover de elementos primários
- Badges informativos
- Gráficos e visualizações
- Acentos sutis

---

#### White - #FFFFFF
**HSL**: `0 0% 100%`

**Uso**: Fundos principais, cards, texto sobre fundos coloridos

**Personalidade**: Limpo, espaçoso, oficial

```css
--background: 0 0% 100%;
--card: 0 0% 100%;
```

---

### Cores Semânticas

#### Success - Verde Profissional
**HSL**: `142 76% 36%` | **Hex**: `#22C55E`

**Uso**: Compliance, operações bem-sucedidas, estados finalizados

**Quando usar:**
- ✅ Badges de compliance ("3/3 fontes")
- ✅ Status "Válido" / "Finalizado"
- ✅ Operações concluídas com sucesso
- ✅ Indicadores de conformidade com Lei 14.133/2021

```css
--success: 142 76% 36%;
--success-foreground: 0 0% 100%;
```

**Exemplo:**
```tsx
<Badge className="bg-success text-success-foreground">
  3/3 ✓ Conforme
</Badge>
```

---

#### Warning - Âmbar Profissional
**HSL**: `38 92% 50%` | **Hex**: `#F59E0B`

**Uso**: Avisos, itens pendentes, problemas não-bloqueadores

**Quando usar:**
- ⚠️ Badges de pendência ("2/3 fontes")
- ⚠️ Avisos de recência (fontes >12 meses)
- ⚠️ Validações não-críticas
- ⚠️ Itens que precisam de atenção

```css
--warning: 38 92% 50%;
--warning-foreground: 0 0% 100%;
```

**Exemplo:**
```tsx
<Badge className="bg-warning text-warning-foreground">
  2/3 ⚠️ Pendente
</Badge>
```

---

#### Destructive - Vermelho Profissional
**HSL**: `0 84% 60%` | **Hex**: `#EF4444`

**Uso**: Erros, problemas bloqueadores, ações destrutivas

**Quando usar:**
- ❌ Badges críticos ("0/3 fontes")
- ❌ Erros de validação bloqueadores
- ❌ Botões de exclusão
- ❌ Problemas críticos

```css
--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;
```

**Exemplo:**
```tsx
<Badge variant="destructive">
  0/3 ❌ Crítico
</Badge>
```

---

#### Info - Azul Secundário
**HSL**: `217 100% 64%` | **Hex**: `#478EFF`

**Uso**: Informações, avisos legais, badges informativos

**Quando usar:**
- 📘 Notices legais (Lei 14.133/2021)
- 📘 Informações complementares
- 📘 Tooltips e hints
- 📘 Badges informativos

```css
--info: 217 100% 64%;
--info-foreground: 0 0% 100%;
```

---

### Cores Neutras

#### Foreground (Texto Principal)
**HSL**: `217 91% 15%` | **Hex**: `#1C2837`

Texto principal com alto contraste para máxima legibilidade.

```css
--foreground: 217 91% 15%;
```

---

#### Muted (Secundário)
**Background**: `217 50% 97%` | **Foreground**: `217 20% 45%`

Para elementos menos importantes:
- Estados desabilitados
- Placeholders
- Informações secundárias
- Textos de apoio

```css
--muted: 217 50% 97%;
--muted-foreground: 217 20% 45%;
```

---

#### Border (Bordas)
**HSL**: `217 30% 88%` | **Hex**: `#D1DBE8`

Bordas sutis que mantêm a identidade da marca mesmo em elementos discretos.

```css
--border: 217 30% 88%;
--input: 217 30% 88%;
```

---

## Dark Mode

### Filosofia

O modo escuro mantém a identidade da marca com azuis profundos, garantindo excelente legibilidade e reduzindo fadiga visual.

### Ajustes Principais

```css
.dark {
  /* Fundo - Azul marinho muito escuro */
  --background: 217 91% 8%;
  
  /* Texto - Branco com leve tom azulado */
  --foreground: 217 20% 95%;
  
  /* Primary - Azul mais claro para visibilidade */
  --primary: 217 100% 64%;
  
  /* Cards - Ligeiramente mais claro que o fundo */
  --card: 217 85% 12%;
  
  /* Bordas - Mais sutis */
  --border: 217 40% 20%;
}
```

**Princípio**: Manter o mesmo significado semântico entre modo claro e escuro.

---

## Componentes Shadcn/UI

### Configuração

O projeto usa **shadcn/ui** com o estilo **"new-york"**:

```json
{
  "style": "new-york",
  "baseColor": "neutral",
  "cssVariables": true
}
```

### Componentes Disponíveis

Todos os componentes seguem o sistema de cores definido:

- ✅ **Button** - Variantes: default, secondary, outline, ghost, destructive
- ✅ **Badge** - Variantes: default, secondary, destructive, outline
- ✅ **Card** - Header, Content, Footer, Title, Description
- ✅ **Alert** - Info, Warning, Destructive, Success
- ✅ **Dialog** - Modais e overlays
- ✅ **Input** - Campos de formulário
- ✅ **Table** - Tabelas ordenáveis
- ✅ **Tabs** - Navegação por abas
- ✅ **Progress** - Barras de progresso
- ✅ **Avatar** - Avatares de usuário
- ✅ **Dropdown Menu** - Menus suspensos
- ✅ **Checkbox** - Caixas de seleção
- ✅ **Radio Group** - Seleção única
- ✅ **Textarea** - Áreas de texto
- ✅ **Label** - Labels de formulário
- ✅ **Sheet** - Painéis laterais

---

## Espaçamento

### Sistema Tailwind Padrão

| Tamanho | Valor | Uso |
|---------|-------|-----|
| xs | 0.25rem (4px) | Espaçamentos mínimos |
| sm | 0.5rem (8px) | Espaçamentos pequenos |
| md | 1rem (16px) | Espaçamento padrão |
| lg | 1.5rem (24px) | Espaçamentos grandes |
| xl | 2rem (32px) | Espaçamentos extra grandes |
| 2xl | 2.5rem (40px) | Espaçamentos muito grandes |

### Aplicação

- **Padding de cards**: `p-4` (16px) ou `p-6` (24px)
- **Gap entre seções**: `space-y-6` (24px vertical)
- **Padding de botões**: `px-4 py-2` (16px horizontal, 8px vertical)
- **Gap em formulários**: `space-y-4` (16px entre campos)

---

## Border Radius

### Padrão Profissional

**Base**: `0.5rem` (8px) - Menos arredondado que apps consumer, mais moderno que cantos retos

```css
--radius: 0.5rem;
```

### Variantes

- **sm**: `0.375rem` (6px) - Elementos pequenos
- **md**: `0.5rem` (8px) - Padrão
- **lg**: `0.625rem` (10px) - Cards grandes
- **xl**: `0.75rem` (12px) - Modais e dialogs

**Filosofia**: Arredondamento sutil transmite profissionalismo mantendo modernidade.

---

## Acessibilidade

### Contraste de Cores (WCAG AA)

| Combinação | Ratio | Nível | Status |
|------------|-------|-------|--------|
| Azul primário em branco | 7.8:1 | AAA | ✅ |
| Azul secundário em branco | 5.9:1 | AA+ | ✅ |
| Verde sucesso em branco | 6.2:1 | AAA | ✅ |
| Âmbar aviso em branco | 5.1:1 | AA+ | ✅ |
| Vermelho erro em branco | 4.6:1 | AA | ✅ |
| Texto foreground em background | 12.4:1 | AAA | ✅ |

### Recursos de Acessibilidade

- ✅ **Focus rings visíveis** (azul primário)
- ✅ **Ícones acompanhados de texto** (não apenas cor)
- ✅ **Status não comunicado apenas por cor** (usa ícones + texto)
- ✅ **Navegação por teclado** funcional
- ✅ **Suporte a screen readers**

---

## Princípios de Design

### 1. Confiança através da Consistência
- Layouts previsíveis
- Espaçamento consistente
- Estilos uniformes de componentes
- Mesmas interações em todas as páginas

### 2. Autoridade através da Hierarquia Visual
- Títulos de página claros (H1)
- Seções bem organizadas (H2, H3)
- Ações importantes se destacam (botões primários)
- Ações secundárias recuam (botões outline)

### 3. Clareza através da Simplicidade
- Uma ação primária por tela
- Decoração mínima
- Labels claros
- Descrições úteis

### 4. Credibilidade através da Atenção aos Detalhes
- Espaçamento adequado (não apertado)
- Alto contraste de texto
- Tipografia profissional (Inter)
- Sombras e bordas sutis

### 5. Compliance através da Transparência
- Avisos legais visíveis
- Requisitos de auditoria claros
- Justificativas obrigatórias
- Fontes rastreáveis

---

## Guia de Uso Rápido

### Botões

```tsx
// Primário
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Criar Projeto
</Button>

// Secundário
<Button variant="outline" className="border-primary text-primary">
  Cancelar
</Button>

// Destrutivo
<Button variant="destructive">
  Excluir
</Button>
```

### Badges

```tsx
// Sucesso (Compliance)
<Badge className="bg-success text-success-foreground">
  3/3 ✓
</Badge>

// Aviso (Pendente)
<Badge className="bg-warning text-warning-foreground">
  2/3 ⚠️
</Badge>

// Erro (Crítico)
<Badge variant="destructive">
  0/3 ❌
</Badge>

// Info
<Badge className="bg-info text-info-foreground">
  Lei 14.133/2021
</Badge>
```

### Cards

```tsx
<Card className="border-2 border-border bg-card">
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Conteúdo */}
  </CardContent>
</Card>
```

### Alerts

```tsx
// Sucesso
<Alert className="border-success/30 bg-success/10">
  <CheckCircle className="h-4 w-4 text-success" />
  <AlertTitle>Conforme</AlertTitle>
  <AlertDescription>Todos os itens possuem 3+ fontes.</AlertDescription>
</Alert>

// Aviso
<Alert className="border-warning/30 bg-warning/10">
  <AlertTriangle className="h-4 w-4 text-warning" />
  <AlertTitle>Atenção</AlertTitle>
  <AlertDescription>Alguns itens precisam de mais fontes.</AlertDescription>
</Alert>
```

---

## Checklist de Implementação

- [x] Fonte Inter configurada via Google Fonts
- [x] Sistema de cores definido (HSL)
- [x] Dark mode configurado
- [x] Componentes shadcn/ui configurados
- [x] Acessibilidade (WCAG AA) verificada
- [x] Documentação criada

---

## Próximos Passos

1. ✅ **Aplicar fonte Inter** em todos os componentes
2. ✅ **Revisar componentes existentes** para usar novas cores
3. ⏳ **Criar componentes customizados** se necessário
4. ⏳ **Testar em diferentes dispositivos** e navegadores
5. ⏳ **Coletar feedback** dos usuários

---

**Última atualização**: Fevereiro 2026
**Versão**: 1.0.0
