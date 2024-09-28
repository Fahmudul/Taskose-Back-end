const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const connectDB = require("./ConnectDB/ConnectDB");
const Users = require("./Models/model");
require("dotenv").config();
const bcryptjs = require("bcryptjs");
const app = express();
const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
connectDB();
try {
  app.get("/", async (req, res) => {
    res.send({ message: "Hello World" });
  });

  app.post("/sign-up", async (req, res) => {
    const user = req.body;
    const { username, email, password } = user;
    // console.log("from line 27", user);
    const userExist = await Users.findOne({ email });
    // console.log("userExist", userExist);
    if (userExist) {
      res.send({ message: "user already exist" });
    }
    const hashedPassword = await bcryptjs.hash(password, 10);
    const newUser = new Users({
      userName: username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res.send({ message: "User created successfully", status: 200 });
  });

  app.post("/sign-in", async (req, res) => {
    const user = req.body;
    const { email, password } = user;
    const userExist = await Users.findOne({ email });
    if (!userExist) {
      res.send({ message: "User does not exist" });
    }
    if (!(await bcryptjs.compare(password, userExist.password))) {
      res.send({ message: "Incorrect password" });
    }
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.send({
      message: "Login successful",
      status: 200,
      token: token,
      role: userExist.role,
    });
  });

  app.get("/user-info", async (req, res) => {
    const token = req.headers.authorization.split(" ")[1];
    // console.log("from line 66", token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Users.findOne({ email: decoded.email });
    console.log("from line 69", user);
    const userInfo = {
      userName: user.userName,
      email: user.email,
      role: user.role,
      date: user.date,
    };
    res.send(userInfo);
  });

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
} catch (error) {
  console.log(error);
}
