#!/usr/bin/env node
import * as cdk from "aws-cdk-lib/core";
import { HelloLambdaStack } from "../lib/hello-lambda/hello-lambda-stack";
import { ProductServiceStack } from "../lib/product-service-stack/product-service-stack";
import { ImportServiceStack } from "../lib/import-service-stack/import-service-stack";

const app = new cdk.App();

new HelloLambdaStack(app, "HelloLambdaStack", {});

new ProductServiceStack(app, "ProductServiceStack", {});

new ImportServiceStack(app, "ImportServiceStack", {});
