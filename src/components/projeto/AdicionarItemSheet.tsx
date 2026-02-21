import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, FileText } from 'lucide-react';
import { projetosService, type Projeto } from '@/services/projetos';

const UNIDADES = [
  { value: 'UN', label: 'UN - Unidade' },
  { value: 'CX', label: 'CX - Caixa' },
  { value: 'KG', label: 'KG - Quilograma' },
  { value: 'LT', label: 'LT - Litro' },
  { value: 'MT', label: 'MT - Metro' },
  { value: 'PC', label: 'PC - Peça' },
  { value: 'PCT', label: 'PCT - Pacote' },
  { value: 'KIT', label: 'KIT - Kit' },
  { value: 'PAR', label: 'PAR - Par' },
  { value: 'M²', label: 'M² - Metro quadrado' },
  { value: 'MÊS', label: 'MÊS - Mês' },
  { value: 'ANO', label: 'ANO - Ano' },
];

interface AdicionarItemSheetProps {
  open: boolean;
  onClose: () => void;
  projeto: Projeto | null;
  onSuccess: () => void;
  onItemCreated?: (itemId: string, itemNome: string) => void;
}

export function AdicionarItemSheet({
  open,
  onClose,
  projeto,
  onSuccess,
  onItemCreated,
}: AdicionarItemSheetProps) {
  const [saving, setSaving] = useState(false);
  const [nome, setNome] = useState('');
  const [quantidade, setQuantidade] = useState('1');
  const [descricao, setDescricao] = useState('');
  const [unidadeMedida, setUnidadeMedida] = useState('UN');
  const [tamanhoUnidade, setTamanhoUnidade] = useState('');
  const [justificativas, setJustificativas] = useState('');

  const resetForm = () => {
    setNome('');
    setQuantidade('1');
    setDescricao('');
    setUnidadeMedida('UN');
    setTamanhoUnidade('');
    setJustificativas('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
      onClose();
    }
  };

  const handleSalvar = async () => {
    if (!projeto?.id) return;

    const nomeTrim = nome.trim();
    if (!nomeTrim) {
      alert('Nome do Item/Serviço é obrigatório');
      return;
    }

    const qty = parseFloat(quantidade.replace(',', '.'));
    if (isNaN(qty) || qty <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    setSaving(true);
    try {
      const response = await projetosService.criarItem(projeto.id, {
        nome: nomeTrim,
        descricao: descricao.trim() || undefined,
        quantidade: qty,
        unidadeMedida,
        tamanhoUnidade: tamanhoUnidade.trim() || undefined,
        observacoes: justificativas.trim() || undefined,
      });

      if (response.success) {
        onSuccess();
        resetForm();
        onClose();

        // Notify parent component that item was created
        if (onItemCreated) {
          onItemCreated(response.item.id, nomeTrim);
        }
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      alert('Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="sr-only">
          <SheetTitle>Adicionar item a cotação</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 pt-6">
          {/* Título e breadcrumb */}
          <div>
            <h2 className="text-xl font-bold">Adicionar item a cotação</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cotações / Detalhes da cotação: {projeto?.nome ?? '…'} / Adicionar item a cotação
            </p>
          </div>

          {/* Card com dados da cotação e formulário */}
          <Card className="border-2 border-border">
            <CardContent className="p-6 space-y-6">
              {/* Cabeçalho da cotação */}
              <div className="pb-4 border-b">
                <h3 className="font-semibold text-lg">{projeto?.nome}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Criado por: —
                </p>
                <p className="text-sm text-muted-foreground">
                  Criado em: {projeto ? formatDate(projeto.criadoEm) : '—'}
                </p>
              </div>

              {/* Formulário */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="item-nome">
                    Nome do Item/Serviço <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item-nome"
                    placeholder="Ex: Lápis nº 2 Preto"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="item-quantidade">
                    Quantidade <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item-quantidade"
                    type="text"
                    inputMode="decimal"
                    placeholder="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value.replace(/[^0-9,.]/g, ''))}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="item-unidade">Unidade</Label>
                  <Select value={unidadeMedida} onValueChange={setUnidadeMedida}>
                    <SelectTrigger id="item-unidade" className="mt-1.5">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="item-tamanho">
                    Tamanho/Peso (opcional)
                  </Label>
                  <Input
                    id="item-tamanho"
                    placeholder="Ex: 1 litro, 500g, 2kg, 250ml"
                    value={tamanhoUnidade}
                    onChange={(e) => setTamanhoUnidade(e.target.value)}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Especifique o tamanho ou peso unitário do produto
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="item-descricao">Descrição Detalhada do Item/Serviço</Label>
                  <Textarea
                    id="item-descricao"
                    placeholder="Descrição detalhada do item..."
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="item-justificativas">Justificativas</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs text-primary h-7 gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      modelos de justificativas
                    </Button>
                  </div>
                  <Textarea
                    id="item-justificativas"
                    placeholder="Justificativas ou observações (opcional)"
                    value={justificativas}
                    onChange={(e) => setJustificativas(e.target.value)}
                    rows={4}
                    className="mt-1.5"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleClose(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvar}
                  disabled={saving}
                  className="bg-success text-success-foreground hover:bg-success/90 gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Salvando…
                    </>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
