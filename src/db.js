const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  port: 5432,
  user: "myuser",
  password: "mypassword",
  database: "mydb",
});

module.exports = pool;
