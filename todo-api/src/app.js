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
app.get(['/api-docs', '/api-docs/'], (req, res) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
      "img-src 'self' data: https:; font-src 'self' data: https://cdn.jsdelivr.net; connect-src 'self'"
  );
  res.type('html').send(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <title>API Todos List Management</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '/api-docs.json',
        dom_id: '#swagger-ui',
        persistAuthorization: true
      });
    };
  </script>
</body>
</html>`);
});
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API Todos List Management berjalan',
    health: '/health',
    docs: '/api-docs',
  });
});
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