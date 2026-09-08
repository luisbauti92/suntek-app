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
          <div className="w-14 h-14 rounded-2xl bg-[#0038a8] border border-blue-400/30 flex items-center justify-center mx-auto mb-3 text-white font-black text-xl tracking-wider shadow-lg shadow-[#0038a8]/40">
            ST
          </div>
          <h2 className="text-lg font-black tracking-wide">SUNTEK POS</h2>
          <p className="text-xs text-zinc-300 mt-1">Terminal de Ventas Móvil</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 flex items-start gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Correo Electrónico
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operador@suntek.com"
                className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3.5 py-3 pl-10 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:border-[#0038a8] transition"
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-800/90 border border-zinc-700/80 rounded-xl px-3.5 py-3 pl-10 text-xs text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#0038a8] focus:border-[#0038a8] transition"
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0038a8] hover:bg-[#0048d1] active:scale-[0.98] text-white min-h-[48px] py-3 rounded-2xl font-bold text-xs shadow-xl shadow-[#0038a8]/35 transition flex items-center justify-center gap-2 mt-3 disabled:opacity-50 border border-blue-400/30"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>INGRESAR A CAJA</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
