import { useState } from 'react';
import { useAuth } from '../AuthContext.jsx';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const switchMode = () => {
    setMode(isLogin ? 'register' : 'login');
    setError('');
  };

  async function onSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login({ email: form.email, password: form.password });
      else await register(form);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth">
      <section className="auth-intro">
        <h1 className="brand">Sweety</h1>
        <p>Log up to four glucose readings a day and see how the week and the month add up.</p>
      </section>

      <form className="card auth-form" onSubmit={onSubmit} noValidate>
        <h2>{isLogin ? 'Log in' : 'Create your account'}</h2>

        {!isLogin && (
          <label>
            Name
            <input name="name" value={form.name} onChange={onChange} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            autoComplete="email"
          />
        </label>
        <label>
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
          {!isLogin && <span className="hint">At least 8 characters.</span>}
        </label>

        {error && (
          <p className="alert" role="alert">
            {error}
          </p>
        )}

        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
        </button>

        <p className="switch">
          {isLogin ? 'New to Sweety?' : 'Already have an account?'}{' '}
          <button type="button" className="link" onClick={switchMode}>
            {isLogin ? 'Create an account' : 'Log in'}
          </button>
        </p>
      </form>
    </main>
  );
}
