import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app, { initializeDatabase } from '../src/app';
import { ProductService } from '../src/services/productService';
import { CreateProductRequest } from '../src/models/Product';

describe('Products API Integration Tests', () => {
  let productService: ProductService;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    productService = new ProductService(true);
    await productService.initializeTable();

    console.log('Connected to test database for Products API');
  }, 30000);

  beforeEach(async () => {
    const client = await productService['pool'].connect();
    try {
      await client.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
    } finally {
      client.release();
    }
  });

  afterAll(async () => {
    if (productService) {
      await productService['pool'].end();
    }
    console.log('Disconnected from test database');
  }, 15000);

  describe('POST /api/products', () => {
    it('should create a new product successfully', async () => {
      const newProduct: CreateProductRequest = {
        name: 'Laptop Gaming',
        description: 'High performance gaming laptop',
        price: 1500.99,
        category: 'Electronics',
        stock: 10
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        name: newProduct.name,
        description: newProduct.description,
        price: newProduct.price.toString(),
        category: newProduct.category,
        stock: newProduct.stock
      });
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.created_at).toBeDefined();
      expect(response.body.message).toBe('Product created successfully');

      const productsInDb = await productService.getProducts();
      expect(productsInDb).toHaveLength(1);
      expect(productsInDb[0].name).toBe(newProduct.name);
    });

    it('should return 400 for invalid product data', async () => {
      const invalidProduct = {
        name: '',
        description: 'Test description',
        price: -10,
        category: 'Electronics'
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');

      const productsInDb = await productService.getProducts();
      expect(productsInDb).toHaveLength(0);
    });

    it('should return 400 for negative price or stock', async () => {
      const invalidProduct: CreateProductRequest = {
        name: 'Test Product',
        description: 'Test description',
        price: -50,
        category: 'Electronics',
        stock: -5
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Price and stock must be non-negative');

      const productsInDb = await productService.getProducts();
      expect(productsInDb).toHaveLength(0);
    });
  });

  describe('GET /api/products', () => {
    it('should return all products successfully', async () => {
      const product1: CreateProductRequest = {
        name: 'Product 1',
        description: 'First product',
        price: 100,
        category: 'Category A',
        stock: 5
      };

      const product2: CreateProductRequest = {
        name: 'Product 2',
        description: 'Second product',
        price: 200,
        category: 'Category B',
        stock: 10
      };

      await productService.createProduct(product1);
      await productService.createProduct(product2);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.message).toBe('Products retrieved successfully');

      const products = response.body.data;
      expect(products[0].name).toBe('Product 2');
      expect(products[1].name).toBe('Product 1');
    });

    it('should return empty array when no products exist', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.message).toBe('Products retrieved successfully');
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return specific product by ID', async () => {
      const newProduct: CreateProductRequest = {
        name: 'Specific Product',
        description: 'Product for ID test',
        price: 299.99,
        category: 'Test Category',
        stock: 15
      };

      const createdProduct = await productService.createProduct(newProduct);

      const response = await request(app)
        .get(`/api/products/${createdProduct.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(createdProduct.id);
      expect(response.body.data.name).toBe(newProduct.name);
      expect(response.body.message).toBe('Product retrieved successfully');
    });

    it('should return 404 for non-existent product ID', async () => {
      const response = await request(app)
        .get('/api/products/999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    it('should return 400 for invalid product ID format', async () => {
      const response = await request(app)
        .get('/api/products/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid product ID');
    });
  });

  describe('GET /api/products/category/:category', () => {
    it('should return products filtered by category', async () => {
      const electronicsProduct: CreateProductRequest = {
        name: 'Smartphone',
        description: 'Latest smartphone',
        price: 800,
        category: 'Electronics',
        stock: 20
      };

      const clothingProduct: CreateProductRequest = {
        name: 'T-Shirt',
        description: 'Comfortable t-shirt',
        price: 25,
        category: 'Clothing',
        stock: 50
      };

      await productService.createProduct(electronicsProduct);
      await productService.createProduct(clothingProduct);

      const response = await request(app)
        .get('/api/products/category/Electronics')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Electronics');
      expect(response.body.data[0].name).toBe('Smartphone');
      expect(response.body.message).toBe("Products in category 'Electronics' retrieved successfully");
    });

    it('should return empty array for category with no products', async () => {
      const response = await request(app)
        .get('/api/products/category/NonExistentCategory')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
      expect(response.body.message).toBe("Products in category 'NonExistentCategory' retrieved successfully");
    });
  });

  describe('API Health Check', () => {
    it('should return API health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('API is running');
      expect(response.body.timestamp).toBeDefined();
    });
  });
});