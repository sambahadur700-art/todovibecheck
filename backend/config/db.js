const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const uri =
      process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/vibecheckDB";
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    console.error("database connection error: ", error);
    process.exit(1);
  }
};

module.exports = connectDB;
