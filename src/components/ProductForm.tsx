import React, { useState } from 'react';
import { api } from '../services/api';

export function ProductForm() {
  const [category, setCategory] = useState('');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/Products', { category, model });
      setCategory('');
      setModel('');
      alert('Equipamento registado com sucesso!');
      window.location.reload();
    } catch (error) {
      console.error('Erro ao registar equipamento:', error);
      alert('Erro ao registar. Verifica o console.');
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    // Força a leitura com os acentos corretos do Excel (Windows-1252/ISO-8859-1)
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      
      const productsToImport = [];
      
      for (let i = 1; i < lines.length; i++) {
        let line = lines[i].trim();
        if (!line) continue;
        
        // LIMPEZA: Remove as aspas duplas que o Excel adiciona no início e no fim!
        if (line.startsWith('"') && line.endsWith('"')) {
          line = line.substring(1, line.length - 1);
        }
        
        const [cat, mod] = line.split(',');
        if (cat && mod) {
          productsToImport.push({ 
            category: cat.trim(), 
            model: mod.trim() 
          });
        }
      }

      if (productsToImport.length === 0) {
        alert('Nenhum produto válido encontrado. Verifica o formato do CSV.');
        return;
      }

      try {
        await api.post('/Products/import', productsToImport);
        alert(`Importação concluída! ${productsToImport.length} equipamentos processados.`);
        window.location.reload();
      } catch (err) {
        console.error('Erro na importação em massa:', err);
        alert('Erro ao importar. Ocorreu uma falha no servidor.');
      }
    };
    reader.readAsText(file, 'ISO-8859-1'); // Garante que os acentos funcionam
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-6">
      <h3 className="text-xl font-bold text-gray-800">Registar Novo Equipamento</h3>
      
      {/* Formulário de cadastro manual */}
      <form onSubmit={handleSubmit} className="flex gap-4 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <input
            type="text"
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Ex: 4G"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
          <input
            type="text"
            required
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Ex: N4"
            className="w-full p-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="py-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors h-[42px]"
        >
          {loading ? 'A registar...' : 'Registar Equipamento'}
        </button>
      </form>

      {/* Seção de Importação via CSV */}
      <div className="pt-4 border-t border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">Importar Catálogo via Ficheiro CSV</label>
        <p className="text-xs text-gray-500 mb-2">
          O ficheiro deve ter o formato <code>Categoria,Modelo</code> separados por vírgula. Exemplo:
        </p>
        <code className="block bg-gray-50 p-3 rounded text-xs text-gray-600 whitespace-pre-wrap border border-gray-200 mb-3">
{`Categoria,Modelo
Telemetria,Suntech ST310U
Rastreador,Modelo XYZ`}
        </code>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" 
        />
      </div>
    </div>
  );
}