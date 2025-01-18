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
//revisar porque no se asigna el terapeuta_id con la creacion de un paciente
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

    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com',
      to: email,
      subject: 'Credenciales de Acceso',
      text: `
        Hola ${nombre} ${apellidos}, 
        Se ha creado una cuenta para ti.

        Tus credenciales de acceso son:
        - Email: ${email}
        - Contraseña: ${password}

        Atte. 
        Administración MaacKinesiología Talca
      `,
      html: `
        <h2>Hola <strong>${nombre} ${apellidos}</strong>,</h2>
        <p>Se ha creado una cuenta para ti.</p>
        <p>Tus credenciales de acceso son:</p>
        <ul>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Contraseña:</strong> ${password}</li>
        </ul>
        <p>Atte.<br><strong>Administración MaacKinesiología Talca</strong></p>
      `,
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


// Endpoint para asignar una sesión a un paciente(revisar el endpoint ya que no se esta haciendo la asignacion correctamente)
const moment = require('moment-timezone');


app.post('/api/asignar-sesion', async (req, res) => {
  const { paciente_id, terapeuta_id, fecha, descripcion, ejercicios } = req.body; 

  // Validación de campos requeridos
  if (typeof paciente_id !== 'number' || typeof terapeuta_id !== 'number' || !fecha || !descripcion || !Array.isArray(ejercicios) || ejercicios.length < 2) {
    console.log('⚠️ Campos faltantes o insuficientes en la solicitud de asignación de sesión');
    return res.status(400).json({ 
      success: false, 
      message: 'Todos los campos son requeridos y se deben asignar al menos 2 ejercicios.' 
    });
  }

  // Validar que los ejercicios sean números enteros
  const ejerciciosValidos = ejercicios.every(ejercicioId => Number.isInteger(ejercicioId));
  if (!ejerciciosValidos) {
    console.log('⚠️ Los ejercicios no son números enteros');
    return res.status(400).json({ 
      success: false, 
      message: 'Todos los ejercicios deben ser números enteros.' 
    });
  }

  try {
    console.log(`✅ Asignando sesión al paciente ${paciente_id} por terapeuta ${terapeuta_id}`);

    // Ajustar la fecha a la zona horaria correcta
    const fechaConZonaHoraria = moment.tz(fecha, 'America/Santiago').format('YYYY-MM-DD HH:mm:ss');
    const fechaParaCorreo = moment.tz(fecha, 'America/Santiago').format('DD [de] MMMM [de] YYYY');

    // Insertar la sesión en la tabla 'citas'
    const result = await db.query(
      `INSERT INTO citas (paciente_id, terapeuta_id, fecha, descripcion) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      [paciente_id, terapeuta_id, fechaConZonaHoraria, descripcion]
    );

    const citaId = result.rows[0].id;

    // Insertar los ejercicios de la sesión en la tabla 'citas_ejercicios'
    const values = ejercicios.map((_, index) => `($1, $${index + 2})`).join(', ');
    const queryParams = [citaId, ...ejercicios];

    await db.query(
      `INSERT INTO citas_ejercicios (cita_id, ejercicio_id) 
       VALUES ${values}`,
      queryParams
    );

    // Obtener información del paciente
    const pacienteQuery = await db.query(
      `SELECT nombre, apellidos, email FROM usuarios WHERE id = $1`,
      [paciente_id]
    );

    if (pacienteQuery.rows.length === 0) {
      console.error('⚠️ Paciente no encontrado');
      return res.status(404).json({ 
        success: false, 
        message: 'Paciente no encontrado' 
      });
    }

    const paciente = pacienteQuery.rows[0];

    // Obtener la información de los ejercicios
    const ejerciciosQuery = await db.query(
      `SELECT nombre FROM ejercicios WHERE id = ANY($1::int[])`, 
      [ejercicios]
    );

    const listaDeEjercicios = ejerciciosQuery.rows.map(ej => ej.nombre).join(', ');

    // Configuración del correo
    const mailOptions = {
      from: 'maackinesiologia.talca@gmail.com', 
      to: paciente.email,
      subject: 'Asignación de Sesión',
      text: `Hola ${paciente.nombre} ${paciente.apellidos},

Se te ha asignado una nueva sesión con los siguientes detalles:

Fecha: ${fechaParaCorreo}
Descripción: ${descripcion}
Videos Asignados: ${listaDeEjercicios}

Por favor, asegúrate de asistir a tiempo.

Saludos,
El equipo de soporte.
      `,
      html: `
        <h2>Asignación de Sesión</h2>
        <p>Hola <strong>${paciente.nombre} ${paciente.apellidos}</strong>,</p>
        <p>Se te ha asignado una nueva sesión con los siguientes detalles:</p>
        <ul>
          <li><strong>Fecha:</strong> ${fechaParaCorreo}</li>
          <li><strong>Descripción:</strong> ${descripcion}</li>
          <li><strong>Videos Asignados:</strong> ${listaDeEjercicios}</li>
        </ul>
        <p>Por favor, asegúrate de conectarte en las horas indicadas por tu terapeuta.</p>
        <p>Atte.<br>Administración MaacKinesiología Talca.</p>
      `
    };

    // Enviar correo
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Error al enviar el correo:', error);
        return res.status(500).json({
          success: false,
          message: 'Sesión asignada, pero no se pudo enviar el correo al paciente.',
        });
      }
      console.log('📧 Correo enviado:', info.response);
    });

    // Responder al cliente
    res.json({ 
      success: true, 
      message: 'Sesión asignada con éxito.', 
      sesion: { citaId, fecha: fechaParaCorreo, descripcion, ejercicios: listaDeEjercicios } 
    });

  } catch (error) {
    console.error('❌ Error al asignar la sesión:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en el servidor', 
      error: error.message 
    });
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
      `SELECT 
        c.id, 
        c.paciente_id, 
        c.fecha, 
        c.descripcion, 
        json_agg(json_build_object('id', e.id, 'nombre', e.nombre, 'video_url', e.video_url)) AS ejercicios
      FROM citas c
      LEFT JOIN citas_ejercicios ce ON c.id = ce.cita_id
      LEFT JOIN ejercicios e ON ce.ejercicio_id = e.id
      WHERE c.paciente_id = $1 
        AND EXTRACT(YEAR FROM c.fecha) = $2 
        AND EXTRACT(MONTH FROM c.fecha) = $3
      GROUP BY c.id
      ORDER BY c.fecha ASC`,
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
  const encuestas = req.body;
  console.log('Body recibido:', encuestas);

  // Validar que el arreglo no esté vacío
  if (!Array.isArray(encuestas) || encuestas.length === 0) {
    console.log('No se recibieron encuestas.');
    return res.status(400).json({
      success: false,
      message: 'Debe enviarse un arreglo de encuestas con datos válidos.',
    });
  }

  try {
    const resultados = [];

    // Insertar cada encuesta en la base de datos
    for (const encuesta of encuestas) {
      const { paciente_id, ejercicio_id, dificultad, dolor, satisfaccion, comentario } = encuesta;

      if (!paciente_id || !ejercicio_id || dificultad === undefined || dolor === undefined || satisfaccion === undefined) {
        console.log('Campos faltantes en la encuesta:', encuesta);
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos (paciente_id, ejercicio_id, dificultad, dolor, satisfaccion).',
        });
      }

      console.log(`Guardando encuesta para paciente ${paciente_id}, ejercicio ${ejercicio_id}`);

      const result = await db.query(
        `INSERT INTO encuestas (paciente_id, ejercicio_id, fecha, dificultad, dolor, satisfaccion, comentario)
         VALUES ($1, $2, NOW(), $3, $4, $5, $6) RETURNING *`,
        [paciente_id, ejercicio_id, dificultad, dolor, satisfaccion, comentario]
      );

      resultados.push(result.rows[0]);
    }

    res.json({ success: true, encuestas: resultados });
  } catch (error) {
    console.error('Error al guardar las encuestas:', error);
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
//agregar tambien el filtro por paciente
app.get('/api/encuestas-por-paciente', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id AS paciente_id,
             u.nombre AS nombre_paciente,
             u.rut AS rut_paciente,
             AVG(e.dificultad) AS promedio_dificultad,
             AVG(e.dolor) AS promedio_dolor,
             AVG(e.satisfaccion) AS promedio_satisfaccion,
             COUNT(e.id) AS total_encuestas
      FROM encuestas e
      INNER JOIN usuarios u ON e.paciente_id = u.id
      GROUP BY u.id, u.nombre, u.rut
      ORDER BY u.nombre
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error al obtener estadísticas por paciente:', error);
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

  console.log('🆔 ID recibido en la API:', usuarioId);
  console.log('📦 Cuerpo de la solicitud PUT recibido en la API:', req.body);

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
    fecha_nacimiento,
    rut,
    terapeuta_id, 
  } = req.body;

  if (!nombre || !email) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios (nombre, email).',
    });
  }

  try {
    // Armar la consulta de forma dinámica
    const fields = [
      { key: 'nombre', value: nombre },
      { key: 'apellidos', value: apellidos },
      { key: 'email', value: email },
      { key: 'telefono', value: telefono },
      { key: 'direccion', value: direccion },
      { key: 'patologia', value: patologia },
      { key: 'especialidad', value: especialidad },
      { key: 'fecha_nacimiento', value: fecha_nacimiento },
      { key: 'rut', value: rut },
    ];

    if (terapeuta_id !== undefined) {
      fields.push({ key: 'terapeuta_id', value: terapeuta_id });
    }

    const setClause = fields.map((field, index) => `${field.key} = $${index + 1}`).join(', ');

    const values = fields.map(field => field.value);
    values.push(usuarioId); // Agregar el ID del usuario al final de los valores

    const query = `
      UPDATE usuarios
      SET ${setClause}
      WHERE id = $${values.length}
      RETURNING *;
    `;

    console.log('📋 SQL Query:', query);
    console.log('📋 Valores para la consulta:', values);

    const result = await db.query(query, values);

    console.log('🔄 Resultado de la consulta:', result.rows);

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
    console.error('❌ Error al actualizar usuario:', error);
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
  const { fecha, descripcion, ejercicios } = req.body;

  // Validación de campos requeridos
  if (!sesionId || !fecha || !descripcion || !Array.isArray(ejercicios) || ejercicios.length === 0) {
    return res.status(400).json({ success: false, message: 'Todos los campos son requeridos, incluyendo al menos un ejercicio.' });
  }

  // Validar que los ejercicios sean números
  const ejerciciosInvalidos = ejercicios.filter(ej => isNaN(ej));
  if (ejerciciosInvalidos.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Algunos de los ejercicios proporcionados no son válidos. Se esperaban números enteros.',
      ejerciciosInvalidos 
    });
  }

  try {
    console.log(`Modificando sesión con ID ${sesionId}`);

    // Ajustar la fecha a la zona horaria correcta
    const fechaConZonaHoraria = moment.tz(fecha, 'America/Santiago').format('YYYY-MM-DD HH:mm:ss');
    const fechaParaCorreo = moment.tz(fecha, 'America/Santiago').format('DD [de] MMMM [de] YYYY');

    // Actualizar la sesión en la tabla 'citas'
    const result = await db.query(
      `UPDATE citas 
       SET fecha = $1, descripcion = $2
       WHERE id = $3 
       RETURNING *`,
      [fechaConZonaHoraria, descripcion, sesionId]
    );

    if (result.rows.length === 0) {
      console.error('❌ Sesión no encontrada');
      return res.status(404).json({ success: false, message: 'Sesión no encontrada' });
    }

    const sesion = result.rows[0];

    // 🧹 Eliminar los ejercicios anteriores de la tabla 'citas_ejercicios'
    await db.query(
      `DELETE FROM citas_ejercicios 
       WHERE cita_id = $1`,
      [sesionId]
    );

    // 🔄 Insertar los nuevos ejercicios en la tabla 'citas_ejercicios'
    const insertValues = ejercicios.map((ejercicioId, index) => `($1, $${index + 2})`).join(', ');
    const queryParams = [sesionId, ...ejercicios];

    await db.query(
      `INSERT INTO citas_ejercicios (cita_id, ejercicio_id) 
       VALUES ${insertValues}`,
      queryParams
    );

    console.log('✅ Ejercicios actualizados correctamente para la sesión', sesionId);

    // Obtener información del paciente
    const pacienteQuery = await db.query(
      `SELECT nombre, apellidos, email 
       FROM usuarios 
       WHERE id = $1`,
      [sesion.paciente_id]
    );

    if (pacienteQuery.rows.length === 0) {
      console.error('❌ Paciente no encontrado');
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
        console.error('❌ Error al enviar el correo:', error);
        return res.status(500).json({
          success: false,
          message: 'Sesión modificada, pero no se pudo enviar el correo al paciente.',
        });
      }
      console.log('📧 Correo enviado:', info.response);
    });

    // Responder al cliente con la sesión actualizada
    res.json({ success: true, sesion });
  } catch (error) {
    console.error('❌ Error al modificar la sesión:', error);
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

    // Consulta optimizada para obtener las sesiones
    const result = await db.query(
      `SELECT 
        c.id, 
        c.paciente_id, 
        c.terapeuta_id, 
        c.fecha, 
        c.descripcion, 
        u.nombre AS paciente_nombre, 
        u.apellidos AS paciente_apellidos,
        ARRAY_AGG(DISTINCT e.nombre) AS ejercicios
       FROM citas c
       JOIN usuarios u ON c.paciente_id = u.id
       LEFT JOIN citas_ejercicios ce ON c.id = ce.cita_id
       LEFT JOIN ejercicios e ON ce.ejercicio_id = e.id
       WHERE c.terapeuta_id = $1
       GROUP BY c.id, u.nombre, u.apellidos
       ORDER BY c.fecha DESC`,
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
  res.status(404).json({ success: false, message: 'ERROR 404 Not Found' });
});

// Iniciar el servidor
// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log("Servidor escuchando en http://0.0.0.0:${PORT}");
});
