

const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Reemplaza con tu usuario de PostgreSQL
  host: 'localhost',
  database: 'kine', // Reemplaza con el nombre de tu base de datos
  password: '1997', // Reemplaza con tu contraseña
  port: 5432, // Reemplaza si es necesario
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
