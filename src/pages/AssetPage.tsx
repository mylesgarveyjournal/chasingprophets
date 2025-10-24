import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { getAsset, getAssetPrices, PriceData } from '../services/assets';
import { Asset } from '../types/asset';

export default function AssetPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [prices, setPrices] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadAssetData() {
      if (!ticker) return;

      try {
        const [assetData, priceData] = await Promise.all([
          getAsset(ticker),
          getAssetPrices(ticker)
        ]);

        if (!assetData) {
          throw new Error('Asset not found');
        }

        setAsset(assetData);
        setPrices(priceData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load asset data');
        setLoading(false);
      }
    }

    loadAssetData();
  }, [ticker]);

  const candlestickData = useMemo(() => {
    if (!prices.length) return null;

    return [{
      x: prices.map(p => p.date),
      open: prices.map(p => p.open),
      high: prices.map(p => p.high),
      low: prices.map(p => p.low),
      close: prices.map(p => p.close),
      type: 'candlestick' as const,
      name: ticker
    }];
  }, [prices, ticker]);

  const returnData = useMemo(() => {
    if (prices.length < 2) return null;

    // Calculate daily returns
    const returns = prices.slice(1).map((price, i) => {
      const prev = prices[i];
      return {
        date: price.date,
        openReturn: ((price.open - prev.open) / prev.open) * 100,
        closeReturn: ((price.close - prev.close) / prev.close) * 100,
        highReturn: ((price.high - prev.high) / prev.high) * 100,
        lowReturn: ((price.low - prev.low) / prev.low) * 100
      };
    });

    return [
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.openReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Open-to-Open'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.closeReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Close-to-Close'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.highReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'High-to-High'
      },
      {
        x: returns.map(r => r.date),
        y: returns.map(r => r.lowReturn),
        type: 'scatter' as const,
        mode: 'lines' as const,
        name: 'Low-to-Low'
      }
    ];
  }, [prices]);

  const candlestickChartRef = useRef<HTMLDivElement>(null);
  const returnsChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!candlestickData || !returnData) return;
    if (!candlestickChartRef.current || !returnsChartRef.current) return;

    // Plot candlestick chart
    const candlestickLayout = {
      title: { text: `${ticker} Price History` },
      yaxis: { title: { text: 'Price' } },
      height: 500,
      margin: { t: 40 }
    };

    // Plot returns chart
    const returnLayout = {
      title: { text: 'Daily Returns (%)' },
      yaxis: { title: { text: 'Return (%)' } },
      height: 400,
      margin: { t: 40 },
      showlegend: true,
      legend: { orientation: 'h' as const, y: -0.2 }
    };

    // Create the plots
    Promise.all([
      Plotly.newPlot(candlestickChartRef.current, candlestickData, candlestickLayout),
      Plotly.newPlot(returnsChartRef.current, returnData, returnLayout)
    ]).catch(console.error);

    // Cleanup function
    return () => {
      if (candlestickChartRef.current) {
        Plotly.purge(candlestickChartRef.current);
      }
      if (returnsChartRef.current) {
        Plotly.purge(returnsChartRef.current);
      }
    };
  }, [candlestickData, returnData, ticker]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="asset-page">
      <header className="page-header">
        <h1 className="title">{asset?.symbol}</h1>
        <div className="controls">
          {/* Placeholder for TimeWindow/Scale controls if needed in future */}
        </div>
      </header>

      <ErrorBoundary>
        <div className="chart-card">
          <div ref={candlestickChartRef} className="chart-area"></div>
        </div>
      </ErrorBoundary>

      <ErrorBoundary>
        <div className="chart-card">
          <div ref={returnsChartRef} className="chart-area"></div>
        </div>
      </ErrorBoundary>

      <style>{`
        .asset-page { padding: var(--spacing-6); }
        .page-header { margin-bottom: var(--spacing-4); }
        .title { color: var(--primary); margin-bottom: var(--spacing-2); }
        .chart-card { background: var(--bg-primary); border-radius: 8px; padding: var(--spacing-4); box-shadow: var(--shadow-sm); margin-bottom: var(--spacing-4); }
        .chart-area { width: 100%; height: 500px }
      `}</style>
    </div>
  );
}