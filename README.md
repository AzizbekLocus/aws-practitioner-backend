## Product Service — Lambda + API Gateway with OpenAPI Docs

### Summary
Implements the Product Service as a set of AWS Lambda functions exposed via API Gateway, adds OpenAPI (Swagger) documentation, unit tests, and CORS support for cross-origin access.

### Changes

#### Features
- **Product Service Lambda handlers** — `getProductsList` returns all products as a `Product[]` array; `getProductsById` returns a single flat `Product` object and throws a structured `[NotFound]` error for missing IDs
- **API Gateway (CDK)** — `GET /products` and `GET /products/{id}` endpoints wired to their respective Lambda functions via non-proxy `LambdaIntegration`
- **OpenAPI spec** (`swagger.yaml`) — full OpenAPI 3.0 documentation covering both endpoints, request/response schemas, error responses, and examples

#### Fixes
- **CORS** — added `Access-Control-Allow-Origin: *` to `integrationResponses` and `methodResponses` for both `GET` methods to fix missing CORS header on actual responses (not just preflight)

#### Tests
- Unit tests for `getProductsList` — verifies array return and length
- Unit tests for `getProductsById` — verifies correct product returned by ID, and that a `[NotFound]` error is thrown for unknown IDs

### Endpoints
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/products` | Returns all products as an array |
| `GET` | `/products/{id}` | Returns a single product by UUID |
