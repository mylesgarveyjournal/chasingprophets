import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  QueryCommand, 
  ScanCommand 
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({
  region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: import.meta.env.VITE_AWS_ACCESS_KEY_ID || '',
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY || ''
  }
});

export const ddbDocClient = DynamoDBDocumentClient.from(client);

export interface Asset {
  symbol: string;
  market: string;
  name: string;
  sector?: string;
  lastPrice: number;
  lastUpdated: string;
}

export async function getAssetBySymbol(symbol: string, market: string): Promise<Asset | null> {
  const command = new GetCommand({
    TableName: "ChasingProphets-Assets",
    Key: { symbol, market }
  });

  try {
    const response = await ddbDocClient.send(command);
    return response.Item as Asset || null;
  } catch (error) {
    console.error('Error fetching asset:', error);
    throw error;
  }
}

export async function getAssetsByMarket(market: string): Promise<Asset[]> {
  const command = new QueryCommand({
    TableName: "ChasingProphets-Assets",
    IndexName: "MarketLastUpdatedIndex",
    KeyConditionExpression: "market = :market",
    ExpressionAttributeValues: {
      ":market": market
    }
  });

  try {
    const response = await ddbDocClient.send(command);
    return (response.Items || []) as Asset[];
  } catch (error) {
    console.error('Error fetching assets by market:', error);
    throw error;
  }
}

export async function updateAssetPrice(
  symbol: string, 
  market: string, 
  lastPrice: number
): Promise<void> {
  const command = new PutCommand({
    TableName: "ChasingProphets-Assets",
    Item: {
      symbol,
      market,
      lastPrice,
      lastUpdated: new Date().toISOString()
    }
  });

  try {
    await ddbDocClient.send(command);
  } catch (error) {
    console.error('Error updating asset price:', error);
    throw error;
  }
}

export async function getAllAssets(limit = 50): Promise<Asset[]> {
  const command = new ScanCommand({
    TableName: "ChasingProphets-Assets",
    Limit: limit
  });

  try {
    const response = await ddbDocClient.send(command);
    return (response.Items || []) as Asset[];
  } catch (error) {
    console.error('Error fetching all assets:', error);
    throw error;
  }
}