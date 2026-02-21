import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, CheckCircle } from 'lucide-react';

interface ItemSuccessDialogProps {
  open: boolean;
  itemNome: string;
  onAddAnother: () => void;
  onSearchPrices: () => void;
  onClose: () => void;
}

export function ItemSuccessDialog({
  open,
  itemNome,
  onAddAnother,
  onSearchPrices,
  onClose,
}: ItemSuccessDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <DialogTitle>Item criado com sucesso!</DialogTitle>
              <DialogDescription className="mt-1">
                {itemNome}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <p className="text-sm text-muted-foreground">
            O que deseja fazer agora?
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            onClick={onSearchPrices}
            className="w-full gap-2 bg-primary hover:bg-primary/90"
          >
            <Search className="w-4 h-4" />
            Buscar preços para este item
          </Button>
          <Button
            onClick={onAddAnother}
            variant="outline"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar outro item
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
