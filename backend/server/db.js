// server/db.js
const Database = require('better-sqlite3');
const path = require('path');

// DB file inside backend folder
const dbPath = path.join(__dirname, 'staynest.db');
const db = new Database(dbPath);

// Initialize tables if they don't exist
const init = () => {
  // admin table - only one row expected
  db.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);

  // hotels table
  db.exec(`
    CREATE TABLE IF NOT EXISTS hotels (
      id TEXT PRIMARY KEY,
      name TEXT,
      city TEXT,
      state TEXT,
      location TEXT,
      rating REAL,
      propertyType TEXT,
      startingPrice INTEGER,
      image TEXT,
      shortDescription TEXT,
      description TEXT,
      amenities TEXT -- JSON stringified array
    );
  `);

  // rooms table (many-to-one with hotels)
  db.exec(`
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      hotel_id TEXT,
      name TEXT,
      description TEXT,
      image TEXT,
      price INTEGER,
      capacity INTEGER,
      size TEXT,
      amenities TEXT,
      FOREIGN KEY (hotel_id) REFERENCES hotels(id) ON DELETE CASCADE
    );
  `);
};

init();

module.exports = {
  get: (sql, params) => db.prepare(sql).get(params),
  all: (sql, params) => db.prepare(sql).all(params),
  run: (sql, params) => db.prepare(sql).run(params),
};
