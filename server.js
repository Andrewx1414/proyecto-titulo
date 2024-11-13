const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db'); // Asegúrate de que este archivo exista y esté configurado correctamente

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Endpoint para crear un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  const { nombre, email, password, usuario } = req.body;

  try {
    // Inserta el nuevo usuario en la base de datos
    const result = await db.query(
      'INSERT INTO usuarios (nombre, email, contraseña, tipo_usuario) VALUES ($1, $2, $3, $4)',
      [nombre, email, password, usuario] // Aquí usamos 'contraseña' en lugar de 'password'
    );
    res.json({ success: true, message: 'Usuario creado exitosamente' });
  } catch (error) {
    console.error('Error en el servidor:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
