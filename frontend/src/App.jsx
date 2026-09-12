import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function Placeholder({ title }) {
  return (
    <div className="app-layout">
      <main className="main-content">
        <section className="dashboard">
          <h2>{title}</h2>
          <p>Esta página será desenvolvida em breve.</p>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route
          path="/income"
          element={<Placeholder title="Receitas" />}
        />
        <Route
          path="/expenses"
          element={<Placeholder title="Despesas" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
