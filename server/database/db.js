const { Pool } = require('pg');

const isLocal = !process.env.PGHOST || process.env.PGHOST === 'localhost';

const dbConfig = {
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'chessbase',
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT || 5432,
  //Render
  ssl: isLocal ? false : { rejectUnauthorized: false }
};

console.log('Configuracion de DB:', {
  user: dbConfig.user,
  host: dbConfig.host,
  database: dbConfig.database,
  port: dbConfig.port,
  ssl: !!dbConfig.ssl // Muestra true si SSL está activado
});

const pool = new Pool(dbConfig);

// test the initial connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err);
    return;
  } else {
    console.log('Conexión exitosa a PostgreSQL');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
}
