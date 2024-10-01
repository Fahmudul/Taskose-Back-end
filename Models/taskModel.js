const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    taskTitle: String,
    taskDescription: String,
    assignedTo: [
      {
        email: { type: String, required: true },
        status: { type: String, default: "To Do" },
      },
    ],
    dueDate: {
      type: Date,
    },
    priority: String,
  },
  {
    collection: "Tasks",
  }
);

const Tasks = mongoose.models.Tasks || mongoose.model("Tasks", taskSchema);

module.exports = Tasks;
