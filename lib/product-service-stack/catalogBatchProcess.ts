import { TransactWriteCommand } from "@aws-sdk/lib-dynamodb";
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import type { SQSEvent } from "aws-lambda";
import { docClient } from "./dynamoClient.js";

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE_NAME ?? "products";
const STOCK_TABLE = process.env.STOCK_TABLE_NAME ?? "stock";
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN ?? "";

const snsClient = new SNSClient({});

interface ProductInput {
  title: string;
  description?: string;
  price: number;
  count: number;
}

export async function main(event: SQSEvent): Promise<void> {
  const created: ProductInput[] = [];

  for (const record of event.Records) {
    let item: ProductInput;

    try {
      item = JSON.parse(record.body) as ProductInput;
    } catch {
      console.error("Failed to parse SQS message body:", record.body);
      continue;
    }

    const { title, description = "", price, count } = item;

    if (!title || typeof price !== "number" || typeof count !== "number") {
      console.error("Invalid product data in SQS message:", item);
      continue;
    }

    const id = crypto.randomUUID();

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: { id, title, description, price },
            },
          },
          {
            Put: {
              TableName: STOCK_TABLE,
              Item: { product_id: id, count },
            },
          },
        ],
      })
    );

    created.push(item);
    console.log(`Created product: ${title} (id: ${id})`);
  }

  if (created.length > 0 && SNS_TOPIC_ARN) {
    await snsClient.send(
      new PublishCommand({
        TopicArn: SNS_TOPIC_ARN,
        Subject: `${created.length} product(s) imported from CSV`,
        Message: JSON.stringify(
          {
            message: `Successfully created ${created.length} product(s)`,
            products: created.map((p) => ({
              title: p.title,
              price: p.price,
              count: p.count,
            })),
          },
          null,
          2
        ),
      })
    );
    console.log(`SNS notification sent for ${created.length} product(s)`);
  }
}
