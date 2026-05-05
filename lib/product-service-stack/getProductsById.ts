import { GetCommand } from "@aws-sdk/lib-dynamodb";
import { docClient } from "./dynamoClient";
import { Product, ProductDB, StockDB } from "./types/product";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME ?? "products";
const STOCK_TABLE = process.env.STOCK_TABLE_NAME ?? "stock";

export async function main(event: any): Promise<Product> {
  const { id } = event;

  const [productResult, stockResult] = await Promise.all([
    docClient.send(new GetCommand({ TableName: PRODUCTS_TABLE, Key: { id } })),
    docClient.send(new GetCommand({ TableName: STOCK_TABLE, Key: { product_id: id } })),
  ]);

  const product = productResult.Item as ProductDB | undefined;

  if (!product) {
    throw new Error(
      JSON.stringify({
        type: "[NotFound]",
        message: `Product with id ${id} not found`,
      })
    );
  }

  const stock = stockResult.Item as StockDB | undefined;

  return {
    ...product,
    count: stock?.count ?? 0,
  };
}
