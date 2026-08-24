const { z } = require("zod");

// Mock product catalog — baad mein real DB se replace kar sakte ho
const PRODUCTS = [
  { id: "1", name: "Running Shoes - Nike Air", price: 65, category: "shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300" },
  { id: "2", name: "Classic White Sneakers", price: 45, category: "shoes", image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=300" },
  { id: "3", name: "Leather Jacket", price: 120, category: "clothing", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300" },
  { id: "4", name: "Wireless Headphones", price: 80, category: "electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300" },
  { id: "5", name: "Smart Watch", price: 150, category: "electronics", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300" },
  { id: "6", name: "Denim Jeans", price: 40, category: "clothing", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300" },
];

const searchProductsSchema = z.object({
  query: z.string().describe("Product name or keyword to search for"),
  maxPrice: z.number().optional().describe("Optional max price filter"),
});

async function searchProducts({ query, maxPrice }) {
  const q = query.toLowerCase();
  let results = PRODUCTS.filter(
    (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
  );
  if (maxPrice) results = results.filter((p) => p.price <= maxPrice);

  if (results.length === 0) {
    throw new Error(`No products found matching "${query}"`);
  }
  return results;
}

const toolDefinition = {
  type: "function",
  function: {
    name: "searchProducts",
    description: "Search the store's product catalog by keyword and optional max price. Use this whenever the user asks to find, browse, or compare products.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Product name or keyword" },
        maxPrice: { type: "number", description: "Optional max price in USD" },
      },
      required: ["query"],
    },
  },
};

module.exports = { searchProducts, searchProductsSchema, toolDefinition };