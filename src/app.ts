import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './routes/productRoutes';
import { ProductService } from './services/productService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api', productRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

export const initializeDatabase = async (): Promise<void> => {
  const productService = new ProductService();
  await productService.initializeTable();
  console.log('Database tables initialized');
};

export const startServer = async (): Promise<void> => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API endpoints: http://localhost:${PORT}/api/products`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}

export default app;