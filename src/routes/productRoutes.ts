import { Router, Request, Response } from 'express';
import { ProductService } from '../services/productService';
import { CreateProductRequest, ProductResponse } from '../models/Product';

const router = Router();
const productService = new ProductService();

router.get('/products', async (req: Request, res: Response) => {
  try {
    const products = await productService.getProducts();

    const response: ProductResponse = {
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ProductResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    res.status(500).json(response);
  }
});

router.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    if (isNaN(id)) {
      const response: ProductResponse = {
        success: false,
        error: 'Invalid product ID'
      };
      return res.status(400).json(response);
    }

    const product = await productService.getProductById(id);

    if (!product) {
      const response: ProductResponse = {
        success: false,
        error: 'Product not found'
      };
      return res.status(404).json(response);
    }

    const response: ProductResponse = {
      success: true,
      data: product,
      message: 'Product retrieved successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ProductResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    res.status(500).json(response);
  }
});

router.post('/products', async (req: Request, res: Response) => {
  try {
    const productData: CreateProductRequest = req.body;

    const { name, description, price, category, stock } = productData;

    if (!name || !description || price === undefined || !category || stock === undefined) {
      const response: ProductResponse = {
        success: false,
        error: 'Missing required fields: name, description, price, category, stock'
      };
      return res.status(400).json(response);
    }

    if (price < 0 || stock < 0) {
      const response: ProductResponse = {
        success: false,
        error: 'Price and stock must be non-negative'
      };
      return res.status(400).json(response);
    }

    const newProduct = await productService.createProduct(productData);

    const response: ProductResponse = {
      success: true,
      data: newProduct,
      message: 'Product created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    const response: ProductResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    res.status(500).json(response);
  }
});

router.get('/products/category/:category', async (req: Request, res: Response) => {
  try {
    const category = req.params.category;
    const products = await productService.getProductsByCategory(category);

    const response: ProductResponse = {
      success: true,
      data: products,
      message: `Products in category '${category}' retrieved successfully`
    };

    res.status(200).json(response);
  } catch (error) {
    const response: ProductResponse = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };

    res.status(500).json(response);
  }
});

export default router;