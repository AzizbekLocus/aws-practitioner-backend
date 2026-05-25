import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerResult,
} from "aws-lambda";

export async function main(
  event: APIGatewayTokenAuthorizerEvent
): Promise<APIGatewayAuthorizerResult> {
  const token = event.authorizationToken;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const parts = token.split(" ");
  if (parts.length !== 2 || parts[0] !== "Basic" || !parts[1]) {
    throw new Error("Unauthorized");
  }

  const decoded = Buffer.from(parts[1], "base64").toString("utf-8");
  const colonIndex = decoded.indexOf(":");
  if (colonIndex === -1) {
    throw new Error("Unauthorized");
  }

  const login = decoded.substring(0, colonIndex);
  const password = decoded.substring(colonIndex + 1);

  // Lambda env var names cannot contain hyphens
  const envKey = login.replace(/-/g, "_");
  const expectedPassword = process.env[envKey];

  const effect = expectedPassword && expectedPassword === password ? "Allow" : "Deny";

  return {
    principalId: login,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: event.methodArn,
        },
      ],
    },
  };
}
