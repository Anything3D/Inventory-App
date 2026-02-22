import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, Category, Item, ColumnDef, BASE_COLUMNS, parseColumnDefs } from '../api';
import { Plus, Search, Trash2, Edit2, Package, Settings, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActions } from '../context/ActionContext';
import { refreshEvents } from '../components/inventory/ItemModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseSpecs(specs: any): Record<string, any> {
    if (!specs) return {};
    if (typeof specs === 'string') { try { return JSON.parse(specs); } catch { return {}; } }
    return specs;
}

function isHexColor(val: any): val is string {
    return typeof val === 'string' && /^#[0-9A-Fa-f]{3,6}$/.test(val);
}

function getNumberColor(val: number, col: ColumnDef): string {
    if (val === 0) return '#ef4444';   // no stock → always red
    const { min, max } = col;
    if (min !== undefined && val <= min) return '#ef4444';
    if (max !== undefined && val >= max) return '#22c55e';
    if (min !== undefined && max !== undefined) return '#f59e0b';
    if (max !== undefined && val < max) return '#f59e0b';
    return '#94a3b8';
}

// ─── Cell Renderers ───────────────────────────────────────────────────────────

const ColorCell = ({ value }: { value: string }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
            width: 28, height: 28, borderRadius: '50%',
            backgroundColor: value,
            border: '2px solid rgba(255,255,255,0.15)',
            flexShrink: 0,
            boxShadow: `0 2px 8px ${value}50`,
        }} />
        <span style={{ color: '#64748b', fontSize: '0.72rem', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
            {value.toUpperCase()}
        </span>
    </div>
);

const NumberCell = ({ value, col }: { value: number; col: ColumnDef }) => (
    <span style={{ color: getNumberColor(value, col), fontWeight: 700, fontSize: '0.9rem' }}>
        {value}
        {col.min !== undefined && col.max !== undefined && (
            <span style={{ color: '#334155', fontSize: '0.7rem', marginLeft: 4, fontWeight: 400 }}>/{col.max}</span>
        )}
    </span>
);

const CheckCell = ({ value }: { value: any }) => (
    value ? <span style={{ color: '#22c55e' }}>✓</span> : <span style={{ color: '#334155' }}>—</span>
);

// ─── Get cell value ───────────────────────────────────────────────────────────

function getCellValue(item: Item, col: ColumnDef): any {
    if (col.isBase) {
        switch (col.key) {
            case 'name': return item.name;
            case 'quantity': return item.quantity;
            case 'unit': return item.unit;
            case 'location': return item.location;
            case 'description': return item.description;
        }
    }
    return parseSpecs(item.specs)[col.key];
}

// ─── Render cell ──────────────────────────────────────────────────────────────

function renderCell(item: Item, col: ColumnDef) {
    const val = getCellValue(item, col);

    if (col.key === 'name') return <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{val || '—'}</span>;

    if (col.key === 'location' && val) {
        return (
            <span style={{ background: 'rgba(99,102,241,0.12)', color: '#a5b4fc', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 500 }}>
                {val}
            </span>
        );
    }

    if (col.type === 'color') {
        return isHexColor(val) ? <ColorCell value={val} /> : <span style={{ color: '#334155' }}>—</span>;
    }

    if (col.type === 'number') {
        const num = Number(val);
        if (isNaN(num) || val === undefined || val === null || val === '') return <span style={{ color: '#334155' }}>—</span>;
        return <NumberCell value={num} col={col} />;
    }

    if (col.type === 'checkbox') return <CheckCell value={val} />;

    const str = String(val ?? '').trim();
    if (!str) return <span style={{ color: '#334155' }}>—</span>;
    return <span style={{ color: col.key === 'description' ? '#475569' : '#94a3b8', fontSize: '0.875rem' }}>{str}</span>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

const Inventory = () => {
    const { category: categoryRoute } = useParams();
    const navigate = useNavigate();
    const { openAddModal, openEditModal } = useActions();
    const [items, setItems] = useState<Item[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    // Inline delete confirmation — avoids window.confirm() which steals Electron focus
    const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const allCategories = await api.getCategories();
            setCategories(allCategories);
            const matched = allCategories.find(c => c.type === categoryRoute || c.name.toLowerCase() === categoryRoute);
            const categoryId = (categoryRoute !== 'all' && matched) ? matched.id : undefined;
            setItems(await api.getItems(categoryId));
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, [categoryRoute]);
    useEffect(() => {
        const handle = () => loadData();
        refreshEvents.addEventListener('refresh', handle);
        return () => refreshEvents.removeEventListener('refresh', handle);
    }, [categoryRoute]);

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(search.toLowerCase()))
    );

    const confirmDelete = async (id: number) => {
        try { await api.deleteItem(id); setPendingDeleteId(null); loadData(); }
        catch (err: any) { console.error(err); }
    };

    const getCurrentCategoryId = () => {
        if (categoryRoute !== 'all') {
            return categories.find(c => c.type === categoryRoute || c.name.toLowerCase() === categoryRoute)?.id || 0;
        }
        return 0;
    };

    const currentCategory = categories.find(c => c.type === categoryRoute || c.name.toLowerCase() === categoryRoute);

    const allColumnDefs: ColumnDef[] = (() => {
        if (!currentCategory) return BASE_COLUMNS;
        const specCols = parseColumnDefs(currentCategory.template_fields);
        const hasBase = specCols.some(c => c.isBase);
        if (hasBase) return specCols.filter(c => !c.hidden);
        return [...BASE_COLUMNS, ...specCols].filter(c => !c.hidden);
    })();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h2 style={{ color: '#f1f5f9', fontSize: '1.5rem', fontWeight: 800, textTransform: 'capitalize', letterSpacing: '-0.02em' }}>
                        {categoryRoute === 'all' ? 'All Inventory' : categoryRoute}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>
                        {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569', pointerEvents: 'none' }} />
                        <input
                            type="text" placeholder="Search..."
                            value={search} onChange={e => setSearch(e.target.value)}
                            style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#f1f5f9', caretColor: '#f1f5f9', padding: '8px 12px 8px 32px', fontSize: '0.85rem', width: 200, outline: 'none' }}
                        />
                    </div>

                    <button
                        onClick={() => navigate('/settings')}
                        title="Manage columns in Settings"
                        style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '8px', cursor: 'pointer', color: '#475569', display: 'flex' }}
                    >
                        <Settings size={16} />
                    </button>

                    <button
                        onClick={() => openAddModal(getCurrentCategoryId())}
                        style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '8px 16px', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}
                    >
                        <Plus size={15} /> Add Item
                    </button>
                </div>
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            {loading ? (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </div>
            ) : filteredItems.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#334155' }}>
                    <Package size={48} style={{ opacity: 0.3 }} />
                    <p style={{ fontSize: '0.9rem', color: '#475569' }}>No items found{search ? ` for "${search}"` : ''}</p>
                    {!search && (
                        <button onClick={() => openAddModal(getCurrentCategoryId())} style={{ color: '#6366f1', fontSize: '0.85rem', background: 'none', border: 'none', cursor: 'pointer' }}>
                            + Add your first item
                        </button>
                    )}
                </div>
            ) : (
                <div className="glass-panel" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        <table className="inv-table">
                            <thead>
                                <tr>
                                    {allColumnDefs.map(col => (<th key={col.key}>{col.label}</th>))}
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence>
                                    {filteredItems.map((item, i) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.12, delay: Math.min(i * 0.02, 0.3) }}
                                            className="group"
                                            style={{ background: pendingDeleteId === item.id ? 'rgba(239,68,68,0.06)' : undefined }}
                                        >
                                            {allColumnDefs.map(col => (
                                                <td key={col.key}>{renderCell(item, col)}</td>
                                            ))}
                                            <td style={{ textAlign: 'right' }}>
                                                {pendingDeleteId === item.id ? (
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, alignItems: 'center' }}>
                                                        <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>Delete?</span>
                                                        <button
                                                            onClick={() => confirmDelete(item.id!)}
                                                            style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}
                                                        >
                                                            <Check size={12} /> Yes
                                                        </button>
                                                        <button
                                                            onClick={() => setPendingDeleteId(null)}
                                                            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                                        >
                                                            <X size={12} /> No
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        style={{ display: 'flex', justifyContent: 'flex-end', gap: 4, opacity: 0, transition: 'opacity 0.15s' }}
                                                        className="group-hover:opacity-100"
                                                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                                    >
                                                        <button onClick={() => openEditModal(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: '4px 6px' }} title="Edit"><Edit2 size={15} /></button>
                                                        <button onClick={() => setPendingDeleteId(item.id!)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px 6px' }} title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', color: '#334155', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                        <span>
                            {filteredItems.length} items ·{' '}
                            <button onClick={() => navigate('/settings')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontSize: '0.75rem', padding: 0 }}>
                                Manage columns
                            </button>
                        </span>
                        {search && (
                            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: '0.75rem' }}>
                                Clear search
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inventory;
