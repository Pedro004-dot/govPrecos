import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { authApi } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await authApi.forgotPassword({ email });
      setIsSuccess(true);
    } catch (err: any) {
      // Always show success to not reveal if email exists
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-[420px] animate-dash-in">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <img src="/logo.png" alt="" className="h-12 w-12 rounded-xl" />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">
              <span className="text-[hsl(102_70%_55%)]">GOV</span>
              <span className="text-foreground">PREÇOS</span>
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="bg-card rounded-xl border border-border/60 p-8 shadow-sm">
          {isSuccess ? (
            /* ─── Success State ─────────────────────────────────── */
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-success" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-3">
                Email enviado!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Se o email <strong className="text-foreground">{email}</strong>{' '}
                estiver cadastrado, você receberá instruções para redefinir sua
                senha.
              </p>
              <p className="text-muted-foreground text-xs mb-6">
                O link expira em <strong>1 hora</strong>. Verifique também sua
                caixa de spam.
              </p>
              <Link to="/login">
                <Button variant="outline" className="w-full h-11">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            /* ─── Form State ────────────────────────────────────── */
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">
                    Recuperar senha
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Digite seu email e enviaremos instruções para redefinir sua
                  senha.
                </p>
              </div>

              {error && (
                <div className="mb-5 p-3 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

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
                      'h-11 px-4 bg-background border-border/60',
                      'focus:border-primary focus:ring-2 focus:ring-primary/20'
                    )}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Enviando...
                    </span>
                  ) : (
                    'Enviar instruções'
                  )}
                </Button>

                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar ao login
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
