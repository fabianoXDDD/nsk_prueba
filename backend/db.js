const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'nombre_de_tu_bd',
  password: 'tu_password',
  port: 5432,
});

module.exports = pool;
