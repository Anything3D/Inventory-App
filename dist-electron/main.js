import { app as l, dialog as d, BrowserWindow as u, ipcMain as _ } from "electron";
import { createRequire as I } from "module";
import f from "path";
import E from "fs";
import { createRequire as S } from "node:module";
import { fileURLToPath as N } from "node:url";
import s from "node:path";
const O = I(import.meta.url), h = O("better-sqlite3");
let p;
function n() {
  if (!p)
    throw new Error("Database not initialized. Call initDatabase() first.");
  return p;
}
function A(e = console.log) {
  const t = l.getPath("userData");
  e(`UserData Path: ${t}`), E.existsSync(t) || (e("Creating userData directory..."), E.mkdirSync(t, { recursive: !0 }));
  const a = process.env.NODE_ENV === "development" ? "./inventory.db" : f.join(t, "inventory.db");
  e(`Initializing database at: ${a}`);
  try {
    e("Instantiating Database class..."), p = new h(a), e("Database instantiated. Setting PRAGMA..."), p.pragma("journal_mode = WAL"), e("Running migrations..."), b(e), e("Migrations complete.");
  } catch (i) {
    throw e(`Failed to initialize database: ${i}`), i;
  }
}
function b(e) {
  n().exec(`
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
  `), C();
}
function C() {
  if (n().prepare("SELECT count(*) as count FROM categories").get().count === 0) {
    console.log("Seeding default categories...");
    const a = n().prepare("INSERT INTO categories (name, type, template_fields) VALUES (@name, @type, @template_fields)");
    a.run({
      name: "3D Printing Filaments",
      type: "filament",
      template_fields: JSON.stringify([
        { key: "material", label: "Material", type: "text" },
        { key: "brand", label: "Brand", type: "text" },
        { key: "color", label: "Color", type: "color" },
        { key: "spool_weight_total", label: "Spool Weight Total", type: "number", min: 0, max: 1e3 },
        { key: "spool_weight_empty", label: "Spool Weight Empty", type: "number", min: 0, max: 500 }
      ])
    }), a.run({
      name: "Electronics",
      type: "electronics",
      template_fields: JSON.stringify([
        { key: "microcontroller_type", label: "MCU Type", type: "text" },
        { key: "voltage", label: "Voltage", type: "number", min: 0, max: 24 },
        { key: "pins", label: "Pins", type: "number", min: 0, max: 100 }
      ])
    }), a.run({
      name: "Hardware",
      type: "hardware",
      template_fields: JSON.stringify([
        { key: "thread_size", label: "Thread Size", type: "text" },
        { key: "length", label: "Length", type: "text" },
        { key: "material", label: "Material", type: "text" },
        { key: "head_type", label: "Head Type", type: "text" }
      ])
    }), a.run({
      name: "Automotive",
      type: "automotive",
      template_fields: JSON.stringify([
        { key: "vehicle_model", label: "Vehicle Model", type: "text" },
        { key: "part_number", label: "Part Number", type: "text" }
      ])
    });
  }
}
const L = () => n().prepare("SELECT * FROM categories").all(), M = (e) => e ? n().prepare("SELECT * FROM items WHERE category_id = ? ORDER BY name ASC").all(e) : n().prepare("SELECT * FROM items ORDER BY name ASC").all(), D = (e) => {
  const t = typeof e.specs == "object" ? JSON.stringify(e.specs) : e.specs;
  return n().prepare(`
    INSERT INTO items (category_id, name, description, quantity, unit, location, image_path, specs)
    VALUES (@category_id, @name, @description, @quantity, @unit, @location, @image_path, @specs)
  `).run({
    category_id: e.category_id,
    name: e.name,
    description: e.description || null,
    quantity: e.quantity || 0,
    unit: e.unit || null,
    location: e.location || null,
    image_path: e.image_path || null,
    specs: t
  });
}, P = (e, t) => {
  const a = typeof t.specs == "object" ? JSON.stringify(t.specs) : t.specs;
  return n().prepare(`
        UPDATE items SET 
        name=@name, description=@description, quantity=@quantity, unit=@unit, 
        location=@location, image_path=@image_path, specs=@specs, updated_at=CURRENT_TIMESTAMP
        WHERE id=@id
    `).run({
    id: e,
    name: t.name,
    description: t.description || null,
    quantity: t.quantity || 0,
    unit: t.unit || null,
    location: t.location || null,
    image_path: t.image_path || null,
    specs: a
  });
}, U = (e) => n().prepare("DELETE FROM items WHERE id = ?").run(e), v = (e, t) => {
  const a = typeof t.template_fields == "object" ? JSON.stringify(t.template_fields) : t.template_fields;
  return n().prepare("UPDATE categories SET name = @name, template_fields = @template_fields WHERE id = @id").run({
    id: e,
    name: t.name,
    template_fields: a
  });
}, F = (e) => {
  const t = JSON.stringify(e.template_fields ?? []);
  return n().prepare("INSERT INTO categories (name, type, template_fields) VALUES (@name, @type, @template_fields)").run({
    name: e.name,
    type: e.type || "general",
    template_fields: t
  });
}, w = (e) => (n().prepare("DELETE FROM items WHERE category_id = ?").run(e), n().prepare("DELETE FROM categories WHERE id = ?").run(e)), x = () => {
  const e = n().prepare("SELECT COUNT(*) as count FROM items").get(), t = 0, a = n().prepare("SELECT COUNT(*) as count FROM items WHERE quantity < 5").get(), i = n().prepare(`
      SELECT al.*, i.name as item_name 
      FROM activity_log al 
      LEFT JOIN items i ON al.item_id = i.id 
      ORDER BY al.timestamp DESC LIMIT 5
    `).all();
  return {
    totalItems: e.count,
    totalValue: t,
    lowStock: a.count,
    recentActivity: i
  };
};
S(import.meta.url);
const R = s.dirname(N(import.meta.url));
process.env.APP_ROOT = s.join(R, "..");
const m = process.env.VITE_DEV_SERVER_URL, W = s.join(process.env.APP_ROOT, "dist-electron"), y = s.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? s.join(process.env.APP_ROOT, "public") : y;
const T = s.join(l.getPath("documents"), "inventory-v2-crash.log");
function o(e, t = "INFO") {
  const i = `[${(/* @__PURE__ */ new Date()).toISOString()}] ${t}: ${e}
`;
  try {
    E.appendFileSync(T, i);
  } catch (c) {
    console.error("Failed to write to log file:", c);
  }
}
process.on("uncaughtException", (e) => {
  o(e.stack || e.message, "ERROR"), d.showErrorBox("Unexpected Error", `An unexpected error occurred:

${e.message}

Please check ${T} for details.`), process.exit(1);
});
process.on("unhandledRejection", (e) => {
  o(e.stack || e, "ERROR"), d.showErrorBox("Unhandled Promise Rejection", `An unhandled promise rejection occurred:

${e}

Please check ${T} for details.`), process.exit(1);
});
let r;
function g() {
  r = new u({
    icon: s.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: s.join(R, "preload.mjs")
    }
  }), r.webContents.on("did-finish-load", () => {
    r == null || r.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), m ? r.loadURL(m) : r.loadFile(s.join(y, "index.html"));
}
l.on("window-all-closed", () => {
  process.platform !== "darwin" && (l.quit(), r = null);
});
l.on("activate", () => {
  u.getAllWindows().length === 0 && g();
});
l.whenReady().then(async () => {
  try {
    o("App starting..."), A((t) => o(t, "INFO")), o("Database initialized.");
    const e = (t, a) => {
      _.handle(t, async (...i) => {
        try {
          return t.startsWith("get-") || o(`IPC Call: ${t}`, "INFO"), await a(...i);
        } catch (c) {
          throw o(`IPC Error [${t}]: ${c.message}`, "ERROR"), c;
        }
      });
    };
    e("get-categories", () => L()), e("get-items", (t, a) => M(a)), e("add-item", (t, a) => D(a)), e("update-item", (t, a, i) => P(a, i)), e("delete-item", (t, a) => U(a)), e("update-category", (t, a, i) => v(a, i)), e("add-category", (t, a) => F(a)), e("delete-category", (t, a) => w(a)), e("get-dashboard-stats", () => x()), g(), o("Main window created.");
  } catch (e) {
    o(e.stack || e.message, "ERROR"), d.showErrorBox("Startup Error", `Failed to start application:

${e.message}`), l.quit();
  }
});
export {
  W as MAIN_DIST,
  y as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
