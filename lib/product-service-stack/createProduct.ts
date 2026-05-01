import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { docClient } from "./dynamoClient";
import { Product, ProductDB, StockDB } from "./types/product";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME ?? "products";
const STOCK_TABLE = process.env.STOCK_TABLE_NAME ?? "stock";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};

export async function main(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  let body: Record<string, unknown>;

  try {
    body = JSON.parse(event.body ?? "{}");
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const { title, description = "", price, count } = body as {
    title?: string;
    description?: string;
    price?: number;
    count?: number;
  };

  if (!title || typeof title !== "string" || title.trim() === "") {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "title is required and must be a non-empty string" }),
    };
  }

  if (typeof price !== "number" || price <= 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "price is required and must be a positive number" }),
    };
  }

  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "count is required and must be a non-negative integer" }),
    };
  }

  const id = crypto.randomUUID();

  const productItem: ProductDB = {
    id,
    title: title.trim(),
    description: typeof description === "string" ? description : "",
    price,
  };

  const stockItem: StockDB = {
    product_id: id,
    count,
  };

  await docClient.send(
    new TransactWriteCommand({
      TransactItems: [
        { Put: { TableName: PRODUCTS_TABLE, Item: productItem } },
        { Put: { TableName: STOCK_TABLE, Item: stockItem } },
      ],
    })
  );

  const createdProduct: Product = { ...productItem, count };

  return {
    statusCode: 201,
    headers: CORS_HEADERS,
    body: JSON.stringify(createdProduct),
  };
}
