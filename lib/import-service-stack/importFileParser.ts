import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import type { S3Event } from "aws-lambda";
import type { Readable } from "stream";
import csvParser from "csv-parser";

const s3Client = new S3Client({});
const sqsClient = new SQSClient({});

const QUEUE_URL = process.env.QUEUE_URL ?? "";

export async function main(event: S3Event): Promise<void> {
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    await new Promise<void>((resolve, reject) => {
      (response.Body as Readable)
        .pipe(csvParser())
        .on("data", (row: Record<string, unknown>) => {
          sqsClient
            .send(
              new SendMessageCommand({
                QueueUrl: QUEUE_URL,
                MessageBody: JSON.stringify(row),
              })
            )
            .catch((err: Error) =>
              console.error("Failed to send SQS message:", err)
            );
        })
        .on("end", () => {
          console.log(`Finished sending records from ${key} to SQS`);
          resolve();
        })
        .on("error", (err: Error) => {
          console.error(`Error parsing ${key}:`, err);
          reject(err);
        });
    });
  }
}

