const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  options: {
    trustServerCertificate: true
  }
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log("MSSQL Connected");
    return pool;
  })
  .catch(err => {
    console.error("MSSQL Connection Failed:", err);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
