import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set in environment');

  await mongoose.connect(uri, {
    dbName: 'shopnow',
  });

  console.log(`MongoDB connected: ${mongoose.connection.host}`);

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB error:', err);
  });
}
