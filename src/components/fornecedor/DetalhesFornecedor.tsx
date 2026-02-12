import { Badge } from '@/components/ui/badge';
import type { Fornecedor } from '@/services/projetos';
import { Building2, MapPin, Phone, Mail, FileText } from 'lucide-react';

interface DetalhesFornecedorProps {
  fornecedor: Fornecedor;
}

export function DetalhesFornecedor({ fornecedor }: DetalhesFornecedorProps) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4" />
          Fornecedor Vencedor
        </h4>
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          {/* Razão Social e Nome Fantasia */}
          <div>
            <p className="text-xs text-muted-foreground">Razão Social</p>
            <p className="font-semibold text-base">{fornecedor.razaoSocial}</p>
          </div>

          {fornecedor.nomeFantasia && fornecedor.nomeFantasia !== fornecedor.razaoSocial && (
            <div>
              <p className="text-xs text-muted-foreground">Nome Fantasia</p>
              <p className="font-medium">{fornecedor.nomeFantasia}</p>
            </div>
          )}

          {/* CNPJ e Status */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-xs text-muted-foreground">CNPJ</p>
              <p className="font-mono text-sm">{fornecedor.cnpjFormatado}</p>
            </div>
            {fornecedor.situacao && (
              <Badge variant={fornecedor.isAtivo ? 'default' : 'secondary'}>
                {fornecedor.situacao}
              </Badge>
            )}
          </div>

          {/* Porte e Natureza Jurídica */}
          {(fornecedor.porte || fornecedor.naturezaJuridica) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fornecedor.porte && (
                <div>
                  <p className="text-xs text-muted-foreground">Porte</p>
                  <p className="text-sm">{fornecedor.porte}</p>
                </div>
              )}
              {fornecedor.naturezaJuridica && (
                <div>
                  <p className="text-xs text-muted-foreground">Natureza Jurídica</p>
                  <p className="text-sm">{fornecedor.naturezaJuridica}</p>
                </div>
              )}
            </div>
          )}

          {/* Endereço */}
          {fornecedor.municipio && (
            <div className="flex items-start gap-2 pt-2 border-t border-border">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Localização</p>
                <p className="text-sm">
                  {fornecedor.logradouro && `${fornecedor.logradouro}${fornecedor.numero ? `, ${fornecedor.numero}` : ''}`}
                  {fornecedor.logradouro && <br />}
                  {fornecedor.bairro && `${fornecedor.bairro} - `}
                  {fornecedor.municipio} / {fornecedor.uf}
                  {fornecedor.cep && ` - CEP: ${fornecedor.cep}`}
                </p>
              </div>
            </div>
          )}

          {/* Contato */}
          {(fornecedor.telefone || fornecedor.email) && (
            <div className="space-y-2 pt-2 border-t border-border">
              {fornecedor.telefone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Telefone</p>
                    <p className="text-sm">{fornecedor.telefone}</p>
                  </div>
                </div>
              )}
              {fornecedor.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="text-sm break-all">{fornecedor.email}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Atividade Principal */}
          {fornecedor.atividadePrincipal && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Atividade Principal</p>
                  <p className="text-sm">
                    <span className="font-mono text-xs text-muted-foreground">
                      {fornecedor.atividadePrincipal.code}
                    </span>
                    {' - '}
                    {fornecedor.atividadePrincipal.text}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Indicador de dados completos */}
          {!fornecedor.dadosCompletos && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground italic">
                Dados básicos. Informações completas indisponíveis no momento.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
