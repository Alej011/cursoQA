import { Pool } from 'pg';
import { Product, CreateProductRequest } from '../models/Product';
import { getPool } from '../config/database';

export class ProductService {
  private pool: Pool;

  constructor(isTest: boolean = false) {
    this.pool = getPool(isTest);
  }

  async initializeTable(): Promise<void> {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
        category VARCHAR(100) NOT NULL,
        stock INTEGER NOT NULL CHECK (stock >= 0),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await this.pool.query(createTableQuery);
  }

  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const { name, description, price, category, stock } = productData;

    if (!name || !description || price < 0 || !category || stock < 0) {
      throw new Error('Invalid product data');
    }

    const query = `
      INSERT INTO products (name, description, price, category, stock)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [name, description, price, category, stock];
    const result = await this.pool.query(query, values);

    return result.rows[0];
  }

  async getProducts(): Promise<Product[]> {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';
    const result = await this.pool.query(query);
    return result.rows;
  }

  async getProductById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateProduct(id: number, productData: Partial<CreateProductRequest>): Promise<Product | null> {
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      return null;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    Object.entries(productData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    });

    if (updates.length === 0) {
      return existingProduct;
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE products
      SET ${updates.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [category]);
    return result.rows;
  }
}