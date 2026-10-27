import { useState } from 'react';
import { ProductForm } from './components/ProductForm';
import { ProductList } from './components/ProductList';
import { PeriodManager } from './components/PeriodManager';
import { Dashboard } from './components/Dashboard';
import { DashboardCharts } from './components/DashboardCharts';
import logoMovyx from './assets/logoMovyx.png';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'charts' | 'periods' | 'products'>('dashboard');

  return (
    <div className="min-h-screen bg-[#f2faf7] pb-12">
      <header className="bg-gradient-to-b from-[#04120d] to-[#0a2a1f] pt-8 pb-0 px-6 shadow-md">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <img 
                src={logoMovyx} 
                alt="Movyx" 
                className="h-9 object-contain filter brightness-125" 
              />
              <span className="text-white/30 text-2xl font-light">|</span>
              <h1 className="text-xl font-semibold text-emerald-400 tracking-wide">
                Posição de Estoque — Matriz
              </h1>
            </div>
          </div>

          <nav className="flex gap-2 border-b border-white/10 overflow-x-auto">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors border-b-4 whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white/10 text-white border-emerald-500' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              Estoque Atual
            </button>
            <button 
              onClick={() => setActiveTab('charts')}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors border-b-4 whitespace-nowrap ${activeTab === 'charts' ? 'bg-white/10 text-white border-emerald-500' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              📊 Dashboards
            </button>
            <button 
              onClick={() => setActiveTab('periods')}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors border-b-4 whitespace-nowrap ${activeTab === 'periods' ? 'bg-white/10 text-white border-emerald-500' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              Fechamentos
            </button>
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-5 py-3 text-sm font-semibold rounded-t-lg transition-colors border-b-4 whitespace-nowrap ${activeTab === 'products' ? 'bg-white/10 text-white border-emerald-500' : 'text-white/60 border-transparent hover:text-white'}`}
            >
              Catálogo de Equipamentos
            </button>
          </nav>
        </div>
      </header>
      
      <main className="px-6">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'charts' && <DashboardCharts />}
        
        {activeTab === 'periods' && (
          <div className="max-w-4xl mx-auto space-y-8 mt-8">
            <PeriodManager />
          </div>
        )}
        
        {activeTab === 'products' && (
          <div className="max-w-4xl mx-auto space-y-8 mt-8">
            <ProductForm />
            <ProductList />
          </div>
        )}
      </main>
    </div>
  );
}