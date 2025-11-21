// Quick MongoDB connection test
const mongoose = require('mongoose');

console.log('Starting MongoDB test...');
console.log('Initial state:', mongoose.connection.readyState);

const mongoUri = process.env.MONGO_URI || 'mongodb://mongodb:27017/careforall';
console.log('Connecting to:', mongoUri);

mongoose.connect(mongoUri, {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  family: 4
}).then(() => {
  console.log('Connected! State:', mongoose.connection.readyState);
  console.log('DB name:', mongoose.connection.name);
  console.log('Host:', mongoose.connection.host);
  
  // Try a simple operation
  const testSchema = new mongoose.Schema({ test: String });
  const TestModel = mongoose.model('Test', testSchema);
  
  return TestModel.findOne({}).exec();
}).then((result) => {
  console.log('Query result:', result);
  console.log('State after query:', mongoose.connection.readyState);
  process.exit(0);
}).catch((err) => {
  console.error('Error:', err);
  console.error('State after error:', mongoose.connection.readyState);
  process.exit(1);
});
