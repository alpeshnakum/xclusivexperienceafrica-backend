const express = require("express");
const cors = require("cors");
const router = require("./routes/route");
const db = require("./utils/db");
const purchaseController = require("./controllers/purchaseController");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const URL = process.env.API_URL || `http://localhost:${PORT}`
db();
app.use('/webhook', express.raw({ type: "application/json" }), purchaseController().handleWebhook)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use("/uploads", express.static("uploads"));
app.use(cors({
  origin: true,
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use("/api", router)
app.get("/check", (req, res) => {
  res.json({ message: "API is working!" });
});

app.listen(PORT, () => {
  console.log(`Server is running well on ${URL}`);
});
