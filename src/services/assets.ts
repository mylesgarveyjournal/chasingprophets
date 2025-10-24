import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand,
  QueryCommand,
  ScanCommand
} from "@aws-sdk/lib-dynamodb";

let ddb: any = null;
let useLocalFallback = false;

try {
  const accessKey = import.meta.env.VITE_AWS_ACCESS_KEY_ID || '';
  const secretKey = import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || '';

  if (!accessKey || !secretKey) {
    console.warn('AWS credentials not provided in env; using local data fallback');
    useLocalFallback = true;
  } else {
    const client = new DynamoDBClient({
      region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      }
    });
    ddb = DynamoDBDocumentClient.from(client);
  }
} catch (err) {
  console.warn('Failed to initialize DynamoDB client, falling back to local data', err);
  useLocalFallback = true;
}

import { Asset } from '../types/asset';

export interface PriceData {
  ticker: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function getAsset(ticker: string): Promise<any | null> {
  if (useLocalFallback) {
    const data = await import('../data/generatedPrices.json');
    const item = data.default?.[ticker];
    if (!item) return null;
    const prices = item.prices || [];
    const last = prices[prices.length - 1];
    const prev = prices[prices.length - 2];
    const lastPrice = last?.close ?? null;
    const priceChange = last && prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
    return {
      ticker,
      name: item.metadata.name,
      market: item.metadata.market || 'Unknown',
      lastPrice,
      priceChange
    };
  }
  const command = new GetCommand({
    TableName: "ChasingProphets-Assets",
    Key: { ticker }
  });

  try {
    const response = await ddb.send(command);
    return response.Item as Asset || null;
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

export async function getAllAssets(): Promise<Asset[]> {
  if (useLocalFallback) {
    const data = await import('../data/generatedPrices.json');
    return Object.values(data.default || {}).map((v: any) => {
      const prices = v.prices || [];
      const last = prices[prices.length - 1];
      const prev = prices[prices.length - 2];
      const lastPrice = last?.close ?? 0;
      const priceChange = last && prev ? ((last.close - prev.close) / prev.close) * 100 : 0;
      return {
        ticker: v.metadata.ticker,
        name: v.metadata.name,
        market: v.metadata.market || 'Unknown',
        lastPrice,
        priceChange
      } as any;
    });
  }

  const command = new ScanCommand({ TableName: 'ChasingProphets-Assets' });
  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Asset[];
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw error;
  }
}

export async function getAssetsByMarket(market: string): Promise<Asset[]> {
  if (useLocalFallback) {
    const data = await import('../data/generatedPrices.json');
    return Object.values(data.default || {}).filter((v: any) => v.metadata.market === market).map((v: any) => ({ ticker: v.metadata.ticker, name: v.metadata.name } as Asset));
  }

  const command = new QueryCommand({
    TableName: 'ChasingProphets-Assets',
    IndexName: 'MarketIndex',
    KeyConditionExpression: 'market = :market',
    ExpressionAttributeValues: { ':market': market }
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as Asset[];
  } catch (error) {
    console.error('Error fetching assets by market:', error);
    throw error;
  }
}

export async function getAssetPrices(
  ticker: string,
  startDate?: string,
  endDate?: string
): Promise<PriceData[]> {
  if (useLocalFallback) {
    const data = await import('../data/generatedPrices.json');
    const asset = data.default?.[ticker];
    if (!asset) return [];
    let prices = asset.prices as PriceData[];
    if (startDate) prices = prices.filter(p => p.date >= startDate);
    if (endDate) prices = prices.filter(p => p.date <= endDate);
    return prices;
  }

  const command = new QueryCommand({
    TableName: 'ChasingProphets-AssetPrices',
    KeyConditionExpression: startDate && endDate ? 'ticker = :t AND #date BETWEEN :start AND :end' : 'ticker = :t',
    ExpressionAttributeValues: {
      ':t': ticker,
      ...(startDate && { ':start': startDate }),
      ...(endDate && { ':end': endDate })
    },
    ExpressionAttributeNames: { '#date': 'date' },
    ScanIndexForward: true
  });

  try {
    const response = await ddb.send(command);
    return (response.Items || []) as PriceData[];
  } catch (error) {
    console.error('Error fetching asset prices:', error);
    throw error;
  }
}