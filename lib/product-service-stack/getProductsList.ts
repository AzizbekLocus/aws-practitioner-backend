import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamoClient";
import { Product, ProductDB, StockDB } from "./types/product";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME ?? "products";
const STOCK_TABLE = process.env.STOCK_TABLE_NAME ?? "stock";

export async function main(): Promise<Product[]> {
  const [productsResult, stockResult] = await Promise.all([
    docClient.send(new ScanCommand({ TableName: PRODUCTS_TABLE })),
    docClient.send(new ScanCommand({ TableName: STOCK_TABLE })),
  ]);

  const products = (productsResult.Items ?? []) as ProductDB[];
  const stocks = (stockResult.Items ?? []) as StockDB[];

  const stockMap = new Map(stocks.map((s) => [s.product_id, s.count]));

  return products.map((p) => ({
    ...p,
    count: stockMap.get(p.id) ?? 0,
  }));
}
