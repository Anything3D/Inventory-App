import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const DatabaseConstructor = require('better-sqlite3');
import type { Database } from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

let db: Database;

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export function initDatabase(logger: (msg: string) => void = console.log) {
  const userDataPath = app.getPath('userData');
  logger(`UserData Path: ${userDataPath}`);

  // Ensure userData directory exists
  if (!fs.existsSync(userDataPath)) {
    logger('Creating userData directory...');
    fs.mkdirSync(userDataPath, { recursive: true });
  }

  const dbPath = process.env.NODE_ENV === 'development'
    ? './inventory.db'
    : path.join(userDataPath, 'inventory.db');

  logger(`Initializing database at: ${dbPath}`);

  try {
    logger('Instantiating Database class...');
    db = new DatabaseConstructor(dbPath);
    logger('Database instantiated. Setting PRAGMA...');
    db.pragma('journal_mode = WAL');

    logger('Running migrations...');
    runMigrations(logger);
    logger('Migrations complete.');
  } catch (error) {
    logger(`Failed to initialize database: ${error}`);
    throw error;
  }
}

function runMigrations(logger: (msg: string) => void) {
  const schema = `
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL, 
      template_fields TEXT
    );

    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      quantity REAL DEFAULT 0,
      unit TEXT, 
      location TEXT,
      image_path TEXT,
      specs TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER,
      action TEXT NOT NULL, 
      quantity_change REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (item_id) REFERENCES items(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `;

  getDb().exec(schema);
  seedCategories();
}

function seedCategories() {
  const stmt = getDb().prepare('SELECT count(*) as count FROM categories');
  const result = stmt.get() as { count: number };

  if (result.count === 0) {
    console.log('Seeding default categories...');
    const insert = getDb().prepare('INSERT INTO categories (name, type, template_fields) VALUES (@name, @type, @template_fields)');

    insert.run({
      name: '3D Printing Filaments',
      type: 'filament',
      template_fields: JSON.stringify([
        { key: 'material', label: 'Material', type: 'text' },
        { key: 'brand', label: 'Brand', type: 'text' },
        { key: 'color', label: 'Color', type: 'color' },
        { key: 'spool_weight_total', label: 'Spool Weight Total', type: 'number', min: 0, max: 1000 },
        { key: 'spool_weight_empty', label: 'Spool Weight Empty', type: 'number', min: 0, max: 500 },
      ])
    });

    insert.run({
      name: 'Electronics',
      type: 'electronics',
      template_fields: JSON.stringify([
        { key: 'microcontroller_type', label: 'MCU Type', type: 'text' },
        { key: 'voltage', label: 'Voltage', type: 'number', min: 0, max: 24 },
        { key: 'pins', label: 'Pins', type: 'number', min: 0, max: 100 },
      ])
    });

    insert.run({
      name: 'Hardware',
      type: 'hardware',
      template_fields: JSON.stringify([
        { key: 'thread_size', label: 'Thread Size', type: 'text' },
        { key: 'length', label: 'Length', type: 'text' },
        { key: 'material', label: 'Material', type: 'text' },
        { key: 'head_type', label: 'Head Type', type: 'text' },
      ])
    });

    insert.run({
      name: 'Automotive',
      type: 'automotive',
      template_fields: JSON.stringify([
        { key: 'vehicle_model', label: 'Vehicle Model', type: 'text' },
        { key: 'part_number', label: 'Part Number', type: 'text' },
      ])
    });
  }
}

// DAL Methods
export const getCategories = () => getDb().prepare('SELECT * FROM categories').all();

export const getItems = (categoryId?: number) => {
  if (categoryId) return getDb().prepare('SELECT * FROM items WHERE category_id = ? ORDER BY name ASC').all(categoryId);
  return getDb().prepare('SELECT * FROM items ORDER BY name ASC').all();
};

export const addItem = (item: any) => {
  const specs = typeof item.specs === 'object' ? JSON.stringify(item.specs) : item.specs;

  const stmt = getDb().prepare(`
    INSERT INTO items (category_id, name, description, quantity, unit, location, image_path, specs)
    VALUES (@category_id, @name, @description, @quantity, @unit, @location, @image_path, @specs)
  `);

  return stmt.run({
    category_id: item.category_id,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity || 0,
    unit: item.unit || null,
    location: item.location || null,
    image_path: item.image_path || null,
    specs
  });
};

export const updateItem = (id: number, item: any) => {
  const specs = typeof item.specs === 'object' ? JSON.stringify(item.specs) : item.specs;
  const stmt = getDb().prepare(`
        UPDATE items SET 
        name=@name, description=@description, quantity=@quantity, unit=@unit, 
        location=@location, image_path=@image_path, specs=@specs, updated_at=CURRENT_TIMESTAMP
        WHERE id=@id
    `);
  return stmt.run({
    id,
    name: item.name,
    description: item.description || null,
    quantity: item.quantity || 0,
    unit: item.unit || null,
    location: item.location || null,
    image_path: item.image_path || null,
    specs
  });
}

export const deleteItem = (id: number) => getDb().prepare('DELETE FROM items WHERE id = ?').run(id);

export const updateCategory = (id: number, category: any) => {
  const template_fields = typeof category.template_fields === 'object' ? JSON.stringify(category.template_fields) : category.template_fields;
  return getDb().prepare('UPDATE categories SET name = @name, template_fields = @template_fields WHERE id = @id').run({
    id,
    name: category.name,
    template_fields
  });
};

export const addCategory = (category: any) => {
  const template_fields = JSON.stringify(category.template_fields ?? []);
  return getDb().prepare('INSERT INTO categories (name, type, template_fields) VALUES (@name, @type, @template_fields)').run({
    name: category.name,
    type: category.type || 'general',
    template_fields,
  });
};

export const deleteCategory = (id: number) => {
  // Cascade: remove all items under this category first
  getDb().prepare('DELETE FROM items WHERE category_id = ?').run(id);
  return getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
};

export const getDashboardStats = () => {
  const totalItems = getDb().prepare('SELECT COUNT(*) as count FROM items').get() as { count: number };
  const totalValue = 0; // pending price logic
  const lowStock = getDb().prepare('SELECT COUNT(*) as count FROM items WHERE quantity < 5').get() as { count: number };
  // Recent activity
  const recentActivity = getDb().prepare(`
      SELECT al.*, i.name as item_name 
      FROM activity_log al 
      LEFT JOIN items i ON al.item_id = i.id 
      ORDER BY al.timestamp DESC LIMIT 5
    `).all();

  return {
    totalItems: totalItems.count,
    totalValue,
    lowStock: lowStock.count,
    recentActivity
  };
}
