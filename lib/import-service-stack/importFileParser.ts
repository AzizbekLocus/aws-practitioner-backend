import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import type { S3Event } from "aws-lambda";
import type { Readable } from "stream";
import csvParser from "csv-parser";

const s3Client = new S3Client({});

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
          console.log("Parsed CSV row:", JSON.stringify(row));
        })
        .on("end", () => {
          console.log(`Finished parsing ${key}`);
          resolve();
        })
        .on("error", (err: Error) => {
          console.error(`Error parsing ${key}:`, err);
          reject(err);
        });
    });
  }
}
