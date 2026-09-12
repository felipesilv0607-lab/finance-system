import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/authService';
import '../auth.css';

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await registerUser({ name, email, password });
      navigate('/login', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return <main className="auth-page"><form className="auth-card" onSubmit={handleSubmit}><span>FINANCE SYSTEM</span><h1>Criar conta</h1><label htmlFor="register-name">Nome</label><input id="register-name" value={name} onChange={(event) => setName(event.target.value)} required /><label htmlFor="register-email">E-mail</label><input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="register-password">Senha</label><input id="register-password" type="password" minLength="8" maxLength="128" value={password} onChange={(event) => setPassword(event.target.value)} required /><small>Use ao menos 8 caracteres.</small>{error && <p className="auth-error">{error}</p>}<button type="submit" disabled={loading}>{loading ? 'Criando...' : 'Criar conta'}</button><p>Já possui conta? <Link to="/login">Entrar</Link></p></form></main>;
}

export default Register;
