#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { HelloLambdaStack } from "../lib/hello-lambda/hello-lambda-stack";
import { ProductServiceStack } from "../lib/product-service-stack/product-service-stack";
import { ImportServiceStack } from "../lib/import-service-stack/import-service-stack";
import { AuthorizationServiceStack } from "../lib/authorization-service-stack/authorization-service-stack";

const app = new cdk.App();

new HelloLambdaStack(app, "HelloLambdaStack", {});

const productStack = new ProductServiceStack(app, "ProductServiceStack", {});

const authStack = new AuthorizationServiceStack(app, "AuthorizationServiceStack", {});

new ImportServiceStack(app, "ImportServiceStack", {
  queueUrl: productStack.catalogItemsQueue.queueUrl,
  queueArn: productStack.catalogItemsQueue.queueArn,
  basicAuthorizerArn: authStack.basicAuthorizerFn.functionArn,
});
