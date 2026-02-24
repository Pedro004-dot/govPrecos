import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Trash2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadBrasao, removerBrasao } from '@/services/tenant';

export function Profile() {
  const { user, tenant, refreshUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tenant) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await uploadBrasao({ tenantId: tenant.id, file });
      setSuccess('Brasão atualizado com sucesso!');
      await refreshUser(); // Atualizar contexto
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
      e.target.value = ''; // Limpar input
    }
  };

  const handleRemove = async () => {
    if (!tenant?.brasaoUrl) return;

    const confirmed = window.confirm('Tem certeza que deseja remover o brasão?');
    if (!confirmed) return;

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      await removerBrasao(tenant.id);
      setSuccess('Brasão removido com sucesso!');
      await refreshUser();
    } catch (err: any) {
      setError(err.message || 'Erro ao remover brasão');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações e configurações</p>
      </div>

      {/* Card do Usuário */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>Seus dados pessoais de acesso</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {tenant?.brasaoUrl && (
                <AvatarImage src={tenant.brasaoUrl} alt="Brasão da prefeitura" className="object-contain" />
              )}
              <AvatarFallback className="text-lg">
                {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-lg">{user?.nome}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Perfil: <span className="font-medium">{user?.perfil}</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card do Tenant/Prefeitura */}
      {tenant && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              <CardTitle>Dados da {tenant.tipo === 'prefeitura' ? 'Prefeitura' : 'Câmara'}</CardTitle>
            </div>
            <CardDescription>
              Informações e configurações do órgão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nome</Label>
                <p className="font-medium">{tenant.nome}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">CNPJ</Label>
                <p className="font-medium">{tenant.cnpj}</p>
              </div>
            </div>

            {/* Brasão */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Brasão / Logo</h3>
              <p className="text-sm text-muted-foreground mb-4">
                O brasão será exibido nos relatórios de pesquisa de preços gerados pelo sistema.
              </p>

              {/* Preview do brasão */}
              {tenant.brasaoUrl && (
                <div className="mb-4 p-4 border rounded-lg bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 border rounded-lg bg-white flex items-center justify-center p-2">
                      <img
                        src={tenant.brasaoUrl}
                        alt="Brasão"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Brasão atual</p>
                      <p className="text-xs text-muted-foreground">
                        Será exibido na capa e cabeçalho dos relatórios
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemove}
                    disabled={uploading}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remover
                  </Button>
                </div>
              )}

              {/* Upload */}
              <div className="space-y-3">
                <Label htmlFor="brasao-upload">
                  {tenant.brasaoUrl ? 'Substituir brasão' : 'Fazer upload do brasão'}
                </Label>
                <div className="flex items-center gap-3">
                  <Input
                    id="brasao-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="flex-1"
                  />
                  {uploading && <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PNG, JPG, SVG • Tamanho máximo: 5 MB
                </p>
              </div>

              {/* Mensagens de feedback */}
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mt-4 border-success bg-success/10">
                  <CheckCircle className="h-4 w-4 text-success" />
                  <AlertDescription className="text-success">{success}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
