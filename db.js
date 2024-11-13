const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // Reemplaza con tu usuario de la base de datos
  host: 'localhost', // Reemplaza si es necesario
  database: 'kine', // Nombre de tu base de datos
  password: '1997', // Reemplaza con tu contraseña
  port: 5432, // Puerto de tu base de datos
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
