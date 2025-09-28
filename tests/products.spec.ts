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

    // console.log('Connected to test database for Products API');
  }, 30000);

  // beforeEach(async () => {
  //   const client = await productService['pool'].connect();
  //   try {
  //     await client.query('TRUNCATE TABLE products RESTART IDENTITY CASCADE');
  //   } finally {
  //     client.release();
  //   }
  // });

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

      console.log('--- ANTES DE CREAR PRODUCTO ---');
      let beforeProducts = await productService.getProducts();
      console.log(`Productos en BD antes: ${beforeProducts.length}`);

      const response = await request(app)
        .post('/api/products')
        .send(newProduct)
        .expect(201);

      console.log('--- DESPUES DE CREAR PRODUCTO ---');
      console.log('Producto creado:', response.body.data);

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
      console.log(`Productos en BD despues: ${productsInDb.length}`);
      console.log('Producto en BD:', productsInDb[0]);
      expect(productsInDb.length).toBeGreaterThan(beforeProducts.length);
      const lastProduct = productsInDb.find(p => p.name === newProduct.name);
      expect(lastProduct).toBeDefined();
      expect(lastProduct?.name).toBe(newProduct.name);
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
      const invalidProducts = productsInDb.filter(p => p.name === '');
      expect(invalidProducts).toHaveLength(0);
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
      const negativeProducts = productsInDb.filter(p => p.price < 0 || p.stock < 0);
      expect(negativeProducts).toHaveLength(0);
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

      console.log('--- CREANDO MULTIPLES PRODUCTOS ---');
      const createdProduct1 = await productService.createProduct(product1);
      console.log('Producto 1 creado con ID:', createdProduct1.id);

      const createdProduct2 = await productService.createProduct(product2);
      console.log('Producto 2 creado con ID:', createdProduct2.id);

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      console.log('--- CONSULTANDO TODOS LOS PRODUCTOS ---');
      console.log('Cantidad de productos encontrados:', response.body.data.length);
      console.log('Productos:', response.body.data.map((p: { id: any; name: any; }) => ({ id: p.id, name: p.name })));

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(2);
      expect(response.body.message).toBe('Products retrieved successfully');

      const products = response.body.data;
      const product1Found = products.find((p: any) => p.name === 'Product 1');
      const product2Found = products.find((p: any) => p.name === 'Product 2');
      expect(product1Found).toBeDefined();
      expect(product2Found).toBeDefined();
    });

    it('should return empty array when no products exist', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
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

      console.log('--- CREANDO PRODUCTO PARA BUSCAR POR ID ---');
      const createdProduct = await productService.createProduct(newProduct);
      console.log('Producto creado con ID:', createdProduct.id, 'Nombre:', createdProduct.name);

      const response = await request(app)
        .get(`/api/products/${createdProduct.id}`)
        .expect(200);

      console.log('--- CONSULTANDO PRODUCTO POR ID ---');
      console.log('Producto encontrado:', { id: response.body.data.id, name: response.body.data.name });

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
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const electronicsProducts = response.body.data.filter((p: any) => p.category === 'Electronics');
      expect(electronicsProducts.length).toBeGreaterThanOrEqual(1);
      const smartphoneProduct = response.body.data.find((p: any) => p.name === 'Smartphone');
      expect(smartphoneProduct).toBeDefined();
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