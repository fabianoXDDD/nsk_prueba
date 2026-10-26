
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
  .then(() => console.log('✅ Base de datos lista'))
  .catch(err => console.error('Error al ejecutar bd.sql:', err.message));

const PORT = process.env.PORT || 3000;

app.use(express.json());

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

        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ status: 'fail', message: 'El usuario ya está registrado' });
        }

        // Cifrado asíncrono de la contraseña 
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: Date.now().toString(),
            email,
            password: hashedPassword
        };

        users.push(newUser);

        return res.status(201).json({
            status: 'success',
            message: 'Usuario registrado exitosamente',
            user: { id: newUser.id, email: newUser.email }
        });
    } catch (error) {
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

        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ status: 'fail', message: 'Algo está inválido' });
        }

        // Comparar contraseñas mediante bcrypt.compare()
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'fail', message: 'Algo está inválido' });
        }

        // Crear req.session.userId si todo está bien
        req.session.userId = user.id;

        return res.json({
            status: 'success',
            message: 'Inicio de sesión exitoso',
            user: { id: user.id, email: user.email }
        });
    } catch (error) {
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
app.get('/api/perfil', authMiddleware, (req, res) => {
    const user = users.find(u => u.id === req.session.userId);

    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'Usuario no encontrado' });
    }

    // Se devuelven los datos sin la contraseña
    return res.json({
        status: 'success',
        user: { id: user.id, email: user.email }
    });
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
