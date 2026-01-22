require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { poolPromise, sql } = require("./Database.js"); // your DB file

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "Server is running" });
});

app.post("/api/agent/register", async (req, res) => {
  const data = req.body;

  try {
    const pool = await poolPromise;

    await pool.request()
      .input("agent_uuid", sql.VarChar, data.agent_id)
      .input("hostname", sql.VarChar, data.hostname)
      .input("os", sql.VarChar, data.os)
      .input("architecture", sql.VarChar, data.architecture)
      .input("cpu_model", sql.VarChar, data.cpu_model)
      .input("cpu_cores", sql.Int, data.cpu_cores)
      .input("total_ram_gb", sql.Float, data.total_ram_gb)
      .input("manufacturer", sql.VarChar, data.manufacturer)
      .input("model", sql.VarChar, data.model)
      .query(`
        IF NOT EXISTS (SELECT 1 FROM agents WHERE agent_uuid = @agent_uuid)
        INSERT INTO agents (
          agent_uuid, hostname, os, architecture,
          cpu_model, cpu_cores, total_ram_gb,
          manufacturer, model, last_seen
        )
        VALUES (
          @agent_uuid, @hostname, @os, @architecture,
          @cpu_model, @cpu_cores, @total_ram_gb,
          @manufacturer, @model, GETDATE()
        )
      `);

    res.json({ message: "Agent registered" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Agent registration failed" });
  }
});

app.post("/api/metrics", async (req, res) => {
  const data = req.body;

  try {
    const pool = await poolPromise;

    const agent = await pool.request()
      .input("agent_uuid", sql.VarChar, data.agent_id)
      .query("SELECT agent_id FROM agents WHERE agent_uuid = @agent_uuid");

    if (!agent.recordset.length) {
      return res.status(404).json({ error: "Agent not registered" });
    }

    const agentId = agent.recordset[0].agent_id;

    await pool.request()
      .input("agent_id", sql.Int, agentId)
      .input("cpu_usage", sql.Float, data.cpu_usage)
      .input("ram_usage", sql.Float, data.ram_usage)
      .input("uptime_minutes", sql.BigInt, data.uptime_minutes)
      .query(`
        INSERT INTO system_metrics (
          agent_id, cpu_usage, ram_usage, uptime_minutes
        )
        VALUES (
          @agent_id, @cpu_usage, @ram_usage, @uptime_minutes
        )
      `);

    await pool.request()
      .input("agent_id", sql.Int, agentId)
      .query("UPDATE agents SET last_seen = GETDATE() WHERE agent_id = @agent_id");

    res.json({ message: "Metrics stored" });
  } catch (err) {
    console.error("Metrics error:", err);
    res.status(500).json({ error: "Metrics insert failed" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
