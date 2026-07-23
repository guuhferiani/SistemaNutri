'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { client } from '@/lib/neonClient';
import { Mail, Lock, User, Eye, EyeOff, ShieldAlert, Sun, Moon } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [theme, setTheme] = useState('light'); // We can add real theme provider later

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark');
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setFullName('');
    setConfirmPassword('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (isLogin) {
        console.log("Tentando login com", { email });
        const { data, error } = await client.auth.signIn.email({ 
          email, 
          password 
        });
        console.log("Login response:", { data, error });
        if (error) throw error;
        router.push('/');
      } else {
        console.log("Tentando cadastro com", { email, name: fullName });
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (password.length < 8) {
          throw new Error('A senha deve ter pelo menos 8 caracteres');
        }

        const response = await client.auth.signUp.email({
          email,
          password,
          name: fullName
        });
        console.log("Cadastro response:", response);
        const { data, error } = response || {};

        if (error) throw error;
        setSuccessMsg('Conta criada com sucesso! Você já pode fazer login.');
        setIsLogin(true);
        resetForm();
      }
    } catch (err) {
      console.error("Erro completo capturado:", err);
      let msg = 'Ocorreu um erro ao processar sua requisição.';
      if (err?.message) {
        msg = err.message;
      } else if (typeof err === 'string') {
        msg = err;
      } else if (err?.error?.message) {
        msg = err.error.message;
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-green-50/50 dark:bg-green-950/20 text-gray-900 dark:text-gray-100 transition-colors">
      
      {/* Header with Theme Toggle */}
      <div className="flex justify-between items-center w-full max-w-[440px] mb-8">
        <div className="flex items-center">
          <span className="text-2xl font-extrabold text-green-600 dark:text-green-500 tracking-tight">Feriani Nutri</span>
        </div>
        <button 
          onClick={toggleTheme} 
          className="p-2 border border-gray-200 dark:border-gray-800 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-colors" 
          title="Alternar tema"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main card */}
      <div className="w-full max-w-[440px] p-8 md:p-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl">
        <h2 className="text-3xl font-bold mb-2 text-center tracking-tight">
          {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center">
          {isLogin ? 'Faça login para gerenciar seus pacientes' : 'Cadastre-se para começar a usar o sistema'}
        </p>

        {errorMsg && (
          <div className="flex items-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm mb-6">
            <ShieldAlert size={20} className="mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 p-3 rounded-xl text-sm mb-6 text-center">
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-5">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Nome Completo</label>
              <div className="relative flex items-center">
                <User size={18} className="absolute left-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label>
            <div className="relative flex items-center">
              <Mail size={18} className="absolute left-3 text-gray-400" />
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-3 pl-10 pr-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Senha</label>
            <div className="relative flex items-center">
              <Lock size={18} className="absolute left-3 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-3 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Confirmar Senha</label>
              <div className="relative flex items-center">
                <Lock size={18} className="absolute left-3 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full py-3 pl-10 pr-10 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3.5 rounded-xl transition-colors mt-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? (
            <p>
              Não tem conta?{' '}
              <span onClick={() => { setIsLogin(false); resetForm(); }} className="text-green-600 font-semibold cursor-pointer hover:underline">
                Cadastre-se
              </span>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <span onClick={() => { setIsLogin(true); resetForm(); }} className="text-green-600 font-semibold cursor-pointer hover:underline">
                Faça login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
