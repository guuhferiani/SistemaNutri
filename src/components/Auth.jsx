import React, { useState } from 'react';
import { client } from '../neonClient';
import { Eye, EyeOff, Mail, Lock, User, ShieldAlert, Sun, Moon } from 'lucide-react';

export default function Auth({ theme, toggleTheme }) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (password.length < 8) {
      setErrorMsg('A senha deve ter no mínimo 8 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        // Login flow
        const { data, error } = await client.auth.signIn.email({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message === 'Invalid login credentials' || error.message.includes('credential')
            ? 'Email ou senha incorretos. Por favor, tente novamente.' 
            : error.message);
        } else {
          window.location.reload();
        }
      } else {
        // Signup flow
        if (password !== confirmPassword) {
          setErrorMsg('As senhas não coincidem.');
          setLoading(false);
          return;
        }

        if (!fullName.trim()) {
          setErrorMsg('Por favor, informe seu nome completo.');
          setLoading(false);
          return;
        }

        const { data, error } = await client.auth.signUp.email({
          name: fullName,
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data?.user) {
          // Insert into public.nutricionistas table
          const { error: dbError } = await client
            .from('nutricionistas')
            .insert([
              {
                id: data.user.id,
                nome: fullName,
                email: email,
              }
            ]);

          if (dbError) {
            setErrorMsg('Conta criada, mas houve um erro ao salvar o perfil: ' + dbError.message);
          } else {
            setSuccessMsg('Cadastro realizado com sucesso! Faça login para entrar.');
            setIsLogin(true);
            resetForm();
          }
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      // Extrair mensagem amigável caso a API retorne em inglês
      let msg = err.message || 'Ocorreu um erro inesperado.';
      if (msg.includes('Password does not meet security requirements')) {
        msg = 'A senha não atende aos requisitos de segurança (mínimo de 8 caracteres).';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header with Theme Toggle */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <span style={styles.logoText}>Feriani Nutri</span>
        </div>
        <button onClick={toggleTheme} style={styles.themeToggle} title="Alternar tema">
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Main card */}
      <div className="glass-card" style={styles.card}>
        <h2 style={styles.title}>{isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}</h2>
        <p style={styles.subtitle}>
          {isLogin ? 'Faça login para gerenciar seus pacientes' : 'Cadastre-se para começar a usar o sistema'}
        </p>

        {errorMsg && (
          <div style={styles.alertError}>
            <ShieldAlert size={20} style={{ marginRight: 8, flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={styles.alertSuccess}>
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} style={styles.form}>
          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome Completo</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                placeholder="exemplo@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo de 8 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.input}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirmar Senha</label>
              <div style={styles.inputWrapper}>
                <Lock size={18} style={styles.inputIcon} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" disabled={loading} style={styles.submitButton}>
            {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <div style={styles.footerLink}>
          {isLogin ? (
            <p>
              Não tem conta?{' '}
              <span onClick={() => { setIsLogin(false); resetForm(); }} style={styles.link}>
                Cadastre-se
              </span>
            </p>
          ) : (
            <p>
              Já tem conta?{' '}
              <span onClick={() => { setIsLogin(true); resetForm(); }} style={styles.link}>
                Faça login
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    maxWidth: '440px',
    marginBottom: '24px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoText: {
    fontSize: '24px',
    fontWeight: '800',
    color: 'hsl(var(--primary))',
    letterSpacing: '-0.5px',
  },
  themeToggle: {
    background: 'none',
    border: '1px solid hsl(var(--border))',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'hsl(var(--foreground))',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '8px',
    textAlign: 'center',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
    marginBottom: '32px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'hsl(var(--muted-foreground))',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'hsl(var(--muted-foreground))',
  },
  input: {
    width: '100%',
    padding: '12px 16px 12px 40px',
    borderRadius: 'var(--radius)',
    border: '1px solid hsl(var(--border))',
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    fontSize: '15px',
    outline: 'none',
  },
  eyeButton: {
    position: 'absolute',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'hsl(var(--muted-foreground))',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButton: {
    backgroundColor: 'hsl(var(--primary))',
    color: 'hsl(var(--primary-foreground))',
    border: 'none',
    padding: '14px',
    borderRadius: 'var(--radius)',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
  },
  alertError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid hsl(var(--error))',
    color: 'hsl(var(--error))',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  alertSuccess: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    border: '1px solid hsl(var(--success))',
    color: 'hsl(var(--success))',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    fontSize: '14px',
    marginBottom: '20px',
    textAlign: 'center',
  },
  footerLink: {
    marginTop: '24px',
    textAlign: 'center',
    fontSize: '14px',
    color: 'hsl(var(--muted-foreground))',
  },
  link: {
    color: 'hsl(var(--primary))',
    fontWeight: '600',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
};
