import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Save,
  Plus,
  Loader2,
  FolderOpen,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { projetosService, type Projeto, type ProjetoItem } from '@/services/projetos';
import { ItemCard } from '@/components/projeto/ItemCard';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Project state
  const [_projeto, setProjeto] = useState<Projeto | null>(null);
  const [itens, setItens] = useState<ProjetoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [numeroProcesso, setNumeroProcesso] = useState('');
  const [objeto, setObjeto] = useState('');

  // Item dialog state
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ProjetoItem | null>(null);
  const [itemNome, setItemNome] = useState('');
  const [itemDescricao, setItemDescricao] = useState('');
  const [itemQuantidade, setItemQuantidade] = useState('');
  const [itemUnidadeMedida, setItemUnidadeMedida] = useState('UN');
  const [itemTamanhoUnidade, setItemTamanhoUnidade] = useState('');

  // Delete confirmation
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  // Load project if editing
  useEffect(() => {
    if (isEditing && id) {
      loadProject();
    }
  }, [id, isEditing]);

  const loadProject = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await projetosService.buscarPorId(id);
      if (response.success) {
        setProjeto(response.projeto);
        setItens(response.itens || []);
        setNome(response.projeto.nome);
        setDescricao(response.projeto.descricao || '');
        setNumeroProcesso(response.projeto.numeroProcesso || '');
        setObjeto(response.projeto.objeto || '');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      alert('Erro ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!nome.trim()) {
      alert('Nome do projeto é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const data = {
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        numeroProcesso: numeroProcesso.trim() || undefined,
        objeto: objeto.trim() || undefined,
      };

      if (isEditing && id) {
        const response = await projetosService.atualizar(id, data);
        if (response.success) {
          alert('Projeto atualizado com sucesso!');
          navigate(`/projeto/${id}`);
        }
      } else {
        const response = await projetosService.criar(data);
        if (response.success) {
          alert('Projeto criado com sucesso!');
          navigate(`/projeto/${response.projeto.id}`);
        }
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      alert('Erro ao salvar projeto');
    } finally {
      setSaving(false);
    }
  };

  const openItemDialog = (item?: ProjetoItem) => {
    if (item) {
      setEditingItem(item);
      setItemNome(item.nome);
      setItemDescricao(item.descricao || '');
      setItemQuantidade(item.quantidade.toString());
      setItemUnidadeMedida(item.unidadeMedida);
      setItemTamanhoUnidade(item.tamanhoUnidade || '');
    } else {
      setEditingItem(null);
      setItemNome('');
      setItemDescricao('');
      setItemQuantidade('');
      setItemUnidadeMedida('UN');
      setItemTamanhoUnidade('');
    }
    setItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    if (!itemNome.trim()) {
      alert('Nome do item é obrigatório');
      return;
    }

    const quantidade = parseFloat(itemQuantidade);
    if (isNaN(quantidade) || quantidade <= 0) {
      alert('Quantidade deve ser maior que zero');
      return;
    }

    if (!itemUnidadeMedida.trim()) {
      alert('Unidade de medida é obrigatória');
      return;
    }

    if (!isEditing || !id) {
      alert('Salve o projeto antes de adicionar itens');
      return;
    }

    try {
      const data = {
        nome: itemNome.trim(),
        descricao: itemDescricao.trim() || undefined,
        quantidade,
        unidadeMedida: itemUnidadeMedida.trim(),
        tamanhoUnidade: itemTamanhoUnidade.trim() || undefined,
      };

      if (editingItem) {
        const response = await projetosService.atualizarItem(editingItem.id, data);
        if (response.success) {
          setItens(itens.map(i => i.id === editingItem.id ? response.item : i));
          setItemDialogOpen(false);
        }
      } else {
        const response = await projetosService.criarItem(id, data);
        if (response.success) {
          setItens([...itens, response.item]);
          setItemDialogOpen(false);
        }
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Erro ao salvar item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await projetosService.deletarItem(itemId);
      setItens(itens.filter(i => i.id !== itemId));
      setDeleteItemId(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Erro ao deletar item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(isEditing ? `/projeto/${id}` : '/')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Editar Projeto' : 'Novo Projeto'}
            </h1>
            <p className="text-muted-foreground mt-1">
              Conforme Lei 14.133/2021 - Pesquisa de Preços
            </p>
          </div>
        </div>
        <Button onClick={handleSaveProject} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEditing ? 'Salvar Alterações' : 'Criar Projeto'}
        </Button>
      </div>

      {/* Project Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Informações do Projeto
          </CardTitle>
          <CardDescription>
            Dados gerais do projeto de pesquisa de preços
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Projeto *</Label>
              <Input
                id="nome"
                placeholder="Ex: Compra de Material Escolar 2026"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              placeholder="Descrição detalhada do projeto..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>
  
        </CardContent>
      </Card>

      {/* Items Section */}
      {isEditing && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Itens do Projeto</CardTitle>
                <CardDescription>
                  Defina os itens que serão pesquisados. Cada item precisa de 3+ fontes PNCP.
                </CardDescription>
              </div>
              <Button onClick={() => openItemDialog()} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar Item
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!isEditing ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Salve o projeto primeiro para poder adicionar itens
                </AlertDescription>
              </Alert>
            ) : itens.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">Nenhum item adicionado ainda</p>
                <Button onClick={() => openItemDialog()} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Item
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item, index) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={index}
                    showActions
                    onEdit={() => openItemDialog(item)}
                    onDelete={() => setDeleteItemId(item.id)}
                    onAddSources={() => id && navigate(`/projeto/${id}/item/${item.id}/buscar`)}
                    onManageSources={() => id && navigate(`/projeto/${id}/item/${item.id}/buscar`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Item Dialog */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
            <DialogDescription>
              Defina o item que será pesquisado no PNCP
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemNome">Nome do Item *</Label>
              <Input
                id="itemNome"
                placeholder="Ex: Lápis nº 2 Preto"
                value={itemNome}
                onChange={(e) => setItemNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemDescricao">Descrição</Label>
              <Textarea
                id="itemDescricao"
                placeholder="Descrição detalhada do item..."
                value={itemDescricao}
                onChange={(e) => setItemDescricao(e.target.value)}
                rows={2}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemQuantidade">Quantidade *</Label>
                <Input
                  id="itemQuantidade"
                  type="number"
                  placeholder="500"
                  value={itemQuantidade}
                  onChange={(e) => setItemQuantidade(e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemUnidade">Unidade *</Label>
                <Input
                  id="itemUnidade"
                  placeholder="UN, CX, KIT..."
                  value={itemUnidadeMedida}
                  onChange={(e) => setItemUnidadeMedida(e.target.value.toUpperCase())}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="itemTamanho">Tamanho/Peso (opcional)</Label>
              <Input
                id="itemTamanho"
                placeholder="Ex: 1 litro, 500g, 2kg, 250ml"
                value={itemTamanhoUnidade}
                onChange={(e) => setItemTamanhoUnidade(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Especifique o tamanho ou peso unitário do produto
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? 'Salvar Alterações' : 'Adicionar Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteItemId !== null} onOpenChange={() => setDeleteItemId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover este item? Todas as fontes vinculadas também serão removidas.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItemId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteItemId && handleDeleteItem(deleteItemId)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
