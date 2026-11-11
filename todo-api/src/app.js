const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const logger = require('./middleware/logger.middleware');
const notFound = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/errorHandler.middleware');
const authRoutes = require('./routes/auth.routes');
const todoRoutes = require('./routes/todo.routes');
const categoryRoutes = require('./routes/category.routes');
const activityRoutes = require('./routes/activity.routes');
const statsRoutes = require('./routes/stats.routes');
const swaggerUi = require('swagger-ui-express');
const openapi = require('./docs/openapi');
const app = express();

app.use(helmet());
app.use(cors());
app.use(logger);
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api-docs.json', (req, res) => res.json(openapi));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(openapi, {
    customSiteTitle: 'Todo API Docs',
    swaggerOptions: { persistAuthorization: true },
  })
);
app.use('/api/stats', statsRoutes);
app.use('/api/activity-logs', activityRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/categories', categoryRoutes);
// Dua baris ini WAJIB paling akhir (setelah semua route)
app.use(notFound);
app.use(errorHandler);

module.exports = app;