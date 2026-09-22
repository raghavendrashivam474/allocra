import mongoose from 'mongoose';

export async function connectDatabase(uri) {
  try {
    const conn = await mongoose.connect(uri, {
      dbName: 'allocra'
    });
    console.log(`[MongoDB] Connected successfully to Atlas: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    process.exit(1);
  }
}
