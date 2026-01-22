const si = require("systeminformation");
const axios = require("axios");

const AGENT_ID = "agent-001"; 
const SERVER_BASE_URL = "http://localhost:5000";
const DYNAMIC_INTERVAL = 1000;


async function collectStaticInfo() {
  const [system, osInfo, cpu, mem] = await Promise.all([
    si.system(),
    si.osInfo(),
    si.cpu(),
    si.mem()
  ]);

  return {
    agent_id: AGENT_ID,
    hostname: osInfo.hostname,
    os: `${osInfo.distro} ${osInfo.release}`,
    architecture: osInfo.arch,
    cpu_model: `${cpu.manufacturer} ${cpu.brand}`,
    cpu_cores: cpu.cores,
    total_ram_gb: (mem.total / 1024 / 1024 / 1024).toFixed(2),
    manufacturer: system.manufacturer,
    model: system.model
  };
}

async function collectDynamicInfo() {
  const [load, mem, time] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.time()
  ]);

  return {
    agent_id: AGENT_ID,
    cpu_usage: load.currentLoad.toFixed(2),
    ram_usage: (((mem.total - mem.available) / mem.total) * 100).toFixed(2),
    uptime_minutes: Math.floor(time.uptime / 60),
    timestamp: new Date().toISOString()
  };
}

async function sendStaticInfo() {
  const data = await collectStaticInfo();
  console.log("Static Info:");
  console.log(data);

  await axios.post(`${SERVER_BASE_URL}/api/agent/register`, data);
}

async function sendDynamicInfo() {
  const data = await collectDynamicInfo();
  console.log("Dynamic Info:");
  console.log(data);

  await axios.post(`${SERVER_BASE_URL}/api/metrics`, data);
}

async function startAgent() {
  try {
    console.log("Node Agent Started");

    await sendStaticInfo();

    setInterval(async () => {
      try {
        await sendDynamicInfo();
      } catch (err) {
        console.error("Failed to send dynamic data:", err.message);
      }
    }, DYNAMIC_INTERVAL);

  } catch (err) {
    console.error("Agent startup failed:", err.message);
  }
}

startAgent();
