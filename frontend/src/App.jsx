import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import './App.css';

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
        <Route path="/" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
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
