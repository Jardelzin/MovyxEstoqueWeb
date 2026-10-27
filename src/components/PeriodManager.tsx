import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Period, Product } from '../types';

export function PeriodManager() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estados do formulário de criação
  const [label, setLabel] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');

  // Estados para o lançamento de saldos
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [savingBalances, setSavingBalances] = useState(false);

  useEffect(() => {
    fetchPeriods();
    fetchProducts(); // Precisamos dos produtos para listar na hora do balanço
  }, []);

  async function fetchPeriods() {
    try {
      const response = await api.get('/Periods');
      setPeriods(response.data);
    } catch (error) {
      console.error('Erro ao buscar fechamentos:', error);
    }
  }

  async function fetchProducts() {
    try {
      const response = await api.get('/Products');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');

    try {
      const formattedDate = new Date(date).toISOString();
      await api.post('/Periods', { 
        label, 
        date: formattedDate,
        values: {} 
      });
      
      setLabel('');
      setDate('');
      fetchPeriods();
    } catch (error) {
      console.error('Erro ao criar período:', error);
      alert('Erro ao registar o fechamento. Verifica o console.');
    } finally {
      setStatus('idle');
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tens a certeza que pretendes apagar o registo deste fechamento?')) return;
    
    try {
      await api.delete(`/Periods/${id}`);
      setPeriods(periods.filter(p => p.id !== id));
      if (selectedPeriod?.id === id) setSelectedPeriod(null);
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir. Verifica o console.');
    }
  }

  // --- Funções de Gestão de Saldos ---

  function openBalances(period: Period) {
    setSelectedPeriod(period);
    // Carrega os saldos já existentes no período ou começa um objeto vazio
    setBalances(period.values || {});
  }

  function handleBalanceChange(productId: number, value: string) {
    const numValue = parseInt(value, 10);
    setBalances(prev => ({
      ...prev,
      [productId]: isNaN(numValue) ? 0 : numValue
    }));
  }

  async function handleSaveBalances() {
    if (!selectedPeriod) return;
    setSavingBalances(true);
    
    try {
      const updatedPeriod = { ...selectedPeriod, values: balances };
      
      await api.put(`/Periods/${selectedPeriod.id}`, updatedPeriod);
      
      // Atualiza a lista principal com os novos saldos
      setPeriods(periods.map(p => p.id === selectedPeriod.id ? updatedPeriod : p));
      setSelectedPeriod(null);
      alert('Saldos guardados com sucesso!');
    } catch (error) {
      console.error('Erro ao guardar saldos:', error);
      alert('Erro ao guardar saldos. Verifica o terminal do C#.');
    } finally {
      setSavingBalances(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Fechamentos de Estoque</h2>
      
      {/* Formulário de Novo Fechamento (oculta se estiver a editar saldos) */}
      {!selectedPeriod && (
        <form onSubmit={handleSubmit} className="flex gap-4 mb-8 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700">Nome do Fechamento</label>
            <input
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ex: Balanço Outubro/2026"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={status === 'loading'}
            className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50 transition-colors h-[42px]"
          >
            {status === 'loading' ? 'A abrir...' : 'Abrir Fechamento'}
          </button>
        </form>
      )}

      {/* Painel de Edição de Saldos */}
      {selectedPeriod ? (
        <div className="mb-8 p-4 bg-blue-50 border border-blue-100 rounded-md">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-blue-900">
              A lançar saldos: {selectedPeriod.label}
            </h3>
            <button onClick={() => setSelectedPeriod(null)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              Voltar à lista
            </button>
          </div>
          
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center bg-white p-3 rounded shadow-sm border border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{product.category}</p>
                  <p className="text-xs text-gray-500">Mod: {product.model} | ID: {product.id}</p>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    value={balances[product.id] || ''}
                    onChange={(e) => handleBalanceChange(product.id, e.target.value)}
                    className="w-full p-1.5 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-sm text-gray-500">Nenhum equipamento cadastrado no sistema ainda.</p>}
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSaveBalances}
              disabled={savingBalances}
              className="py-2 px-6 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-md shadow-sm disabled:opacity-50"
            >
              {savingBalances ? 'A guardar...' : 'Guardar Saldos'}
            </button>
          </div>
        </div>
      ) : (
        /* Tabela de Fechamentos (só aparece se não estiver a editar) */
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {periods.map((period) => (
                <tr key={period.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{period.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{period.label}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(period.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button onClick={() => openBalances(period)} className="text-blue-600 hover:text-blue-900">Lançar Saldos</button>
                    <button onClick={() => handleDelete(period.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {periods.length === 0 && (
            <p className="text-center text-gray-500 py-4">Nenhum fechamento registado ainda.</p>
          )}
        </div>
      )}
    </div>
  );
}