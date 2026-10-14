require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const url = process.env.SECRET_URL;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Connection tracking
let dbConnected = false;

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(url);
    dbConnected = true;
    console.log("successfully connected");
  } catch (error) {
    dbConnected = false;
    console.log("error:", error.message);
  }
}

connectDB();

// Basic Data Model (Student / Item Record)
const RecordSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, default: "General" },
    details: { type: String, default: "" },
  },
  { timestamps: true }
);

const Record = mongoose.model("Record", RecordSchema);

// API Endpoints
// 1. Connection status
app.get("/api/status", (req, res) => {
  res.json({
    connected: dbConnected,
    database: "university",
  });
});

// 2. READ (Get all records)
app.get("/api/records", async (req, res) => {
  try {
    const records = await Record.find().sort({ createdAt: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. CREATE (Add a record)
app.post("/api/records", async (req, res) => {
  try {
    const { name, email, department, details } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email are required" });
    }
    const newRecord = new Record({ name, email, department, details });
    const saved = await newRecord.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. UPDATE (Edit a record)
app.put("/api/records/:id", async (req, res) => {
  try {
    const { name, email, department, details } = req.body;
    const updated = await Record.findByIdAndUpdate(
      req.params.id,
      { name, email, department, details },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE (Remove a record)
app.delete("/api/records/:id", async (req, res) => {
  try {
    const deleted = await Record.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Record not found" });
    }
    res.json({ message: "Record deleted successfully", id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
