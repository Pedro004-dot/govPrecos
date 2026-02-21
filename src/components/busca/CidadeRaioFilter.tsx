import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { municipiosService, type Municipio, type UF } from '@/services/municipios';
import { cn } from '@/lib/utils';

export interface CidadeRaioValue {
  municipio: Municipio | null;
  raioKm: number | null;
  ufSigla?: string | null;
}

interface CidadeRaioFilterProps {
  value: CidadeRaioValue;
  onChange: (value: CidadeRaioValue) => void;
  className?: string;
}

export function CidadeRaioFilter({ value, onChange, className }: CidadeRaioFilterProps) {
  const [ufs, setUfs] = useState<UF[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [selectedUf, setSelectedUf] = useState<string>(value.ufSigla || '');
  const [loadingUfs, setLoadingUfs] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);

  // Carrega UFs ao montar
  useEffect(() => {
    const loadUFs = async () => {
      setLoadingUfs(true);
      try {
        const response = await municipiosService.listarUFs();
        if (response.success) {
          setUfs(response.ufs);
        }
      } catch (error) {
        console.error('Erro ao carregar UFs:', error);
      } finally {
        setLoadingUfs(false);
      }
    };
    loadUFs();
  }, []);

  // Sincroniza selectedUf com value.ufSigla quando muda externamente
  useEffect(() => {
    if (value.ufSigla && ufs.length > 0) {
      const uf = ufs.find((u) => u.sigla === value.ufSigla);
      if (uf && uf.codigoUf !== selectedUf) {
        setSelectedUf(uf.codigoUf);
      }
    } else if (!value.ufSigla && selectedUf) {
      setSelectedUf('');
    }
  }, [value.ufSigla, ufs, selectedUf]);

  // Carrega municípios quando UF muda
  useEffect(() => {
    if (!selectedUf) {
      setMunicipios([]);
      return;
    }

    const loadMunicipios = async () => {
      setLoadingMunicipios(true);
      try {
        const response = await municipiosService.listarPorUF(selectedUf);
        if (response.success) {
          setMunicipios(response.municipios);
        }
      } catch (error) {
        console.error('Erro ao carregar municípios:', error);
      } finally {
        setLoadingMunicipios(false);
      }
    };
    loadMunicipios();
  }, [selectedUf]);

  const handleUfChange = (codigoUf: string) => {
    setSelectedUf(codigoUf);
    const ufSelecionada = ufs.find((uf) => uf.codigoUf === codigoUf);
    // Limpa município selecionado quando muda UF, mas mantém a UF selecionada
    onChange({ ...value, municipio: null, ufSigla: ufSelecionada?.sigla || null });
  };

  const handleMunicipioChange = (codigoIbge: string) => {
    const municipio = municipios.find((m) => m.codigoIbge === codigoIbge) ?? null;
    onChange({ ...value, municipio });
  };

  const handleRaioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raio = e.target.value ? Number(e.target.value) : null;
    onChange({ ...value, raioKm: raio });
  };

  return (
    <div className={cn('flex flex-wrap items-end gap-3', className)}>
      {/* Select de UF */}
      <div className="space-y-1.5 min-w-[100px]">
        <label className="text-xs font-medium text-muted-foreground">Estado</label>
        <Select value={selectedUf || undefined} onValueChange={handleUfChange} disabled={loadingUfs}>
          <SelectTrigger className="h-9 bg-background/50 border-border/60">
            {loadingUfs ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SelectValue placeholder="UF" />
            )}
          </SelectTrigger>
          <SelectContent>
            {ufs.map((uf) => (
              <SelectItem key={uf.codigoUf} value={uf.codigoUf}>
                {uf.sigla}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Select de Município */}
      <div className="space-y-1.5 flex-1 min-w-[200px]">
        <label className="text-xs font-medium text-muted-foreground">Cidade</label>
        <Select
          value={value.municipio?.codigoIbge ?? ''}
          onValueChange={handleMunicipioChange}
          disabled={!selectedUf || loadingMunicipios}
        >
          <SelectTrigger className="h-9 bg-background/50 border-border/60">
            {loadingMunicipios ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <SelectValue placeholder={selectedUf ? 'Selecione a cidade' : 'Selecione o estado primeiro'} />
            )}
          </SelectTrigger>
          <SelectContent>
            {municipios.map((mun) => (
              <SelectItem key={mun.codigoIbge} value={mun.codigoIbge}>
                {mun.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Input de Raio */}
      <div className="space-y-1.5 w-[120px]">
        <label className="text-xs font-medium text-muted-foreground">Raio (km)</label>
        <Input
          type="number"
          placeholder="Ex: 100"
          min={1}
          max={5000}
          value={value.raioKm ?? ''}
          onChange={handleRaioChange}
          className="h-9 bg-background/50 border-border/60"
        />
      </div>
    </div>
  );
}
