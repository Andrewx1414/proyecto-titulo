const express = require('express');
const cors = require('cors');
const db = require('./db'); // Archivo para conectarse a la base de datos

// Crear una instancia de Express
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json()); // Middleware para procesar JSON
app.use(cors());

// Endpoint para registrar un nuevo usuario
// Endpoint para registrar un nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  let {
    rut,
    nombre,
    apellidos,
    email,
    password,
    tipo_usuario,
    fecha_nacimiento,
    telefono,
    direccion,
    especialidad,
    terapeuta_id // Nuevo campo para referenciar el terapeuta
  } = req.body;

  let camposFaltantes = [];

  // Convertir tipo_usuario a minúscula para la comparación
  tipo_usuario = tipo_usuario ? tipo_usuario.toLowerCase() : '';

  // Verificar los campos comunes para ambos tipos de usuario
  if (!rut) camposFaltantes.push('rut');
  if (!nombre) camposFaltantes.push('nombre');
  if (!apellidos) camposFaltantes.push('apellidos');
  if (!email) camposFaltantes.push('email');
  if (!password) camposFaltantes.push('password');
  if (!tipo_usuario) camposFaltantes.push('tipo_usuario');

  // Validar valores posibles de tipo_usuario
  const valoresPermitidos = ['paciente', 'terapeuta', 'administrador'];
  if (tipo_usuario && !valoresPermitidos.includes(tipo_usuario)) {
    camposFaltantes.push('tipo_usuario (valor no válido)');
  }

  // Validar campos adicionales según el tipo de usuario
  if (tipo_usuario === 'paciente') {
    if (!fecha_nacimiento) camposFaltantes.push('fecha_nacimiento');
    if (!telefono) camposFaltantes.push('telefono');
    if (!direccion) camposFaltantes.push('direccion');
    if (!terapeuta_id) camposFaltantes.push('terapeuta_id'); // Verificar terapeuta_id para pacientes
  } else if (tipo_usuario === 'terapeuta') {
    if (!especialidad) camposFaltantes.push('especialidad');
  }

  // Si hay campos faltantes, responder con un mensaje detallado
  if (camposFaltantes.length > 0) {
    console.log('Campos faltantes:', camposFaltantes); // Registrar en consola los campos faltantes
    return res.status(400).json({ 
      success: false, 
      message: `Campos requeridos faltantes: ${camposFaltantes.join(', ')}` 
    });
  }

  try {
    // Ejecutar la consulta para insertar un nuevo usuario en la base de datos
    const result = await db.query(
      `INSERT INTO usuarios (rut, nombre, apellidos, email, password, tipo_usuario, fecha_nacimiento, telefono, direccion, especialidad, terapeuta_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [rut, nombre, apellidos, email, password, tipo_usuario, fecha_nacimiento, telefono, direccion, especialidad, terapeuta_id]
    );

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error en el servidor al registrar usuario:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});


// Endpoint para autenticar un usuario
app.post('/api/login', async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos' });
  }

  try {
    console.log(`Intentando autenticar usuario con email: ${email}`);
    
    const result = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND password = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('Usuario autenticado exitosamente:', user);
      res.json({
        success: true,
        user: {
          id: user.id,
          tipo_usuario: user.tipo_usuario,
          nombre: user.nombre,
          apellidos: user.apellidos,
          email: user.email,
          rut: user.rut,
          fecha_nacimiento: user.fecha_nacimiento,
          telefono: user.telefono,
          direccion: user.direccion,
          especialidad: user.especialidad,
        }
      });
    } else {
      console.log('Usuario o contraseña incorrectos');
      res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
  } catch (error) {
    console.error('Error en el servidor al autenticar usuario:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para obtener la lista de pacientes asignados a un terapeuta
app.get('/api/pacientes', async (req, res) => {
  const { terapeuta_id } = req.query;

  if (!terapeuta_id) {
    return res.status(400).json({ success: false, message: 'El ID del terapeuta es requerido' });
  }

  try {
    console.log(`Obteniendo lista de pacientes para terapeuta_id: ${terapeuta_id}`);
    
    // Consulta para obtener todos los pacientes asociados al terapeuta
    const result = await db.query(
      `SELECT * 
       FROM usuarios 
       WHERE tipo_usuario = 'paciente' AND terapeuta_id = $1`,
      [terapeuta_id]
    );

    res.json({ success: true, pacientes: result.rows });
  } catch (error) {
    console.error('Error al obtener la lista de pacientes:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});



// Endpoint para obtener la lista de ejercicios disponibles
app.get('/api/ejercicios', async (req, res) => {
  try {
    console.log('Obteniendo lista de ejercicios');
    const result = await db.query('SELECT * FROM ejercicios');
    res.json({ success: true, ejercicios: result.rows });
  } catch (error) {
    console.error('Error al obtener la lista de ejercicios:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para asignar una sesión a un paciente
app.post('/api/asignar-sesion', async (req, res) => {
  const { paciente_id, terapeuta_id, fecha, descripcion, ejercicio_id } = req.body;

  if (!paciente_id || !terapeuta_id || !fecha || !descripcion || !ejercicio_id) {
    console.log('Campos faltantes en la solicitud de asignación de sesión');
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  try {
    console.log(`Asignando sesión al paciente ${paciente_id} por terapeuta ${terapeuta_id}`);
    const result = await db.query(
      `INSERT INTO citas (paciente_id, terapeuta_id, fecha, descripcion, ejercicio_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paciente_id, terapeuta_id, fecha, descripcion, ejercicio_id]
    );
    res.json({ success: true, sesion: result.rows[0] });
  } catch (error) {
    console.error('Error al asignar la sesión:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para obtener las citas de un paciente en un mes específico
app.get('/api/citas', async (req, res) => {
  const { paciente_id, year, month } = req.query;

  if (!paciente_id || !year || !month) {
    return res.status(400).json({ success: false, message: 'Faltan parámetros requeridos: paciente_id, year, month' });
  }

  try {
    const result = await db.query(
      `SELECT * FROM citas WHERE paciente_id = $1 AND EXTRACT(YEAR FROM fecha) = $2 AND EXTRACT(MONTH FROM fecha) = $3`,
      [paciente_id, year, month]
    );

    res.json({ success: true, citas: result.rows });
  } catch (error) {
    console.error('Error al obtener las citas:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para obtener información de un ejercicio específico
app.get('/api/ejercicio/:id', async (req, res) => {
  const { id } = req.params;
  try {
    console.log(`Obteniendo información del ejercicio con ID: ${id}`);
    const result = await db.query(
      'SELECT * FROM ejercicios WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ejercicio no encontrado' });
    }

    res.json({ success: true, ejercicio: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener el ejercicio:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});




// Ruta comodín para manejar solicitudes no encontradas
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint no encontrado' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
