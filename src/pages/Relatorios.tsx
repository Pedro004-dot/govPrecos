import { FileText, Clock } from 'lucide-react';

export function Relatorios() {
  return (
    <div className="space-y-10 w-full">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="animate-dash-in" style={{ animationDelay: '0ms' }}>
        <p className="font-mono text-[11px] text-muted-foreground/60 uppercase tracking-[0.2em] mb-3">
          GovPreços&nbsp;·&nbsp;Relatórios
        </p>
        <h1 className="font-display text-[2.8rem] leading-[1.05] font-normal text-foreground">
          Meus relatórios
        </h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm leading-relaxed">
          Relatórios gerados a partir das suas cotações de preços.
        </p>
        <div className="mt-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="font-mono text-[9px] text-muted-foreground/30 tracking-widest uppercase">
            em breve
          </span>
          <div className="h-px w-8 bg-border" />
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────────── */}
      <div
        className="animate-dash-in rounded-xl border border-dashed border-border/60 bg-card/40 flex flex-col items-center justify-center py-20 text-center"
        style={{ animationDelay: '80ms' }}
      >
        <div className="relative mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <FileText className="h-6 w-6" />
          </div>
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-warning/15">
            <Clock className="h-2.5 w-2.5 text-warning" />
          </div>
        </div>
        <h3 className="font-display text-xl font-normal text-foreground/80 mb-2">
          Em construção
        </h3>
        <p className="text-sm text-muted-foreground/60 max-w-xs leading-relaxed">
          Esta tela será implementada em breve. Aqui você verá a lista de
          relatórios gerados a partir das suas cotações.
        </p>
        <div className="mt-8 flex items-center gap-2">
          <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
          <span className="font-mono text-[10px] text-muted-foreground/30 uppercase tracking-widest">
            disponível em breve
          </span>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/20" />
        </div>
      </div>
    </div>
  );
}
