import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";

const s3Client = new S3Client({});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function main(
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> {
  const name = event.queryStringParameters?.name;

  if (!name) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: "Query parameter 'name' is required" }),
    };
  }

  const bucket = process.env.BUCKET_NAME;
  const key = `uploaded/${name}`;

  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

  return {
    statusCode: 200,
    headers: CORS_HEADERS,
    body: signedUrl,
  };
}
