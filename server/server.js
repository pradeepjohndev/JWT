const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { poolPromise, sql } = require("./Database");
const authenticateToken = require("./Auth_middleware");

const app = express();
app.use(express.json());
app.use(cors());

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const pool = await poolPromise;

    const result = await pool
      .request()
      .input("email", sql.VarChar, email)
      .query("SELECT * FROM Users WHERE email = @email");

    const user = result.recordset[0];
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.get("/dashboard", authenticateToken, (req, res) => {
  res.json({
    message: "Welcome to dashboard",
    user: req.user
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
