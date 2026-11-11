require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
require('./models/User');
require('./models/Category');
require('./models/Todo');
require('./models/ActivityLog');

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server jalan di port ${PORT}`));
});