# Testing Guide - Law 14.133/2021 Compliance System

## Overview
This guide covers end-to-end testing of the compliance-first workflow for procurement price research according to Brazilian Law 14.133/2021.

---

## Test Environment Setup

### Prerequisites
1. Backend server running at `http://localhost:3000`
2. Frontend dev server running at `http://localhost:5173`
3. Supabase database with migrations applied
4. Test tenant and user credentials

### Sample Test Data
- **Tenant ID**: Use your configured tenant
- **User ID**: Use your configured user
- **Test Items**: Lápis, Caderno, Borracha (school supplies)

---

## End-to-End Test Scenarios

### Scenario 1: Happy Path - Complete Compliance Workflow

**Objective**: Create a compliant project from scratch to PDF generation

#### Steps:

1. **Dashboard → Create Project**
   - Navigate to `/`
   - Click "Criar Novo Projeto"
   - Fill in project details:
     - Nome: "Material Escolar 2026"
     - Descrição: "Aquisição de material escolar para ano letivo"
     - Número do Processo: "001/2026"
     - Objeto: "Material de escritório e escolar"
   - Click "Salvar Projeto"
   - **Expected**: Redirect to project details page

2. **Add Items to Project**
   - Click "Editar" or navigate to `/projeto/:id/editar`
   - Add 3 items:
     - Item 1: Lápis nº 2 Preto | 500 | UN
     - Item 2: Caderno 96 folhas | 200 | UN
     - Item 3: Borracha branca | 300 | UN
   - **Expected**: Items show with "0/3 ⚠️" source counter

3. **Link Sources to Item 1**
   - Click "Gerenciar Fontes" on Item 1
   - Navigate to `/item/:id/fontes`
   - **Expected**: Warning banner "Precisa de 3 fontes"
   - Click "+ Adicionar Fontes"
   - Search page opens with context banner
   - Search for "lápis"
   - Select 3 items
   - **Expected**: Source counter shows "3/3 ✓"
   - Click "Vincular ao Item"
   - **Expected**: Redirect to ItemSourceManager, median calculated

4. **Review and Ignore Outlier (Item 1)**
   - On ItemSourceManager page
   - Identify source with >30% deviation
   - Click "Ignorar"
   - **Expected**: OutlierDialog opens with:
     - Price comparison (source vs median)
     - Percentage deviation badge
     - Legal compliance notice
   - Enter justification (min 10 chars): "Preço muito acima da mediana do mercado, desconsiderado conforme análise estatística"
   - Click "Confirmar Exclusão"
   - **Expected**:
     - Source moved to "Ignoradas" section
     - Median recalculated
     - Orange card with justification shown

5. **Link Sources to Items 2 and 3**
   - Repeat step 3 for remaining items
   - **Expected**: All items show "3/3 ✓"

6. **Validate Project**
   - Navigate to `/projeto/:id`
   - **Expected**:
     - Real-time validation widget shows green "Projeto Conforme"
     - No validation errors
     - Finalization checklist shows all checks passed

7. **Finalize Project**
   - Scroll to "Checklist de Finalização"
   - **Expected**:
     - ✅ Projeto possui itens (3 items)
     - ✅ Mínimo 3 fontes por item (all compliant)
     - ✅ Mediana calculada para todos os itens
     - ✅ Validação de conformidade (válido)
     - Button enabled: "Finalizar Projeto"
   - Click "Finalizar Projeto"
   - **Expected**:
     - Success message
     - Project status changes to "finalizado"
     - PDF generation card appears

8. **Generate PDF Report**
   - Scroll to "Relatório de Conformidade"
   - **Expected**: Green card with PDF contents list
   - Click "Baixar Relatório"
   - **Expected**:
     - Loading state shown
     - PDF downloads automatically
     - Success alert appears
     - Timestamp shown
   - Optional: Click "Visualizar PDF"
   - **Expected**: PDF opens in new tab

9. **Verify PDF Contents**
   - Open downloaded PDF
   - **Expected sections**:
     - ✅ Cover page with project details
     - ✅ Methodology section (Law 14.133/2021)
     - ✅ Per-item tables with PNCP links
     - ✅ Outlier justifications
     - ✅ Summary table with totals
     - ✅ Signature section

---

### Scenario 2: Warning Path - Finalize with Justification

**Objective**: Finalize project with pending items (requires justification)

#### Steps:

1-2. Same as Scenario 1

3. **Link Only 2 Sources to Item 1**
   - Link 2 sources instead of 3
   - **Expected**: Source counter shows "2/3 ⚠️"

4. **Link 3 Sources to Items 2 and 3**
   - Complete other items normally

5. **Attempt Validation**
   - Navigate to project details
   - **Expected**:
     - Real-time validation shows orange "Pendências Encontradas"
     - ValidationAlert shows error: "Item 1 precisa de 1 fonte adicional"
     - Pending items warning banner visible

6. **Finalize with Justification**
   - Scroll to Finalization Checklist
   - **Expected**:
     - ⚠️ Mínimo 3 fontes por item (warning, not blocking)
     - Button enabled: "Finalizar com Justificativa"
   - Click button
   - **Expected**: Justification dialog opens showing:
     - List of pending items
     - Textarea for justification (min 20 chars)
     - Legal compliance notice
   - Enter justification: "Devido à especificidade do item e prazo reduzido, não foi possível obter 3 fontes. As 2 fontes disponíveis são representativas do mercado local."
   - **Expected**: Button enabled when >20 chars
   - Click "Confirmar Finalização"
   - **Expected**: Project finalized successfully

---

### Scenario 3: Blocking Path - Cannot Finalize

**Objective**: Verify blocking validation prevents finalization

#### Steps:

1-2. Same as Scenario 1

3. **Link 0 Sources to All Items**
   - Skip source linking

4. **Attempt Finalization**
   - Navigate to project details
   - **Expected**:
     - Real-time validation shows red "Pendências Encontradas"
     - Multiple errors listed
     - Finalization Checklist shows:
       - ❌ Mínimo 3 fontes por item (failed, blocking)
       - ❌ Mediana calculada (failed, blocking)
       - Red error banner: "Projeto não pode ser finalizado"
       - Button disabled
   - **Expected**: Cannot click finalize button

5. **Fix Issues**
   - Add 3 sources to each item
   - **Expected**: Checklist updates in real-time
   - All checks pass
   - Button becomes enabled

---

### Scenario 4: Recency Warnings

**Objective**: Test recency warning system for old sources

#### Setup:
- Use PNCP sources with `data_licitacao` >12 months old

#### Steps:

1. Link old source (>12 months) to item
2. Navigate to ItemSourceManager
3. **Expected**:
   - Orange badge: "X meses" where X > 12
   - For sources >24 months: Red badge "Fonte muito antiga"
   - Tooltip/hover shows exact age

---

### Scenario 5: Real-Time Validation Updates

**Objective**: Verify validation updates automatically

#### Steps:

1. Open project details page (not finalized)
2. **Expected**: Real-time validation widget visible
3. In another tab, edit project (add/remove sources)
4. Return to project details
5. **Expected**:
   - Within 10 seconds, validation auto-refreshes
   - Status updates reflect changes
   - Timestamp shows last check time

---

## Component-Level Tests

### OutlierDialog Component
- [ ] Opens when clicking "Ignorar" on source
- [ ] Shows price comparison (source vs median)
- [ ] Displays % deviation with up/down indicator
- [ ] Shows source details (PNCP, org, date)
- [ ] Detects outliers (>30% deviation) with warning badge
- [ ] Requires min 10 char justification
- [ ] Shows legal compliance notice
- [ ] Disables confirm button until valid justification

### RecencyWarning Component
- [ ] Badge variant: Shows age in months
- [ ] Alert variant: Full description with recommendations
- [ ] Inline variant: Compact text with clock icon
- [ ] Color coding:
  - 12-18 months: Orange warning
  - 18-24 months: Orange "antiga"
  - 24+ months: Red "muito antiga"

### RealTimeValidation Component
- [ ] Auto-refreshes every 10 seconds
- [ ] Shows last check timestamp
- [ ] Color-coded borders (red/orange/green)
- [ ] Summary stats (X errors, Y warnings)
- [ ] Collapsed error preview (first 3)
- [ ] Pulsing dot indicator for auto-refresh

### FinalizationChecklist Component
- [ ] 4 validation checks displayed
- [ ] Visual status icons (✓, ⚠️, ✗)
- [ ] Blocking badges on required checks
- [ ] Summary card matches status
- [ ] Button state reflects validation
- [ ] Justification dialog for warnings
- [ ] Min 20 char validation
- [ ] Shows pending issues in dialog

### PDFGenerator Component
- [ ] Two buttons: Download and Preview
- [ ] Loading states during generation
- [ ] Error handling with helpful messages
- [ ] Success feedback with timestamp
- [ ] Download triggers automatically
- [ ] Preview opens in new tab
- [ ] Legal notice displayed
- [ ] PDF contents checklist visible

---

## Integration Tests

### Project Creation Flow
```
Dashboard → ProjectEditor → Save → ProjectDetails
```
- [ ] All form fields save correctly
- [ ] Redirect happens after save
- [ ] Project appears in dashboard list

### Source Linking Flow
```
ProjectDetails → ItemSourceManager → Search (context) → ItemSourceManager
```
- [ ] Context banner shows correct item
- [ ] Source counter updates in real-time
- [ ] Selected items carry through navigation
- [ ] Median recalculates after linking

### Finalization Flow
```
ProjectDetails → Validate → Review Checklist → Finalize → PDF
```
- [ ] Validation runs automatically
- [ ] Checklist reflects validation state
- [ ] Justification required when appropriate
- [ ] Status changes after finalization
- [ ] PDF section appears only when finalized

---

## Performance Tests

### PDF Generation
- [ ] Generates within 5 seconds for 10 items
- [ ] Generates within 15 seconds for 50 items
- [ ] Error handling for timeout (>30s)

### Real-Time Validation
- [ ] Validation completes <1 second for 10 items
- [ ] Auto-refresh doesn't block UI
- [ ] No memory leaks on repeated validations

---

## Accessibility Tests

### Keyboard Navigation
- [ ] All buttons reachable via Tab
- [ ] Dialogs trap focus
- [ ] Escape closes dialogs
- [ ] Enter submits forms

### Screen Reader
- [ ] Status badges have aria-labels
- [ ] Loading states announced
- [ ] Error messages announced
- [ ] Form validation errors clear

---

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Known Issues / Limitations

1. **PDF Preview**: Opens in new tab, may be blocked by popup blockers
2. **Real-time Validation**: 10-second interval, not instant
3. **Large Projects**: Performance may degrade with 100+ items
4. **Offline Mode**: Not supported, requires API connection

---

## Success Criteria

✅ **Phase 3: Compliance Features**
- [x] Outlier management with justification
- [x] Real-time validation feedback
- [x] Recency warnings for old sources
- [x] Finalization checklist with blocking

✅ **Phase 4: Reporting**
- [x] PDF generation trigger
- [x] Download and preview options
- [x] Error handling and feedback
- [x] Success notifications

---

## Regression Tests

After any code changes, verify:
- [ ] Old quotes still accessible (backward compatibility)
- [ ] Dashboard toggle works (archived vs new)
- [ ] Search works in both modes (normal + context)
- [ ] All routes resolve correctly

---

## Deployment Checklist

Before deploying to production:
- [ ] All end-to-end scenarios pass
- [ ] No console errors
- [ ] PDF generation tested with real data
- [ ] Performance acceptable (<3s page loads)
- [ ] All validation rules enforced
- [ ] Legal compliance notices present
- [ ] Audit trail captures all actions

---

This testing guide ensures the compliance system works correctly and meets Law 14.133/2021 requirements.
