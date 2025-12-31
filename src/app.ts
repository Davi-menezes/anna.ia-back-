import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { config } from './config/config';
import { routeNotFound } from './middlewares/route-not-found';
import { errorHandler } from './middlewares/error-handler';
import { logger } from './utils/logger';
import userRoutes from './routes/user.routes';

export function createApp(): Application {
    const app = express();

    // Middleware
    app.use(helmet());
    app.use(cors());
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    app.use((req, res, next) => {
        logger.info(`${req.method} ${req.path}`);
        next();
    });

    // Health check endpoint
    app.get('/health', (req, res) => {
        res.status(200).json({ status: 'ok' });
    });

    // API routes
    app.use('/api/users', userRoutes);
    
    // Serve uploaded files
    app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
      setHeaders: (res, filePath) => {
        // Set appropriate headers for security
        if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg') || 
            filePath.endsWith('.png') || filePath.endsWith('.gif')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    }));

    // 404 handler
    app.use(routeNotFound);

    // Error handler
    app.use(errorHandler);

    return app;
}