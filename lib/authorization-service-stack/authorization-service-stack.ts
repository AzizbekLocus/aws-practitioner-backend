import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as dotenv from "dotenv";
import { Construct } from "constructs";

// Load .env at CDK synth time so credentials are passed to the Lambda env
dotenv.config({ path: path.join(__dirname, "../../.env") });

// Collect all entries from .env and pass them as Lambda env vars
const envFromFile = dotenv.config({ path: path.join(__dirname, "../../.env") }).parsed ?? {};

const lambdaPath = path.join(
  __dirname,
  "../../dist/lib/authorization-service-stack"
);

export class AuthorizationServiceStack extends cdk.Stack {
  public readonly basicAuthorizerFn: lambda.Function;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.basicAuthorizerFn = new lambda.Function(this, "basicAuthorizer", {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 256,
      timeout: cdk.Duration.seconds(5),
      handler: "basicAuthorizer.main",
      code: lambda.Code.fromAsset(lambdaPath),
      environment: envFromFile,
    });

    new cdk.CfnOutput(this, "BasicAuthorizerArn", {
      value: this.basicAuthorizerFn.functionArn,
      description: "Basic Authorizer Lambda ARN",
    });

    // Allow any API Gateway in this account to invoke the authorizer
    this.basicAuthorizerFn.addPermission("AllowApiGatewayInvoke", {
      principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
      action: "lambda:InvokeFunction",
    });
  }
}
