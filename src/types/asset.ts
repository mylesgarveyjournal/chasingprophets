export interface Asset {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timeSage?: number;
  trendOracle?: number;
  marketMind?: number;
  quantumPredictor?: number;
}