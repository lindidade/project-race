const { Pool } = require('pg');
require('dotenv').config(); // Detta gör att koden kan läsa från din .env-fil

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD, // Hämtar lösenordet säkert!
    port: process.env.DB_PORT,
});

pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('Kunde inte ansluta till databasen:', err);
    } else {
        console.log('Anslutning till PostgreSQL lyckades (via miljövariabler)!');
    }
});

module.exports = pool;