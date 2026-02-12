import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Shield, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

// ══════════════════════════════════════════════════════════════════════
// Login Page
// Government procurement SaaS — authority meets accessibility
// ══════════════════════════════════════════════════════════════════════

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      const message =
        err.response?.data?.message || err.message || 'Erro ao fazer login';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* ─── Left Panel: Decorative ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[55%] relative overflow-hidden bg-[hsl(222_50%_5%)]">
        {/* Gradient mesh background */}
        <div className="absolute inset-0">
          {/* Navy base with subtle gradient */}
          <div
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse 80% 60% at 10% 90%, hsl(217 100% 65% / 0.15) 0%, transparent 50%),
                radial-gradient(ellipse 60% 50% at 90% 20%, hsl(38 82% 52% / 0.12) 0%, transparent 50%),
                radial-gradient(ellipse 100% 80% at 50% 50%, hsl(222 55% 8%) 0%, hsl(222 50% 5%) 100%)
              `,
            }}
          />

          {/* Geometric grid pattern */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.03]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern
                id="login-grid"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 60 0 L 0 0 0 60"
                  fill="none"
                  stroke="white"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#login-grid)" />
          </svg>

          {/* Diagonal accent lines */}
          <div
            className="absolute top-0 right-0 w-[200%] h-[1px] origin-top-right rotate-[-35deg]"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(38 82% 52% / 0.3), transparent)',
            }}
          />
          <div
            className="absolute bottom-[30%] left-0 w-[150%] h-[1px] origin-bottom-left rotate-[-35deg]"
            style={{
              background: 'linear-gradient(90deg, transparent, hsl(217 100% 65% / 0.2), transparent)',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img
              src="/logo.png"
              alt=""
              className="h-14 w-14 rounded-xl"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-[hsl(102_70%_55%)]">GOV</span>
                <span className="text-white/90">PREÇOS</span>
              </span>
              <span className="text-[9px] uppercase text-white/40 tracking-[0.4em]">
                Pesquisa de Preços
              </span>
            </div>
          </div>

          {/* Hero text */}
          <div className="max-w-lg">
            <h1 className="font-display text-4xl xl:text-5xl font-semibold text-white/95 leading-[1.15] mb-6">
              Pesquisa de preços com{' '}
              <span className="text-[hsl(38_82%_52%)]">transparência</span> e{' '}
              <span className="text-[hsl(217_100%_65%)]">eficiência</span>
            </h1>
            <p className="text-white/50 text-lg leading-relaxed">
              Sistema integrado ao Portal Nacional de Contratações Públicas para
              auxiliar prefeituras na conformidade com a Lei 14.133/2021.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <div className="font-display text-3xl font-semibold text-[hsl(38_82%_52%)]">
                +300k
              </div>
              <div className="text-sm text-white/40 mt-1">
                Licitações indexadas
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-semibold text-[hsl(217_100%_65%)]">
                5.570
              </div>
              <div className="text-sm text-white/40 mt-1">
                Municípios atendidos
              </div>
            </div>
            <div>
              <div className="font-display text-3xl font-semibold text-[hsl(142_65%_45%)]">
                100%
              </div>
              <div className="text-sm text-white/40 mt-1">
                Conforme Lei 14.133
              </div>
            </div>
          </div>
        </div>

        {/* Shield decoration */}
        <div className="absolute bottom-8 right-8 opacity-[0.03]">
          <Shield className="w-64 h-64 text-white" strokeWidth={0.5} />
        </div>
      </div>

      {/* ─── Right Panel: Login Form ────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div className="w-full max-w-[400px] animate-dash-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl" />
            <div className="flex flex-col">
              <span className="text-lg font-bold tracking-tight">
                <span className="text-[hsl(102_70%_55%)]">GOV</span>
                <span className="text-foreground">PREÇOS</span>
              </span>
            </div>
          </div>

          {/* Form header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-semibold">
                Acesso ao sistema
              </h2>
            </div>
            <p className="text-muted-foreground">
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Erro ao fazer login
                </p>
                <p className="text-sm text-destructive/80 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.gov.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSubmitting}
                className={cn(
                  'h-12 px-4 bg-card border-border/60',
                  'focus:border-primary focus:ring-2 focus:ring-primary/20',
                  'placeholder:text-muted-foreground/50'
                )}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium">
                  Senha
                </Label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                  className={cn(
                    'h-12 px-4 pr-12 bg-card border-border/60',
                    'focus:border-primary focus:ring-2 focus:ring-primary/20',
                    'placeholder:text-muted-foreground/50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={cn(
                'w-full h-12 text-base font-medium',
                'bg-primary hover:bg-primary/90',
                'transition-all duration-200',
                'group'
              )}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-border/50 text-center">
            <p className="text-xs text-muted-foreground">
              Sistema exclusivo para servidores públicos municipais.
              <br />
              Em caso de dúvidas, contate o administrador da sua prefeitura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
