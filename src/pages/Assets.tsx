import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Asset } from "../types/asset";
import { getAllAssets } from "../services/assets";

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadAssets() {
      try {
        const data = await getAllAssets();
        setAssets(data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load assets");
        setLoading(false);
      }
    }
    loadAssets();
  }, []);

  const handleAssetClick = (ticker: string) => {
    navigate(`/assets/${ticker}`);
  };

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assets-page">
      <h2 className="heading-md">Assets</h2>

      <div style={{ marginTop: 16 }}>
        {loading ? (
          <div className="loading">Loading assets...</div>
        ) : assets.length === 0 ? (
          <div className="empty-state">No assets available.</div>
        ) : (
          <div className="assets-grid">
            {assets.map((asset) => (
              <div key={asset.ticker} className="asset-card" onClick={() => handleAssetClick(asset.ticker)} style={{cursor: 'pointer'}}>
                <div className="asset-card-header">
                  <div className="asset-symbol">{asset.ticker}</div>
                  <div className="asset-name">{asset.name}</div>
                </div>
                <div className="asset-card-body">
                  <div className="stat">
                    <div className="stat-label">Last Price</div>
                    <div className="stat-value">${asset.lastPrice.toFixed(2)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-label">Change</div>
                    <div className={`stat-value ${asset.priceChange >= 0 ? 'positive' : 'negative'}`}>{asset.priceChange >= 0 ? '+' : ''}{asset.priceChange.toFixed(2)}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .assets-page { padding: 8px 0; }
        .assets-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
        .asset-card { background: var(--bg-primary); border-radius: 8px; padding: 12px; box-shadow: var(--shadow-sm); border: 1px solid var(--border); }
        .asset-card-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px }
        .asset-symbol { font-weight:700; font-size:1rem }
        .asset-name { color: var(--text-secondary); font-size:0.9rem }
        .asset-card-body { display:flex; gap:12px; justify-content:space-between }
        .stat-label { color: var(--text-secondary); font-size:0.8rem }
        .stat-value { font-weight:600 }
        .positive { color: var(--prophet-timesage); }
        .negative { color: var(--prophet-trendoracle); }
        .loading, .empty-state { padding: 20px; color: var(--text-secondary) }
        .error-message { color: var(--prophet-trendoracle); padding: 20px; text-align: center }
      `}</style>
    </div>
  );
}