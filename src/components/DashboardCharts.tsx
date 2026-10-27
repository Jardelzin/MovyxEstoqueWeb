import { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { api } from '../services/api';
import type { Period, Product } from '../types';

Chart.register(...registerables);

const CATEGORY_ORDER = ['2G', '4G', 'Acessório único', 'Câmeras', 'Satélite'];
const CHART_COLORS = ['#00D76F', '#18DBB1', '#149D80', '#10221c', '#5b7b70', '#7cd6b0', '#0a6b52', '#2ecc9a'];

export function DashboardCharts() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Referências para destruir os gráficos antigos antes de recriar
  const chartTotalRef = useRef<Chart | null>(null);
  const chartDonutRef = useRef<Chart | null>(null);
  const chartCatRef = useRef<Chart | null>(null);
  const chartBarRef = useRef<Chart | null>(null);

  const canvasTotal = useRef<HTMLCanvasElement | null>(null);
  const canvasDonut = useRef<HTMLCanvasElement | null>(null);
  const canvasCat = useRef<HTMLCanvasElement | null>(null);
  const canvasBar = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [pRes, prodRes] = await Promise.all([
        api.get('/Periods'),
        api.get('/Products')
      ]);
      setPeriods(pRes.data);
      setProducts(prodRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados para os gráficos:', error);
    }
  }

  useEffect(() => {
    if (periods.length === 0 || products.length === 0) return;

    // Helper functions com fallback seguro ?? {}
    const periodTotal = (values: Record<string, number> | undefined) => 
      Object.values(values ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);

    const groups = products.reduce((acc, p) => {
      if (!acc[p.category]) acc[p.category] = [];
      acc[p.category].push(p);
      return acc;
    }, {} as Record<string, Product[]>);

    const order = CATEGORY_ORDER.filter(c => groups[c]).concat(
      Object.keys(groups).filter(c => !CATEGORY_ORDER.includes(c))
    );

    const categoryTotal = (catProducts: Product[], values: Record<string, number> | undefined) => {
      const safeValues = values ?? {};
      return catProducts.reduce((sum, p) => sum + (Number(safeValues[p.id]) || 0), 0);
    };

    const fmt = (n: number) => (n || 0).toLocaleString('pt-BR');

    // 1. Gráfico de Linha - Total
    if (canvasTotal.current) {
      if (chartTotalRef.current) chartTotalRef.current.destroy();
      chartTotalRef.current = new Chart(canvasTotal.current, {
        type: 'line',
        data: {
          labels: periods.map(p => p.label),
          datasets: [{
            label: 'Total em estoque',
            data: periods.map(p => periodTotal(p.values)),
            borderColor: '#00D76F',
            backgroundColor: 'rgba(0,215,111,0.12)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#149D80',
            pointRadius: 5,
            borderWidth: 3
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(Number(v)) } } }
        }
      });
    }

    // 2. Gráfico Donut - Distribuição
    const lastPeriod = periods[periods.length - 1];
    if (canvasDonut.current && lastPeriod) {
      if (chartDonutRef.current) chartDonutRef.current.destroy();
      chartDonutRef.current = new Chart(canvasDonut.current, {
        type: 'doughnut',
        data: {
          labels: order,
          datasets: [{
            data: order.map(cat => categoryTotal(groups[cat], lastPeriod.values)),
            backgroundColor: CHART_COLORS,
            borderWidth: 2,
            borderColor: '#fff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
        }
      });
    }

    // 3. Gráfico de Linha - Por Categoria
    if (canvasCat.current) {
      if (chartCatRef.current) chartCatRef.current.destroy();
      const datasets = order.map((cat, i) => ({
        label: cat,
        data: periods.map(per => categoryTotal(groups[cat], per.values)),
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
        tension: 0.3,
        borderWidth: 2.5,
        pointRadius: 4,
        fill: false
      }));
      chartCatRef.current = new Chart(canvasCat.current, {
        type: 'line',
        data: { labels: periods.map(p => p.label), datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(Number(v)) } } }
        }
      });
    }

    // 4. Gráfico de Barras - Comparativo
    if (canvasBar.current && lastPeriod) {
      if (chartBarRef.current) chartBarRef.current.destroy();
      chartBarRef.current = new Chart(canvasBar.current, {
        type: 'bar',
        data: {
          labels: order,
          datasets: [{
            label: 'Quantidade',
            data: order.map(cat => categoryTotal(groups[cat], lastPeriod.values)),
            backgroundColor: CHART_COLORS,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: { y: { beginAtZero: true, ticks: { callback: (v) => fmt(Number(v)) } } }
        }
      });
    }

    return () => {
      chartTotalRef.current?.destroy();
      chartDonutRef.current?.destroy();
      chartCatRef.current?.destroy();
      chartBarRef.current?.destroy();
    };
  }, [periods, products]);

  if (periods.length === 0) {
    return (
      <div className="max-w-5xl mx-auto mt-8 p-10 text-center bg-white border border-dashed border-gray-300 rounded-xl">
        <p className="text-gray-500 text-lg">Lance ao menos um período para ver os dashboards de evolução.</p>
      </div>
    );
  }

  const last = periods[periods.length - 1];
  const prev = periods.length > 1 ? periods[periods.length - 2] : null;
  const lastTotal = Object.values(last.values ?? {}).reduce((a, b) => a + (Number(b) || 0), 0);
  const prevTotal = prev ? Object.values(prev.values ?? {}).reduce((a, b) => a + (Number(b) || 0), 0) : 0;
  const delta = prev ? lastTotal - prevTotal : 0;

  return (
    <div className="max-w-5xl mx-auto mt-8 space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Estoque Total Atual</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{lastTotal.toLocaleString('pt-BR')} un.</p>
          <p className="text-xs text-gray-500 mt-1">{last.label}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Variação vs. Anterior</p>
          <p className={`text-2xl font-black mt-1 ${delta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {delta > 0 ? `+${delta}` : delta} un.
          </p>
          <p className="text-xs text-gray-500 mt-1">{prev ? `Desde ${prev.label}` : 'Apenas um período'}</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Períodos Lançados</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{periods.length}</p>
          <p className="text-xs text-gray-500 mt-1">Histórico registado</p>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 border-t-4 border-t-emerald-500">
          <p className="text-xs font-bold text-gray-500 uppercase">Produtos no Catálogo</p>
          <p className="text-2xl font-black text-gray-900 mt-1">{products.length}</p>
          <p className="text-xs text-gray-500 mt-1">Modelos ativos</p>
        </div>
      </div>

      {/* Grid de Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-1">Evolução do estoque total</h3>
          <p className="text-xs text-gray-500 mb-4">Soma geral de todas as categorias em cada período lançado.</p>
          <div className="h-72 relative"><canvas ref={canvasTotal}></canvas></div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg mb-1">Distribuição por categoria</h3>
          <p className="text-xs text-gray-500 mb-4">Participação de cada categoria no período mais recente.</p>
          <div className="h-72 relative"><canvas ref={canvasDonut}></canvas></div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Evolução por categoria</h3>
        <p className="text-xs text-gray-500 mb-4">Quantidade em estoque de cada categoria ao longo dos períodos.</p>
        <div className="h-80 relative"><canvas ref={canvasCat}></canvas></div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="font-bold text-gray-800 text-lg mb-1">Comparativo entre categorias — último período</h3>
        <p className="text-xs text-gray-500 mb-4">Quantidade total por categoria no lançamento mais recente.</p>
        <div className="h-72 relative"><canvas ref={canvasBar}></canvas></div>
      </div>
    </div>
  );
}