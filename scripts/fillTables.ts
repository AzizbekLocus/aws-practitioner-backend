import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ProductDB, StockDB } from "../lib/product-service-stack/types/product";

const REGION = "us-east-1";
const PRODUCTS_TABLE = "products";
const STOCK_TABLE = "stock";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const seedProducts: (ProductDB & { count: number })[] = [
  {
    id: "6023a861-92ec-430d-81a9-d66dc8e5f8ca",
    title: "Wireless Noise-Cancelling Headphones",
    description:
      "Over-ear headphones with active noise cancellation and 30-hour battery life.",
    price: 299,
    count: 10,
  },
  {
    id: "d2a69d18-59f7-4ae3-80a5-6b45843db835",
    title: "Mechanical Keyboard",
    description:
      "Tenkeyless mechanical keyboard with Cherry MX switches and RGB backlight.",
    price: 129,
    count: 5,
  },
  {
    id: "6881fb46-3b6f-4599-a276-5273ad14f062",
    title: "USB-C Hub",
    description:
      "7-in-1 hub with HDMI, USB 3.0, SD card reader, and 100W PD charging.",
    price: 49,
    count: 25,
  },
  {
    id: "364e1d23-9154-41ff-a4b4-3a08ee050ef8",
    title: "Webcam 4K",
    description:
      "Ultra HD 4K webcam with auto-focus and built-in noise-cancelling microphone.",
    price: 89,
    count: 8,
  },
  {
    id: "19ba3d6a-f8ed-491b-a192-0a33b71b38c4",
    title: "Monitor Arm",
    description:
      "Fully adjustable single monitor arm with cable management for screens up to 32 inches.",
    price: 59,
    count: 15,
  },
];

async function fillTables(): Promise<void> {
  console.log("Seeding DynamoDB tables...");

  for (const { count, ...productFields } of seedProducts) {
    const productItem: ProductDB = productFields;
    const stockItem: StockDB = { product_id: productFields.id, count };

    await docClient.send(
      new PutCommand({ TableName: PRODUCTS_TABLE, Item: productItem })
    );
    console.log(`  ✓ products → ${productItem.id} (${productItem.title})`);

    await docClient.send(
      new PutCommand({ TableName: STOCK_TABLE, Item: stockItem })
    );
    console.log(`  ✓ stock    → ${stockItem.product_id} (count: ${stockItem.count})`);
  }

  console.log(`\nDone. ${seedProducts.length} products and stock records inserted.`);
}

fillTables().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
