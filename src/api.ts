// ─── Column Definition ────────────────────────────────────────────────────────

export interface ColumnDef {
    key: string;
    label: string;
    type: 'text' | 'number' | 'color' | 'checkbox';
    isBase?: boolean;   // built-in fields (name, quantity, unit, etc.) — not deletable
    min?: number;       // number type: value below this = red
    max?: number;       // number type: value above this = green  (between = yellow)
    hidden?: boolean;   // hide from table
}

// ─── Base columns (always present per section) ────────────────────────────────

export const BASE_COLUMNS: ColumnDef[] = [
    { key: 'name', label: 'Name', type: 'text', isBase: true },
    { key: 'quantity', label: 'Qty', type: 'number', isBase: true, min: 1, max: 10 },
    { key: 'unit', label: 'Unit', type: 'text', isBase: true },
    { key: 'location', label: 'Location', type: 'text', isBase: true },
    { key: 'description', label: 'Description', type: 'text', isBase: true },
];

// ─── Parse template_fields with backward compat ───────────────────────────────
// Old format: string[]  → ["material", "brand", "color"]
// New format: ColumnDef[] → [{ key, label, type, ... }]

export function parseColumnDefs(template_fields: string | null | undefined): ColumnDef[] {
    if (!template_fields) return [];
    try {
        const parsed = JSON.parse(template_fields);
        if (!Array.isArray(parsed)) return [];
        // Old format: first element is a plain string
        if (typeof parsed[0] === 'string') {
            return (parsed as string[]).map(key => ({
                key,
                label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
                type: /color|colour|hex/i.test(key) ? 'color' : 'text',
            }));
        }
        // New format: ColumnDef[]
        return parsed as ColumnDef[];
    } catch {
        return [];
    }
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
    id: number;
    name: string;
    type: string;  // e.g. 'filament', 'electronics', 'general', or any user-defined string
    template_fields: string; // JSON — ColumnDef[]
}

export interface Item {
    id?: number;
    category_id: number;
    name: string;
    description?: string;
    quantity: number;
    unit?: string;
    location?: string;
    image_path?: string;
    specs?: string | object;
    created_at?: string;
    updated_at?: string;
}

export interface DashboardStats {
    totalItems: number;
    totalValue: number;
    lowStock: number;
    recentActivity: any[];
}

// ─── API ──────────────────────────────────────────────────────────────────────

export const api = {
    getCategories: (): Promise<Category[]> => window.ipcRenderer.invoke('get-categories'),
    getItems: (categoryId?: number): Promise<Item[]> => window.ipcRenderer.invoke('get-items', categoryId),
    addItem: (item: Item): Promise<void> => window.ipcRenderer.invoke('add-item', item),
    updateItem: (id: number, item: Item): Promise<void> => window.ipcRenderer.invoke('update-item', id, item),
    deleteItem: (id: number): Promise<void> => window.ipcRenderer.invoke('delete-item', id),
    updateCategory: (id: number, category: Category): Promise<void> => window.ipcRenderer.invoke('update-category', id, category),
    addCategory: (category: Omit<Category, 'id'>): Promise<{ lastInsertRowid: number }> => window.ipcRenderer.invoke('add-category', category),
    deleteCategory: (id: number): Promise<void> => window.ipcRenderer.invoke('delete-category', id),
    getDashboardStats: (): Promise<DashboardStats> => window.ipcRenderer.invoke('get-dashboard-stats'),
};
