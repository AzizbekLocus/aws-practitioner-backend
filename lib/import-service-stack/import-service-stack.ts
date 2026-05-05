import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNodejs from "aws-cdk-lib/aws-lambda-nodejs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as path from "path";
import { Construct } from "constructs";

const lambdaPath = path.join(
  __dirname,
  "../../dist/lib/import-service-stack"
);

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 Bucket
    const importBucket = new s3.Bucket(this, "ImportBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
    });

    // Lambda: importProductsFile
    const importProductsFileFn = new lambda.Function(
      this,
      "importProductsFile",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(10),
        handler: "importProductsFile.main",
        code: lambda.Code.fromAsset(lambdaPath),
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
      }
    );
    importBucket.grantPut(importProductsFileFn);

    // Lambda: importFileParser (bundled with NodejsFunction so csv-parser is included)
    const importFileParserFn = new lambdaNodejs.NodejsFunction(
      this,
      "importFileParser",
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        memorySize: 1024,
        timeout: cdk.Duration.seconds(30),
        entry: path.join(__dirname, "importFileParser.ts"),
        handler: "main",
        environment: {
          BUCKET_NAME: importBucket.bucketName,
        },
        bundling: {
          externalModules: ["@aws-sdk/*"],
        },
      }
    );
    importBucket.grantRead(importFileParserFn);

    // S3 event notification: uploaded/ → importFileParser
    importBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(importFileParserFn),
      { prefix: "uploaded/" }
    );

    // API Gateway
    const api = new apigateway.RestApi(this, "import-api", {
      restApiName: "Import Service",
      description: "This service handles product CSV imports.",
    });

    const importResource = api.root.addResource("import");

    importResource.addMethod(
      "GET",
      new apigateway.LambdaIntegration(importProductsFileFn, { proxy: true }),
      {
        methodResponses: [
          {
            statusCode: "200",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
          {
            statusCode: "400",
            responseParameters: {
              "method.response.header.Access-Control-Allow-Origin": true,
            },
          },
        ],
      }
    );

    importResource.addCorsPreflight({
      allowOrigins: [
        "https://d2i4ewulasiv4x.cloudfront.net",
        "http://localhost:3000",
      ],
      allowMethods: ["GET"],
    });

    new cdk.CfnOutput(this, "ImportApiUrl", {
      value: api.url,
      description: "Import Service API Gateway URL",
    });
  }
}
