CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
    CREATE TABLE IF NOT EXISTS roles ( ... );

);

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CREATE TABLE IF NOT EXISTS usuarios ( ... );
);

CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    dueno_id INTEGER REFERENCES usuarios(id), 
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(50) DEFAULT 'Pendiente', 
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP
    CREATE TABLE IF NOT EXISTS proyectos ( ... );
);

CREATE TABLE proyecto_equipo (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id),
    usuario_id INTEGER REFERENCES usuarios(id),
    es_coordinador BOOLEAN DEFAULT FALSE 
    CREATE TABLE IF NOT EXISTS proyecto_equipo ( ... );
);

CREATE TABLE ubicaciones (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id),
    nombre_espacio VARCHAR(100) NOT NULL, 
    tipo VARCHAR(50) 
    CREATE TABLE IF NOT EXISTS ubicaciones ( ... );
    
);

CREATE TABLE items_base (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id),
    codigo_barras VARCHAR(100) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    cantidad_esperada INTEGER NOT NULL DEFAULT 0
    CREATE TABLE IF NOT EXISTS items_base ( ... );
);

CREATE TABLE conteos (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id),
    empleado_id INTEGER REFERENCES usuarios(id),
    ubicacion_id INTEGER REFERENCES ubicaciones(id),
    codigo_barras VARCHAR(100) NOT NULL,
    cantidad_contada INTEGER NOT NULL,
    es_reconteo BOOLEAN DEFAULT FALSE, 
    fecha_conteo TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CREATE TABLE IF NOT EXISTS conteos ( ... );
);

CREATE TABLE actas_cierre (
    id SERIAL PRIMARY KEY,
    proyecto_id INTEGER REFERENCES proyectos(id) UNIQUE,
    coordinador_id INTEGER REFERENCES usuarios(id),
    firma_digital VARCHAR(255) NOT NULL, 
    aprobado_por_dueno BOOLEAN DEFAULT FALSE,
    observaciones TEXT,
    fecha_emision TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    CREATE TABLE IF NOT EXISTS actas_cierre ( ... );
);
