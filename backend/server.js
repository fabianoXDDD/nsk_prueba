
// Punto 1: Gestión de variables de entorno
// dotenv al inicio para usar PORT y SESSION SECRET dsde .env

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./db');

const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();
// Ejecutar el script de la base al levantar el servidor
const sql = fs.readFileSync(path.join(__dirname, '..', 'bd', 'bd.sql'), 'utf8');
pool.query(sql)
  .then(() => console.log('Base de datos lista'))
  .catch(err => console.error('Error al ejecutar bd.sql:', err.message));

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));
// Configurar la sesión con la clave secreta super segura y opciones de seguridad
app.use(session({
    secret: process.env.SESSION_SECRET || 'clave_secreta_super_segura',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true, // Protege la cookie contra ataques XSS
        secure: false,  
        maxAge: 1000 * 60 * 60 // Se mantiene 1 hora la sesión
    }
}));

// Arreglo para almacenar usuarios
const users = [];

// Punto 2: Registro e inicio de sesión

// Endpoint POST /api/auth/register
// Recibe email y contraseña
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Email y contraseña requeridos' });
        }

        // Verificar si ya existe en Supabase
        const userCheck = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ status: 'fail', message: 'El usuario ya está registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Insertar en la tabla usuarios de Supabase
        const result = await pool.query(
            'INSERT INTO usuarios (email, password_hash, rol_id) VALUES ($1, $2, $3) RETURNING id, email',
            [email, hashedPassword, 1] // rol_id por defecto o el que corresponda
        );

        const newUser = result.rows[0];
        return res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            user: newUser
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno en el servidor' });
    }
});
// Endpoint POST /api/auth/login
// Ver si los datos son correctos o no
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ status: 'fail', message: 'Email y contraseña requeridos' });
        }

        // Buscar el usuario en Supabase
        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'fail', message: 'Credenciales inválidas' });
        }

        req.session.userId = user.id;
        return res.json({
            status: 'success',
            message: 'Inicio de sesión exitoso',
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: 'error', message: 'Error interno en el servidor' });
    }
});

// Punto 3: Cierre de sesión y recurso protegido

// Middleware de Autorización
function authMiddleware(req, res, next) {
    if (req.session && req.session.userId) {
        return next(); // Usuario autenticado
    }
    return res.status(401).json({
        status: 'fail',
        message: 'Message: acceso no autorizado'
    });
}

// Endpoint protegido GET /api/perfil
app.get('/api/perfil', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email FROM usuarios WHERE id = $1', [req.session.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });
        }

        return res.json({
            status: 'success',
            user: result.rows[0]
        });
    } catch (error) {
        return res.status(500).json({ status: 'error', message: 'Error al obtener perfil' });
    }
});
// Endpoint POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ status: 'error', message: 'No se pudo cerrar la sesión' });
        }
        res.clearCookie('connect.sid'); // Limpia la cookie de sesión
        return res.json({ status: 'success', message: 'Sesión cerrada exitosamente' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
