const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const connectDB = require("./ConnectDB/ConnectDB");
const Users = require("./Models/userModel");
require("dotenv").config();
const bcryptjs = require("bcryptjs");
const validator = require("validator");
const Tasks = require("./Models/taskModel");
const app = express();
const port = process.env.PORT || 5000;
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://taskose-1a5e8.web.app",
      "taskose-1a5e8.firebaseapp.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
};
connectDB();
// Middleware

const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // console.log("token came", token);
  if (!token) {
    return res.status(401).send({ message: "Unauthorized access" });
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};
try {
  app.get("/", async (req, res) => {
    res.send({ message: "Hello World" });
  });

  app.post("/sign-up", async (req, res) => {
    try {
      const user = req.body;
      const { username, email, password } = user;
      if (!validator.isEmail(email)) {
        return res.send({ message: "Invalid email", status: 400 });
      }
      if (!validator.isStrongPassword(password)) {
        return res.send({ message: "Password not strong enough", status: 400 });
      }
      // console.log("from line 27", user);
      const userExist = await Users.findOne({ email });
      // console.log("userExist", userExist);
      if (userExist) {
        res.send({ message: "user already exist", status: 409 });
      }
      const hashedPassword = await bcryptjs.hash(password, 10);
      const newUser = new Users({
        userName: username,
        email,
        password: hashedPassword,
      });
      await newUser.save();
      res.send({ message: "User created successfully", status: 201 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  app.post("/sign-in", async (req, res) => {
    try {
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
      const userInfo = {
        userName: userExist.userName,
        email: userExist.email,
        role: userExist.role,
        date: userExist.date,
      };
      res.cookie("token", token, cookieOptions).send({
        message: "Login successful",
        status: 200,
        token: token,
        userInfo,
      });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Sign out
  app.get("/sign-out", async (req, res) => {
    try {
      console.log("hitting sign out");
      res
        .clearCookie("token", {
          maxAge: 0,
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          secure: process.env.NODE_ENV === "production",
        })
        .send({ message: "Sign out successful", status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  app.get("/user-info", verifyToken, async (req, res) => {
    // const token = req.headers.authorization.split(" ")[1];
    try {
      // console.log("from line 60", req.user);

      const user = await Users.findOne({ email: req.user.email });
      const userInfo = {
        userName: user.userName,
        email: user.email,
        role: user.role,
        date: user.date,
      };
      res.send(userInfo);
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Filter tasks
  app.get("/filter-tasks", verifyToken, async (req, res) => {
    try {
      const { status, priority, filter, email, page, size } = req.query;
      const intPage = parseInt(page);
      const intSize = parseInt(size);
      const skip = (intPage - 1) * intSize;
      const limit = intSize;
      console.log("from line 81", typeof intPage, typeof intSize);
      if (priority !== "undefined" && priority) {
        console.log("hitting");
        const filteredTask = await Tasks.find({ priority: priority })
          .skip(skip)
          .limit(limit);
        console.log("from line 93", filteredTask);
        return res.send({ filteredTask, status: 200 });
      } else if (status !== "undefined" && status) {
        const filteredTask = await Tasks.find({
          assignedTo: { $elemMatch: { status: status } },
        })
          .skip(skip)
          .limit(limit);
        console.log("from line 97", filteredTask);

        return res.send({ filteredTask, status: 200 });
      } else if (filter !== "undefined" && filter) {
        const filteredTask = await Tasks.find({}).skip(skip).limit(limit);
        return res.send({ filteredTask, status: 200 });
      } else if (email !== "undefined") {
        const filteredTask = await Tasks.find({
          "assignedTo.email": email,
        })
          .skip(skip)
          .limit(limit);
        return res.send({ filteredTask, status: 200 });
      }
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Generate report
  app.get("/generate-report", verifyToken, async (req, res) => {
    try {
      const { status, user, date } = req.query;
      let tasks;
      if (status) {
        // console.log("status");
        tasks = await Tasks.find({
          assignedTo: { $elemMatch: { status: status } },
        });
      } else if (user) {
        // console.log("user");
        tasks = await Tasks.find({
          "assignedTo.email": user,
        });
      } else if (date) {
        const isoDate = new Date(date);
        console.log("isoDate", isoDate);
        tasks = await Tasks.find({ dueDate: { $lte: isoDate } });
      }

      const summary = tasks.map((task) => {
        return {
          status: task.assignedTo.map((user) => user.status)[0],
          priority: task.priority,
          dueDate: task.dueDate,
          assignedTo: task.assignedTo.map((user) => user.email)[0],
        };
      });
      return res.send({ summary, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Create task
  app.post("/create-task", verifyToken, async (req, res) => {
    try {
      const taskInfo = req.body;
      console.log("from line 82", taskInfo);
      // const token = req.headers.authorization.split(" ")[1];
      // const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // console.log("from line 85", decoded.email);
      console.log("from line 184", req?.user?.email);
      const isAdmin = await Users.findOne({ email: req?.user?.email });
      console.log("from line 87", isAdmin);
      if (isAdmin.role !== "Admin") {
        console.log("from line 89", isAdmin.role !== "Admin");
        if (Object.keys(taskInfo.assignedTo).length === 0) {
          console.log("hitting");

          taskInfo.assignedTo = {
            ...taskInfo.assignedTo,
            email: req.user.email,
            status: "To Do",
          };
          const newTask = new Tasks(taskInfo);
          await newTask.save();
          return res.send({
            message: "Task created successfully",
            status: 200,
          });
          // taskInfo.assignedTo.push(data);
        }
      }

      console.log("from line 97", taskInfo);
      // Insert task to DB
      const newTask = new Tasks(taskInfo);
      await newTask.save();

      res.send({ message: "Task created successfully", status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Get all tasks for User based on email
  app.get("/all-tasks", verifyToken, async (req, res) => {
    try {
      const tasks = await Tasks.find({
        "assignedTo.email": req.user.email,
      });
      console.log("from line 117", tasks);
      res.send({ tasks, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Get all tasks for Admin
  app.get("/all-tasks-admin", verifyToken, async (req, res) => {
    try {
      const { page, size } = req.query;
      const intPage = parseInt(page);
      const intSize = parseInt(size);
      const skip = (intPage - 1) * intSize;
      const limit = intSize;
      const tasks = await Tasks.find().skip(skip).limit(limit);
      res.send({ tasks, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Get All user
  app.get("/all-user-admin", verifyToken, async (req, res) => {
    try {
      const users = await Users.find({});
      // console.log("from line 131", users);
      const usersWithoutPassword = users.map((user) => {
        return {
          _id: user._id,
          userName: user.userName,
          email: user.email,
          role: user.role,
          date: user.date,
        };
      });
      res.send({ usersWithoutPassword, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Delte task
  app.delete("/delete-task/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("from line 124", id);
      await Tasks.findByIdAndDelete(id);
      res.send({ message: "Task deleted successfully", status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Update task
  app.patch("/update-task/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      const editedTaskInfo = req.body;
      console.log("from line 133", editedTaskInfo);
      if (Object.keys(editedTaskInfo.assignedTo).length === 0) {
        editedTaskInfo.assignedTo = {
          ...editedTaskInfo.assignedTo,
          email: req?.user?.email,
          status: "To Do",
        };
      }
      const editableTask = await Tasks.findByIdAndUpdate(
        id,
        { $set: editedTaskInfo },
        { new: true }
      );

      if (!editableTask) {
        res.send({ message: "Task not found", status: 404 });
      }

      res.send({ message: "Task updated successfully", status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Get single task
  app.get("/task-info/:id", verifyToken, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("from line 153", id);
      const singleTask = await Tasks.findById(id);
      if (!singleTask) {
        res.send({ message: "Task not found", status: 404 });
      }
      res.send({ singleTask, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });

  // Get number of tasks
  app.get("/number-of-tasks", verifyToken, async (req, res) => {
    try {
      const taskNumber = await Tasks.find({}).countDocuments();
      console.log(taskNumber);
      res.send({ taskNumber, status: 200 });
    } catch (error) {
      res.send({ customMessage: "Something went wrong", status: 500 });
    }
  });
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
} catch (error) {
  console.log(error);
}
