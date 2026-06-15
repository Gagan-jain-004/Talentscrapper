import mongoose from 'mongoose';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

let cached: MongooseCache = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function connectDB(retries = 3, delay = 1000): Promise<typeof mongoose> {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside your project environment settings.');
  }
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).catch((err) => {
      cached.promise = null;
      throw err;
    });
  }

  for (let i = 0; i < retries; i++) {
    try {
      cached.conn = await cached.promise;
      return cached.conn;
    } catch (err: any) {
      console.error(`MongoDB connection attempt ${i + 1} failed. Retrying in ${delay}ms...`, err);
      cached.promise = null;
      if (i < retries - 1) {
        await sleep(delay);
        cached.promise = mongoose.connect(MONGODB_URI!, { bufferCommands: false }).catch((e) => {
          cached.promise = null;
          throw e;
        });
      } else {
        throw new Error(`Failed to connect to MongoDB after ${retries} attempts: ${err.message}`);
      }
    }
  }

  throw new Error('MongoDB connection failed');
}
