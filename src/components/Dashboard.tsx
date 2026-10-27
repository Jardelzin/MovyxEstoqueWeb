
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { Period, Product } from '../types';

export function Dashboard() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | ''>('');
  const [collapsedCategories, setCollapsedCategories] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [periodsRes, productsRes] = await Promise.all([
        api.get('/Periods'),
        api.get('/Products'),
      ]);

      const fetchedPeriods: Period[] = periodsRes.data;

      setPeriods(fetchedPeriods);
      setProducts(productsRes.data);

      // Seleciona o período mais recente disponível.
      if (fetchedPeriods.length > 0) {
        const latest = [...fetchedPeriods].sort(
          (a, b) => {
            const dateDifference =
              new Date(b.date).getTime() - new Date(a.date).getTime();

            return dateDifference !== 0
              ? dateDifference
              : b.id - a.id;
          }
        )[0];

        setSelectedPeriodId(latest.id);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  }

  function toggleCategory(category: string) {
    setCollapsedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  const selectedPeriod = periods.find(
    (p) => p.id === selectedPeriodId
  );

  const values = selectedPeriod?.values || {};

  // Agrupa os produtos por categoria.
  const groupedProducts = products.reduce(
    (acc, product) => {
      if (!acc[product.category]) {
        acc[product.category] = [];
      }

      acc[product.category].push(product);

      return acc;
    },
    {} as Record<string, Product[]>
  );

  // Calcula o total geral do período selecionado.
  const grandTotal = Object.values(values).reduce(
    (sum, val) => sum + (val || 0),
    0
  );

  // Escapa caracteres especiais para inserção segura no HTML.
  function escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, (char) => {
      const entities: Record<string, string> = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      };

      return entities[char];
    });
  }

  // Exporta o relatório de estoque como arquivo HTML.
  function handleExportHtml() {
    if (!selectedPeriod) {
      return;
    }

    const periodValues = selectedPeriod.values || {};

    const total = Object.values(periodValues).reduce(
      (sum, val) => sum + (val || 0),
      0
    );

    let categoriesHtml = '';

    Object.keys(groupedProducts)
      .sort()
      .forEach((category) => {
        let rows = '';
        let categoryTotal = 0;

        groupedProducts[category].forEach((product) => {
          const quantity = periodValues[product.id] || 0;
          categoryTotal += quantity;

          rows += `
            <tr>
              <td>${escapeHtml(product.model)}</td>
              <td style="
                text-align: right;
                font-weight: 600;
                ${quantity === 0 ? 'color: #dc2626;' : ''}
              ">
                ${quantity.toLocaleString('pt-BR')}
                ${quantity === 0 ? '⚠' : ''}
              </td>
            </tr>
          `;
        });

        categoriesHtml += `
          <section style="
            background: #fff;
            border-radius: 8px;
            border: 1px solid #d9efe6;
            margin-bottom: 16px;
            overflow: hidden;
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
          ">
            <div style="
              background: linear-gradient(90deg, #149D80 0%, #00D76F 100%);
              color: #fff;
              padding: 12px 20px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              gap: 12px;
            ">
              <h3 style="margin: 0; font-size: 1rem;">
                ${escapeHtml(category)}
              </h3>

              <span style="
                background: rgba(255,255,255,0.2);
                padding: 2px 10px;
                border-radius: 20px;
                font-size: 0.85rem;
                white-space: nowrap;
              ">
                ${categoryTotal.toLocaleString('pt-BR')} un.
              </span>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #f8fafc;">
                  <th style="
                    text-align: left;
                    padding: 8px 20px;
                    font-size: 0.75rem;
                    color: #5b7b70;
                  ">
                    MODELO
                  </th>

                  <th style="
                    text-align: right;
                    padding: 8px 20px;
                    font-size: 0.75rem;
                    color: #5b7b70;
                  ">
                    QUANTIDADE
                  </th>
                </tr>
              </thead>

              <tbody>
                ${rows}
              </tbody>
            </table>
          </section>
        `;
      });

    const periodLabel = escapeHtml(selectedPeriod.label);
    const referenceDate = new Date(
      selectedPeriod.date
    ).toLocaleDateString('pt-BR');

    const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <title>Relatório de Estoque - ${periodLabel}</title>
</head>

<body style="
  font-family: Segoe UI, Arial, sans-serif;
  background: #f2faf7;
  color: #0d1f19;
  padding: 30px;
  margin: 0;
">
  <main style="max-width: 800px; margin: 0 auto;">
    <h1 style="color: #0a2a1f; margin-bottom: 4px;">
      📦 Relatório de Posição de Estoque
    </h1>

    <p style="color: #5b7b70; margin-top: 0;">
      Fechamento: <strong>${periodLabel}</strong>
      (Data: ${referenceDate})
    </p>

    <section style="
      background: #10221c;
      color: #fff;
      padding: 20px;
      border-radius: 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      margin: 20px 0;
    ">
      <span style="
        font-size: 1rem;
        color: #18DBB1;
        font-weight: 600;
      ">
        TOTAL GERAL EM ESTOQUE
      </span>

      <span style="
        font-size: 1.8rem;
        color: #00D76F;
        font-weight: 800;
      ">
        ${total.toLocaleString('pt-BR')} un.
      </span>
    </section>

    ${categoriesHtml}

    <footer style="
      text-align: center;
      color: #5b7b70;
      font-size: 0.8rem;
      margin-top: 30px;
    ">
      Gerado automaticamente pelo sistema Movyx Estoque
    </footer>
  </main>
</body>
</html>`;

    // Cria o arquivo HTML e inicia o download.
    const blob = new Blob([htmlContent], {
      type: 'text/html;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const safeFileName = String(selectedPeriod.label)
      .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-')
      .trim();

    link.href = url;
    link.download = `Estoque_Movyx_${safeFileName || 'Relatorio'}.html`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    // Libera a URL após o navegador iniciar o download.
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  if (periods.length === 0) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-10 text-center bg-white border border-dashed border-gray-300 rounded-xl">
        <p className="text-gray-500 text-lg">
          Nenhum período de estoque lançado ainda.
        </p>

        <p className="text-sm text-gray-400 mt-2">
          Vá até a aba de Fechamentos e crie o seu primeiro balanço.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-8 space-y-6">

      {/* Barra de ferramentas e seleção de período */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <label
            htmlFor="period-select"
            className="font-semibold text-gray-700"
          >
            Período:
          </label>

          <select
            id="period-select"
            value={selectedPeriodId}
            onChange={(e) =>
              setSelectedPeriodId(Number(e.target.value))
            }
            className="p-2 border border-gray-300 rounded-md font-medium text-gray-800 bg-gray-50 focus:ring-emerald-500 focus:border-emerald-500 min-w-[200px]"
          >
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.label}
                {period.id ===
                  [...periods].sort(
                    (a, b) =>
                      new Date(b.date).getTime() -
                        new Date(a.date).getTime() ||
                      b.id - a.id
                  )[0]?.id
                  ? ' (Mais recente)'
                  : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm text-gray-500">
            Data ref:{' '}
            {selectedPeriod
              ? new Date(selectedPeriod.date).toLocaleDateString('pt-BR')
              : '--'}
          </div>

          <button
            type="button"
            onClick={handleExportHtml}
            disabled={!selectedPeriod}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Exportar relatório HTML
          </button>
        </div>
      </div>

      {/* Cartões de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Object.keys(groupedProducts)
          .sort()
          .map((category) => {
            const categoryTotal = groupedProducts[category].reduce(
              (sum, product) => sum + (values[product.id] || 0),
              0
            );

            return (
              <div
                key={category}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500"
              >
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {category}
                </p>

                <p className="text-2xl font-bold text-teal-700 mt-1">
                  {categoryTotal.toLocaleString('pt-BR')}
                </p>
              </div>
            );
          })}

        {/* Cartão de total geral */}
        <div className="bg-gray-900 p-4 rounded-xl shadow-md border-t-4 border-t-teal-400">
          <p className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            Total Geral
          </p>

          <p className="text-2xl font-bold text-emerald-400 mt-1">
            {grandTotal.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Listas expansíveis por categoria */}
      <div className="space-y-4">
        {Object.keys(groupedProducts)
          .sort()
          .map((category) => {
            const categoryProducts = groupedProducts[category];

            const categoryTotal = categoryProducts.reduce(
              (sum, product) => sum + (values[product.id] || 0),
              0
            );

            const isCollapsed =
              collapsedCategories.includes(category);

            return (
              <div
                key={category}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(category)}
                  aria-expanded={!isCollapsed}
                  className="w-full flex justify-between items-center gap-3 p-4 bg-gradient-to-r from-teal-700 to-emerald-500 text-white cursor-pointer select-none text-left"
                >
                  <span className="font-semibold flex items-center gap-2">
                    <span
                      className={`inline-block transform transition-transform ${
                        isCollapsed ? '-rotate-90' : 'rotate-0'
                      }`}
                    >
                      ▾
                    </span>

                    {category}
                  </span>

                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap">
                    {categoryTotal.toLocaleString('pt-BR')} un.
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Modelo
                          </th>

                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Quantidade
                          </th>
                        </tr>
                      </thead>

                      <tbody className="bg-white divide-y divide-gray-100">
                        {categoryProducts.map((product) => {
                          const quantity = values[product.id] || 0;
                          const isZero = quantity === 0;

                          return (
                            <tr
                              key={product.id}
                              className="hover:bg-emerald-50/50"
                            >
                              <td className="px-6 py-3 text-sm font-medium text-gray-800">
                                {product.model}
                              </td>

                              <td
                                className={`px-6 py-3 text-sm font-bold text-right font-mono ${
                                  isZero
                                    ? 'text-red-500'
                                    : 'text-gray-700'
                                }`}
                              >
                                {quantity.toLocaleString('pt-BR')}
                                {isZero && ' ⚠'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
