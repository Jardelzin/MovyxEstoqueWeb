import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Product } from '../types';

export function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  
  // Estados para controlar qual linha está sendo editada
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState('');
  const [editModel, setEditModel] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const response = await api.get('/Products');
      setProducts(response.data);
    } catch (error) {
      console.error('Erro ao buscar equipamentos:', error);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Tem certeza que deseja excluir este equipamento do almoxarifado?')) return;
    
    try {
      await api.delete(`/Products/${id}`);
      // Remove o item da tela imediatamente sem recarregar a página
      setProducts(products.filter(product => product.id !== id));
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir. Verifique se o backend está rodando.');
    }
  }

  function startEditing(product: Product) {
    setEditingId(product.id);
    setEditCategory(product.category);
    setEditModel(product.model);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditCategory('');
    setEditModel('');
  }

  async function handleSaveEdit(id: number) {
    try {
      // O padrão do C# geralmente exige que o ID seja enviado na URL e no corpo
      await api.put(`/Products/${id}`, { 
        id, 
        category: editCategory, 
        model: editModel 
      });
      
      // Atualiza a lista na tela com os novos dados
      setProducts(products.map(product => 
        product.id === id 
          ? { ...product, category: editCategory, model: editModel } 
          : product
      ));
      
      setEditingId(null);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar. Verifique o console.');
    }
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Equipamentos Cadastrados</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Modelo</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.id}
                </td>
                
                {editingId === product.id ? (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="text" 
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="text" 
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                        className="w-full p-1 border border-gray-300 rounded text-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => handleSaveEdit(product.id)} className="text-green-600 hover:text-green-900">Salvar</button>
                      <button onClick={cancelEditing} className="text-gray-500 hover:text-gray-700">Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button onClick={() => startEditing(product)} className="text-blue-600 hover:text-blue-900">Editar</button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-900">Excluir</button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <p className="text-center text-gray-500 py-4">Nenhum equipamento cadastrado ainda.</p>
        )}
      </div>
    </div>
  );
}