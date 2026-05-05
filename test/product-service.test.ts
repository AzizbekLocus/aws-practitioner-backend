import { main as getProductsList } from "../lib/product-service-stack/getProductsList";
import { main as getProductsById } from "../lib/product-service-stack/getProductsById";
import { main as createProduct } from "../lib/product-service-stack/createProduct";

const mockSend = jest.fn();

jest.mock("../lib/product-service-stack/dynamoClient", () => ({
  docClient: { send: (...args: unknown[]) => mockSend(...args) },
}));

const mockProducts = [
  {
    id: "id-1",
    title: "Product A",
    description: "Description A",
    price: 10,
  },
  {
    id: "id-2",
    title: "Product B",
    description: "Description B",
    price: 20,
  },
];

const mockStocks = [
  { product_id: "id-1", count: 3 },
  { product_id: "id-2", count: 7 },
];

beforeEach(() => {
  mockSend.mockReset();
});

describe("getProductsList", () => {
  beforeEach(() => {
    mockSend
      .mockResolvedValueOnce({ Items: mockProducts })
      .mockResolvedValueOnce({ Items: mockStocks });
  });

  it("returns all products as an array", async () => {
    const result = await getProductsList();

    expect(result).toHaveLength(2);
  });

  it("returns joined product+stock objects", async () => {
    const result = await getProductsList();

    expect(result[0]).toEqual({ ...mockProducts[0], count: 3 });
    expect(result[1]).toEqual({ ...mockProducts[1], count: 7 });
  });
});

describe("getProductsById", () => {
  it("returns the matching product as a flat object with count", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: mockProducts[0] })
      .mockResolvedValueOnce({ Item: mockStocks[0] });

    const result = await getProductsById({ id: "id-1" });

    expect(result).toEqual({ ...mockProducts[0], count: 3 });
  });

  it("returns a different product when a different id is provided", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: mockProducts[1] })
      .mockResolvedValueOnce({ Item: mockStocks[1] });

    const result = await getProductsById({ id: "id-2" });

    expect(result).toEqual({ ...mockProducts[1], count: 7 });
  });

  it("throws a [NotFound] error when the product does not exist", async () => {
    mockSend
      .mockResolvedValueOnce({ Item: undefined })
      .mockResolvedValueOnce({ Item: undefined });

    await expect(getProductsById({ id: "non-existent-id" })).rejects.toThrow(
      JSON.stringify({
        type: "[NotFound]",
        message: "Product with id non-existent-id not found",
      })
    );
  });
});

describe("createProduct", () => {
  const makeEvent = (body: object) =>
    ({ body: JSON.stringify(body) } as any);

  it("creates a product and returns 201 with the new product", async () => {
    mockSend.mockResolvedValueOnce({});

    const result = await createProduct(
      makeEvent({ title: "New Product", description: "Desc", price: 50, count: 5 })
    );

    expect(result.statusCode).toBe(201);
    const body = JSON.parse(result.body);
    expect(body.title).toBe("New Product");
    expect(body.price).toBe(50);
    expect(body.count).toBe(5);
    expect(typeof body.id).toBe("string");
  });

  it("returns 400 when title is missing", async () => {
    const result = await createProduct(makeEvent({ price: 10, count: 1 }));

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when price is not positive", async () => {
    const result = await createProduct(
      makeEvent({ title: "T", price: -5, count: 1 })
    );

    expect(result.statusCode).toBe(400);
  });

  it("returns 400 when count is negative", async () => {
    const result = await createProduct(
      makeEvent({ title: "T", price: 10, count: -1 })
    );

    expect(result.statusCode).toBe(400);
  });
});

