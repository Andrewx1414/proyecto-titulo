const db = require('./db.js'); // Reemplaza 'archivoConexion' con el nombre de tu archivo de conexión

db.query('SELECT NOW()', [])
  .then((res) => {
    console.log('Conexión exitosa:');
    console.log(res.rows); // Muestra la hora actual del servidor
  })
  .catch((err) => {
    console.error('Error en la conexión:', err.message); // Muestra cualquier error de conexión
  })
  .finally(() => {
    process.exit(); // Finaliza el proceso una vez que termine
  });
