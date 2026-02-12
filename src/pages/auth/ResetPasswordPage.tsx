import { useState, type FormEvent } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { authApi } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password validation
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const passwordsMatch = password === confirmPassword && password.length > 0;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Token inválido ou expirado');
      return;
    }

    if (!isPasswordValid) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem');
      return;
    }

    setIsSubmitting(true);

    try {
      await authApi.resetPassword({ token, newPassword: password });
      setIsSuccess(true);
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Erro ao redefinir senha. Token pode ter expirado.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Invalid token state
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-[420px] text-center animate-dash-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
            <XCircle className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-3">
            Link inválido
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Este link de recuperação é inválido ou expirou.
            <br />
            Solicite um novo link de recuperação.
          </p>
          <Link to="/forgot-password">
            <Button className="w-full h-11">Solicitar novo link</Button>
          </Link>
        </div>
      </div>
    );
  }

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
                Senha redefinida!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                Sua senha foi alterada com sucesso. Você já pode fazer login com
                a nova senha.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full h-11"
              >
                Ir para o login
              </Button>
            </div>
          ) : (
            /* ─── Form State ────────────────────────────────────── */
            <>
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold">
                    Nova senha
                  </h2>
                </div>
                <p className="text-muted-foreground text-sm">
                  Crie uma nova senha segura para sua conta.
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
                  <Label htmlFor="password" className="text-sm font-medium">
                    Nova senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isSubmitting}
                      className={cn(
                        'h-11 px-4 pr-12 bg-background border-border/60',
                        'focus:border-primary focus:ring-2 focus:ring-primary/20'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password requirements */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <PasswordRequirement met={hasMinLength}>
                      Mínimo 8 caracteres
                    </PasswordRequirement>
                    <PasswordRequirement met={hasUppercase}>
                      Uma letra maiúscula
                    </PasswordRequirement>
                    <PasswordRequirement met={hasLowercase}>
                      Uma letra minúscula
                    </PasswordRequirement>
                    <PasswordRequirement met={hasNumber}>
                      Um número
                    </PasswordRequirement>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className={cn(
                      'h-11 px-4 bg-background border-border/60',
                      'focus:border-primary focus:ring-2 focus:ring-primary/20',
                      confirmPassword.length > 0 && !passwordsMatch && 'border-destructive'
                    )}
                  />
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive">
                      As senhas não coincidem
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || !isPasswordValid || !passwordsMatch}
                  className="w-full h-11"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Salvando...
                    </span>
                  ) : (
                    'Redefinir senha'
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

function PasswordRequirement({
  met,
  children,
}: {
  met: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 text-xs',
        met ? 'text-success' : 'text-muted-foreground'
      )}
    >
      <div
        className={cn(
          'w-1.5 h-1.5 rounded-full',
          met ? 'bg-success' : 'bg-muted-foreground/40'
        )}
      />
      {children}
    </div>
  );
}

export default ResetPasswordPage;
