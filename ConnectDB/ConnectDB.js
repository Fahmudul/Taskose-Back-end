const mongoose = require("mongoose");
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const connection = mongoose.connection;
    connection.on("connected", () => {
      console.log("MongoDB connected");
    });
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};
// export default connectDB;

module.exports = connectDB;
