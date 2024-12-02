const express = require('express');
const cors = require('cors');
const db = require('./db'); // Archivo para conectarse a la base de datos

// Crear una instancia de Express
const app = express();
const PORT = 3000;
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const saltRounds = 10;

// Middleware
app.use(express.json()); // Middleware para procesar JSON
app.use(cors());


const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465, // Puerto seguro
  secure: true, // Asegura que se use TLS
  auth: {
    user: 'maackinesiologia.talca@gmail.com',
    pass: 'xhepftahjwfxihmy',
  },
});

const path = require('path');

app.post('/api/usuarios', async (req, res) => {
  const {
    tipo_usuario,
    rut,
    nombre,
    apellidos,
    email,
    password,
    fecha_nacimiento,
    telefono,
    direccion,
    especialidad,
    terapeuta_id,
    patologia,
  } = req.body;

  if (!tipo_usuario || !rut || !nombre || !apellidos || !email || !password) {
    return res.status(400).json({ success: false, message: 'Campos obligatorios faltantes.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const query = `
      INSERT INTO usuarios (
        tipo_usuario, rut, nombre, apellidos, email, password, fecha_nacimiento,
        telefono, direccion, especialidad, terapeuta_id, patologia
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id;
    `;

    const values = [
      tipo_usuario, rut, nombre, apellidos, email, hashedPassword,
      fecha_nacimiento || null, telefono || null, direccion || null,
      especialidad || null, terapeuta_id || null, patologia || null,
    ];

    const result = await db.query(query, values);

    // Enviar respuesta rápida indicando que el usuario fue creado
    res.status(202).json({
      success: true,
      message: 'Usuario creado. Enviando correo...',
      userId: result.rows[0].id,
    });

    // Configuración del correo electrónico
    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com',
      to: email,
      subject: 'Credenciales de Acceso',
      text: `Hola ${nombre} ${apellidos}, se ha creado una cuenta para ti.`,
      html: `<p>Hola <strong>${nombre} ${apellidos}</strong>, se ha creado una cuenta para ti.</p>`,
      attachments: [
        {
          filename: 'manual_de_usuario.mp4',
          path: 'C:\\Users\\andre\\OneDrive\\Escritorio\\AppKine\\videos\\manual_de_usuario.mp4',
          contentType: 'video/mp4',
        },
      ],
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
      } else {
        console.log('Correo enviado:', info.response);
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.',
      error: error.message,
    });
  }
});


// Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM usuarios');
    res.json({ success: true, usuarios: result.rows });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ success: false, message: 'Error al obtener usuarios' });
  }
});


// Endpoint para autenticar un usuario
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email y contraseña son requeridos.' });
  }

  try {
    const result = await db.query('SELECT * FROM usuarios WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

    const user = result.rows[0];

    // Comparar la contraseña ingresada con el hash almacenado
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos.' });
    }

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
      },
    });
  } catch (error) {
    console.error('Error en el servidor al autenticar usuario:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.', error: error.message });
  }
});

// Endpoint para validar el tipo de usuario
app.get('/api/usuario/tipo/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'ID de usuario es requerido.' });
  }

  try {
    const result = await db.query('SELECT tipo_usuario FROM usuarios WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado.' });
    }

    res.json({
      success: true,
      tipo_usuario: result.rows[0].tipo_usuario,
    });
  } catch (error) {
    console.error('Error en el servidor al obtener tipo de usuario:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.', error: error.message });
  }
});


app.get('/api/pacientes', async (req, res) => {
  const { terapeuta_id } = req.query;

  if (!terapeuta_id) {
    return res.status(400).json({ success: false, message: 'El ID del terapeuta es requerido' });
  }

  try {
    console.log(`Obteniendo lista de pacientes para terapeuta_id: ${terapeuta_id}`);
    
    // Ajuste en la consulta para incluir campos específicos, incluido el RUT
    const result = await db.query(
      `SELECT id, rut, nombre, apellidos, email, patologia
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

    // Transformar URLs en cada ejercicio
    const ejercicios = result.rows.map(ejercicio => {
      if (ejercicio.video_url && ejercicio.video_url.includes('watch?v=')) {
        ejercicio.video_url = ejercicio.video_url.replace('watch?v=', 'embed/');
      }
      return ejercicio;
    });

    res.json({ success: true, ejercicios });
  } catch (error) {
    console.error('Error al obtener la lista de ejercicios:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});



// Importa moment-timezone
const moment = require('moment-timezone');

// Endpoint para asignar una sesión a un paciente
app.post('/api/asignar-sesion', async (req, res) => {
  const { paciente_id, terapeuta_id, fecha, descripcion, ejercicio_id } = req.body;

  if (!paciente_id || !terapeuta_id || !fecha || !descripcion || !ejercicio_id) {
    console.log('Campos faltantes en la solicitud de asignación de sesión');
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  try {
    console.log(`Asignando sesión al paciente ${paciente_id} por terapeuta ${terapeuta_id}`);

    // Ajustar la fecha a la zona horaria correcta
    const fechaConZonaHoraria = moment.tz(fecha, 'America/Santiago').format('YYYY-MM-DD HH:mm:ss');
    const fechaParaCorreo = moment.tz(fecha, 'America/Santiago').format('DD [de] MMMM [de] YYYY');

    // Insertar la sesión en la base de datos
    const result = await db.query(
      `INSERT INTO citas (paciente_id, terapeuta_id, fecha, descripcion, ejercicio_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [paciente_id, terapeuta_id, fechaConZonaHoraria, descripcion, ejercicio_id]
    );

    // Obtener información del paciente
    const pacienteQuery = await db.query(
      `SELECT nombre, apellidos, email FROM usuarios WHERE id = $1`,
      [paciente_id]
    );

    if (pacienteQuery.rows.length === 0) {
      console.error('Paciente no encontrado');
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const paciente = pacienteQuery.rows[0];

    // Configuración del correo
    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com', // Cambia por tu correo
      to: paciente.email,
      subject: 'Asignación de Sesión',
      text: `Hola ${paciente.nombre} ${paciente.apellidos},

Se te ha asignado una nueva sesión.

Fecha: ${fechaParaCorreo}
Descripción: ${descripcion}

Por favor, asegúrate de asistir a tiempo.

Saludos,
El equipo de soporte.`,
      html: `
        <h1>Asignación de Sesión</h1>
        <p>Hola <strong>${paciente.nombre} ${paciente.apellidos}</strong>,</p>
        <p>Se te ha asignado una nueva sesión con los siguientes detalles:</p>
        <ul>
          <li><strong>Fecha:</strong> ${fechaParaCorreo}</li>
          <li><strong>Descripción:</strong> ${descripcion}</li>
        </ul>
        <p>Por favor, asegúrate de asistir a tiempo.</p>
        <p>Saludos,<br>El equipo de soporte.</p>
      `,
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({
          success: false,
          message: 'Sesión asignada, pero no se pudo enviar el correo al paciente.',
        });
      }
      console.log('Correo enviado:', info.response);
    });

    // Responder al cliente
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

    const ejercicio = result.rows[0];
    // Transformar el formato de la URL de YouTube
    if (ejercicio.video_url && ejercicio.video_url.includes('watch?v=')) {
      ejercicio.video_url = ejercicio.video_url.replace('watch?v=', 'embed/');
    }

    res.json({ success: true, ejercicio });
  } catch (error) {
    console.error('Error al obtener el ejercicio:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});


// Endpoint para guardar una encuesta
app.post('/api/encuestas', async (req, res) => {
  const { paciente_id, ejercicio_id, dificultad, dolor, satisfaccion, comentario } = req.body;

  // Verificar que todos los campos requeridos estén presentes
  if (!paciente_id || !ejercicio_id || dificultad === undefined || dolor === undefined || satisfaccion === undefined) {
    console.log('Campos faltantes en la solicitud de encuesta');
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos (paciente_id, ejercicio_id, dificultad, dolor, satisfaccion).' });
  }

  try {
    console.log(`Guardando encuesta para paciente ${paciente_id}, ejercicio ${ejercicio_id}`);
    
    // Insertar la encuesta en la base de datos
    const result = await db.query(
      `INSERT INTO encuestas (paciente_id, ejercicio_id, fecha, dificultad, dolor, satisfaccion, comentario)
       VALUES ($1, $2, NOW(), $3, $4, $5, $6) RETURNING *`,
      [paciente_id, ejercicio_id, dificultad, dolor, satisfaccion, comentario]
    );

    res.json({ success: true, encuesta: result.rows[0] });
  } catch (error) {
    console.error('Error al guardar la encuesta:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para obtener datos estadísticos de encuestas
app.get('/api/encuestas-estadisticas', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        AVG(dificultad) AS promedio_dificultad,
        AVG(dolor) AS promedio_dolor,
        AVG(satisfaccion) AS promedio_satisfaccion,
        COUNT(*) AS total_encuestas
      FROM encuestas
    `);

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error al obtener estadísticas de encuestas:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

app.get('/api/encuestas-por-patologia', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.patologia, 
             AVG(e.dificultad) AS promedio_dificultad,
             AVG(e.dolor) AS promedio_dolor,
             AVG(e.satisfaccion) AS promedio_satisfaccion,
             COUNT(e.id) AS total_encuestas
      FROM encuestas e
      INNER JOIN usuarios u ON e.paciente_id = u.id
      GROUP BY u.patologia
      ORDER BY u.patologia
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener estadísticas por patología:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

app.delete('/api/usuarios/:id', async (req, res) => {
  const usuarioId = Number(req.params.id);

  // Validar que el usuarioId sea un número entero positivo
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no proporcionado o inválido.',
    });
  }

  try {
    // Consulta para eliminar el usuario
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *;';
    const result = await db.query(query, [usuarioId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario eliminado con éxito.',
      usuario: result.rows[0], // Retorna el usuario eliminado
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.',
      error: error.message,
    });
  }
});

app.put('/api/usuarios/:id', async (req, res) => {
  const usuarioId = Number(req.params.id);

  // Validar que el usuarioId sea un número entero positivo
  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no proporcionado o inválido.',
    });
  }

  const {
    nombre,
    email,
    telefono,
    direccion,
    patologia,
    especialidad,
  } = req.body;

  // Validar que se proporcionen los campos requeridos
  if (!nombre || !email) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios (nombre, email).',
    });
  }

  try {
    const query = `
      UPDATE usuarios
      SET
        nombre = $1,
        email = $2,
        telefono = $3,
        direccion = $4,
        patologia = $5,
        especialidad = $6
      WHERE id = $7
      RETURNING *;
    `;

    const values = [nombre, email, telefono || null, direccion || null, patologia || null, especialidad || null, usuarioId];

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      usuario: result.rows[0], // Retorna el usuario actualizado
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.',
      error: error.message,
    });
  }
});

app.get('/api/pacientes/:terapeuta_id', async (req, res) => {
  const terapeutaId = Number(req.params.terapeuta_id);

  if (!Number.isInteger(terapeutaId) || terapeutaId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID del terapeuta no proporcionado o inválido.',
    });
  }

  try {
    const result = await db.query(
      `SELECT 
        id, 
        nombre, 
        apellidos, 
        email, 
        telefono, 
        direccion, 
        patologia, 
        fecha_nacimiento, 
        rut 
      FROM usuarios
      WHERE terapeuta_id = $1 AND tipo_usuario = 'paciente'`,
      [terapeutaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron pacientes asociados a este terapeuta.',
      });
    }

    res.status(200).json({
      success: true,
      pacientes: result.rows, // Devolver todos los campos necesarios
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.',
      error: error.message,
    });
  }
});


app.put('/api/usuarios/:id', async (req, res) => {
  const usuarioId = Number(req.params.id);

  if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de usuario no proporcionado o inválido.',
    });
  }

  const {
    nombre,
    apellidos,
    email,
    telefono,
    direccion,
    patologia,
    especialidad,
    rut,
  } = req.body;

  try {
    const query = `
      UPDATE usuarios
      SET
        nombre = $1,
        apellidos = $2,
        email = $3,
        telefono = $4,
        direccion = $5,
        patologia = $6,
        especialidad = $7,
        rut = $8
      WHERE id = $9
      RETURNING *;
    `;

    const values = [nombre, apellidos, email, telefono, direccion, patologia, especialidad, rut, usuarioId];

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      usuario: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error en el servidor.',
      error: error.message,
    });
  }
});


app.post('/api/ejercicios', async (req, res) => {
  const { nombre, descripcion, video_url } = req.body;

  if (!nombre || !descripcion || !video_url) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios.' });
  }

  try {
    const query = `
      INSERT INTO ejercicios (nombre, descripcion, video_url)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const values = [nombre, descripcion, video_url];
    const result = await db.query(query, values);

    res.status(201).json({ success: true, ejercicio: result.rows[0] });
  } catch (error) {
    console.error('Error al insertar ejercicio:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor.' });
  }
});



// Endpoint para modificar una sesión existente
app.put('/api/sesiones/:id', async (req, res) => {
  const sesionId = req.params.id;
  const { fecha, descripcion, ejercicio_id } = req.body;

  if (!sesionId || !fecha || !descripcion || !ejercicio_id) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos' });
  }

  try {
    console.log(`Modificando sesión con ID ${sesionId}`);

    // Ajustar la fecha a la zona horaria correcta
    const fechaConZonaHoraria = moment.tz(fecha, 'America/Santiago').format('YYYY-MM-DD HH:mm:ss');
    const fechaParaCorreo = moment.tz(fecha, 'America/Santiago').format('DD [de] MMMM [de] YYYY');

    // Actualizar la sesión en la base de datos
    const result = await db.query(
      `UPDATE citas 
       SET fecha = $1, descripcion = $2, ejercicio_id = $3
       WHERE id = $4 RETURNING *`,
      [fechaConZonaHoraria, descripcion, ejercicio_id, sesionId]
    );

    if (result.rows.length === 0) {
      console.error('Sesión no encontrada');
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    const sesion = result.rows[0];

    // Obtener información del paciente
    const pacienteQuery = await db.query(
      `SELECT nombre, apellidos, email FROM usuarios WHERE id = $1`,
      [sesion.paciente_id]
    );

    if (pacienteQuery.rows.length === 0) {
      console.error('Paciente no encontrado');
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const paciente = pacienteQuery.rows[0];

    // Configuración del correo
    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com',
      to: paciente.email,
      subject: 'Modificación de Sesión',
      text: `Hola ${paciente.nombre} ${paciente.apellidos},

Tu sesión ha sido modificada.

Nueva Fecha: ${fechaParaCorreo}
Nueva Descripción: ${descripcion}

Por favor, asegúrate de revisar estos cambios.

Saludos,
El equipo de soporte.`,
      html: `
        <h1>Modificación de Sesión</h1>
        <p>Hola <strong>${paciente.nombre} ${paciente.apellidos}</strong>,</p>
        <p>Tu sesión ha sido modificada con los siguientes detalles:</p>
        <ul>
          <li><strong>Nueva Fecha:</strong> ${fechaParaCorreo}</li>
          <li><strong>Nueva Descripción:</strong> ${descripcion}</li>
        </ul>
        <p>Por favor, asegúrate de revisar estos cambios.</p>
        <p>Saludos,<br>El equipo de soporte.</p>
      `,
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({
          success: false,
          message: 'Sesión modificada, pero no se pudo enviar el correo al paciente.',
        });
      }
      console.log('Correo enviado:', info.response);
    });

    // Responder al cliente
    res.json({ success: true, sesion });
  } catch (error) {
    console.error('Error al modificar la sesión:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});


// Endpoint para eliminar una sesión
app.delete('/api/sesiones/:id', async (req, res) => {
  const sesionId = req.params.id;

  if (!sesionId) {
    return res.status(400).json({ success: false, message: 'El ID de la sesión es requerido' });
  }

  try {
    console.log(`Eliminando sesión con ID ${sesionId}`);

    // Obtener información de la sesión antes de eliminar
    const sesionQuery = await db.query(
      `SELECT * FROM citas WHERE id = $1`,
      [sesionId]
    );

    if (sesionQuery.rows.length === 0) {
      console.error('Sesión no encontrada');
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    const sesion = sesionQuery.rows[0];

    // Obtener información del paciente
    const pacienteQuery = await db.query(
      `SELECT nombre, apellidos, email FROM usuarios WHERE id = $1`,
      [sesion.paciente_id]
    );

    if (pacienteQuery.rows.length === 0) {
      console.error('Paciente no encontrado');
      return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    }

    const paciente = pacienteQuery.rows[0];

    // Eliminar la sesión de la base de datos
    await db.query(`DELETE FROM citas WHERE id = $1`, [sesionId]);

    // Configuración del correo
    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com',
      to: paciente.email,
      subject: 'Cancelación de Sesión',
      text: `Hola ${paciente.nombre} ${paciente.apellidos},

Tu sesión programada para el día ${new Date(sesion.fecha).toLocaleDateString()} ha sido cancelada.

Si tienes dudas, no dudes en contactarnos.

Saludos,
El equipo de soporte.`,
      html: `
        <h1>Cancelación de Sesión</h1>
        <p>Hola <strong>${paciente.nombre} ${paciente.apellidos}</strong>,</p>
        <p>Tu sesión programada para el día ${new Date(sesion.fecha).toLocaleDateString()} ha sido cancelada.</p>
        <p>Si tienes dudas, no dudes en contactarnos.</p>
        <p>Saludos,<br>El equipo de soporte.</p>
      `,
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error al enviar el correo:', error);
        return res.status(500).json({
          success: false,
          message: 'Sesión cancelada, pero no se pudo enviar el correo al paciente.',
        });
      }
      console.log('Correo enviado:', info.response);
    });

    // Responder al cliente
    res.json({ success: true, message: 'Sesión eliminada exitosamente' });
  } catch (error) {
    console.error('Error al eliminar la sesión:', error);
    res.status(500).json({ success: false, message: 'Error en el servidor', error: error.message });
  }
});

// Endpoint para obtener sesiones por terapeuta
app.get('/api/sesiones', async (req, res) => {
  const { terapeuta_id } = req.query;

  if (!terapeuta_id) {
    return res.status(400).json({ success: false, message: 'El ID del terapeuta es requerido' });
  }

  try {
    console.log(`Obteniendo sesiones para terapeuta_id: ${terapeuta_id}`);

    // Consulta para obtener las sesiones
    const result = await db.query(
      `SELECT c.id, c.paciente_id, c.terapeuta_id, c.fecha, c.descripcion, c.ejercicio_id, 
              u.nombre AS paciente_nombre, u.apellidos AS paciente_apellidos, e.nombre AS ejercicio_nombre
       FROM citas c
       JOIN usuarios u ON c.paciente_id = u.id
       JOIN ejercicios e ON c.ejercicio_id = e.id
       WHERE c.terapeuta_id = $1`,
      [terapeuta_id]
    );

    res.json({ success: true, sesiones: result.rows });
  } catch (error) {
    console.error('Error al obtener las sesiones:', error);
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
