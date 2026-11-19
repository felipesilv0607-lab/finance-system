import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Categories from './pages/Categories';
import Transactions from './pages/Transactions';
import './App.css';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import ToastProvider from './components/ui/ToastProvider';

// Catálogo do design system: só existe em desenvolvimento (removido do build).
const UiKit = import.meta.env.DEV ? lazy(() => import('./dev/UiKit')) : null;


function App() {
  return (
    <BrowserRouter basename="/finance-system">
      <ToastProvider>
      <Routes>
        {UiKit && (
          <Route
            path="/__ui"
            element={
              <Suspense fallback={null}>
                <UiKit />
              </Suspense>
            }
          />
        )}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/accounts" element={<ProtectedRoute><Accounts /></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
        <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
       <Route
           path="/income"
            element={
          <ProtectedRoute>
          <Income />
        </ProtectedRoute>
          }
            />
        
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
      </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
