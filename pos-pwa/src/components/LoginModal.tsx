import { useState } from 'react';
import { LogIn, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { authApi } from '../api/client';
import type { AuthUser } from '../types';

interface LoginModalProps {
  onSuccess: (user: AuthUser) => void;
}

export function LoginModal({ onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const user = await authApi.login(email.trim(), password);
      onSuccess(user);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0] ||
        'Credenciales incorrectas. Verifica tu correo y contraseña.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-white">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center mx-auto mb-3 text-white font-black text-lg tracking-wider shadow-lg shadow-violet-600/30">
            ST
          </div>
          <h2 className="text-lg font-bold">SUNTEK POS</h2>
          <p className="text-xs text-zinc-400 mt-1">Ingresa con tu usuario de operador</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@suntek.com"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Mail className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 pl-9 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <Lock className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-violet-600 hover:bg-violet-700 active:scale-[0.99] text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-violet-600/25 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Ingresar a Caja</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
