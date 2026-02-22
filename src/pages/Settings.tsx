import React, { useEffect, useState } from 'react';
import { api, Category, ColumnDef, BASE_COLUMNS, parseColumnDefs } from '../api';
import { Cloud, Shield, Layers, PlusCircle, Trash2, GripVertical, Save, Plus, Edit2, Check, X } from 'lucide-react';
import { categoryEvents } from '../components/layout/Sidebar';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    text: { label: 'Text', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    number: { label: 'Number', color: '#818cf8', bg: 'rgba(129,140,248,0.1)' },
    color: { label: 'Color', color: '#34d399', bg: 'rgba(52,211,153,0.1)' },
    checkbox: { label: 'Bool', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
};

// ─── Shared input style ───────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    color: '#f1f5f9',
    caretColor: '#f1f5f9',
    padding: '6px 10px',
    fontSize: '0.8rem',
    outline: 'none',
    width: '100%',
};

// ─── ColumnRow ────────────────────────────────────────────────────────────────

interface ColumnRowProps {
    col: ColumnDef;
    onChange: (updated: ColumnDef) => void;
    onDelete: () => void;
}

const ColumnRow = ({ col, onChange, onDelete }: ColumnRowProps) => {
    const tc = TYPE_CONFIG[col.type] || TYPE_CONFIG.text;
    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Drag handle + label */}
            <td style={{ padding: '10px 16px', width: 220 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <GripVertical size={13} style={{ color: '#334155', flexShrink: 0 }} />
                    <input
                        value={col.label}
                        onChange={e => onChange({ ...col, label: e.target.value })}
                        style={{ ...inputStyle, background: 'transparent', border: 'none', padding: '0', width: 160, fontWeight: col.isBase ? 600 : 400 }}
                        title="Edit label"
                    />
                </div>
            </td>

            {/* Key */}
            <td style={{ padding: '10px 12px', color: '#475569', fontSize: '0.75rem', fontFamily: 'monospace', width: 140 }}>
                {col.key}
            </td>

            {/* Type */}
            <td style={{ padding: '10px 12px', width: 120 }}>
                <select
                    value={col.type}
                    onChange={e => onChange({ ...col, type: e.target.value as ColumnDef['type'] })}
                    disabled={col.key === 'name'}
                    style={{
                        ...inputStyle, width: 'auto',
                        color: tc.color,
                        background: tc.bg,
                        border: `1px solid ${tc.color}40`,
                        fontWeight: 600,
                    }}
                >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="color">Color</option>
                    <option value="checkbox">Checkbox</option>
                </select>
            </td>

            {/* Min / Max (only for number) */}
            <td style={{ padding: '10px 12px', width: 200 }}>
                {col.type === 'number' && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <label style={{ color: '#ef4444', fontSize: '0.7rem', fontWeight: 700 }}>MIN</label>
                        <input
                            type="number"
                            value={col.min ?? ''}
                            onChange={e => onChange({ ...col, min: e.target.value === '' ? undefined : Number(e.target.value) })}
                            style={{ ...inputStyle, width: 60 }}
                            placeholder="0"
                        />
                        <label style={{ color: '#22c55e', fontSize: '0.7rem', fontWeight: 700 }}>MAX</label>
                        <input
                            type="number"
                            value={col.max ?? ''}
                            onChange={e => onChange({ ...col, max: e.target.value === '' ? undefined : Number(e.target.value) })}
                            style={{ ...inputStyle, width: 60 }}
                            placeholder="100"
                        />
                    </div>
                )}
                {col.type === 'color' && (
                    <span style={{ fontSize: '0.75rem', color: '#34d399' }}>Shows color swatch</span>
                )}
            </td>

            {/* Hidden toggle */}
            <td style={{ padding: '10px 12px', textAlign: 'center', width: 70 }}>
                <input
                    type="checkbox"
                    checked={!col.hidden}
                    onChange={e => onChange({ ...col, hidden: !e.target.checked })}
                    style={{ accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
                    title="Show column"
                />
            </td>

            {/* Delete — ALL columns deletable */}
            <td style={{ padding: '10px 12px', textAlign: 'right', width: 50 }}>
                <button
                    onClick={onDelete}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}
                    title="Delete column"
                >
                    <Trash2 size={14} />
                </button>
            </td>
        </tr>
    );
};

// ─── AddColumnDialog ──────────────────────────────────────────────────────────

interface AddColDialogProps { onAdd: (col: ColumnDef) => void; onClose: () => void; }

const AddColumnDialog = ({ onAdd, onClose }: AddColDialogProps) => {
    const [label, setLabel] = useState('');
    const [type, setType] = useState<ColumnDef['type']>('text');

    const handleAdd = () => {
        if (!label.trim()) return;
        const key = label.trim().toLowerCase().replace(/\s+/g, '_');
        onAdd({ key, label: label.trim(), type });
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, width: 380, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <h4 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Add New Column</h4>

                <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Column Label</label>
                <input
                    autoFocus
                    value={label}
                    onChange={e => setLabel(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. Color, Brand, Voltage..."
                    style={{ ...inputStyle, marginTop: 6, marginBottom: 14 }}
                />

                <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Column Type</label>
                <select
                    value={type}
                    onChange={e => setType(e.target.value as ColumnDef['type'])}
                    style={{ ...inputStyle, marginTop: 6, marginBottom: 20 }}
                >
                    <option value="text">Text — free input</option>
                    <option value="number">Number — with min/max thresholds</option>
                    <option value="color">Color — shows hex swatch</option>
                    <option value="checkbox">Checkbox — true/false</option>
                </select>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px 14px', fontSize: '0.85rem' }}>Cancel</button>
                    <button
                        onClick={handleAdd}
                        disabled={!label.trim()}
                        style={{ background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, opacity: label.trim() ? 1 : 0.4 }}
                    >
                        Add Column
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── AddSectionDialog ─────────────────────────────────────────────────────────

interface AddSectionDialogProps { onAdd: (name: string) => void; onClose: () => void; }

const AddSectionDialog = ({ onAdd, onClose }: AddSectionDialogProps) => {
    const [name, setName] = useState('');

    const handleAdd = () => {
        if (!name.trim()) return;
        onAdd(name.trim());
        onClose();
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <h4 style={{ color: '#f1f5f9', fontWeight: 700, marginBottom: 16, fontSize: '1rem' }}>Add New Section</h4>

                <label style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section Name</label>
                <input
                    autoFocus
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    placeholder="e.g. Tools, Consumables..."
                    style={{ ...inputStyle, marginTop: 6, marginBottom: 20 }}
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '8px 14px', fontSize: '0.85rem' }}>Cancel</button>
                    <button
                        onClick={handleAdd}
                        disabled={!name.trim()}
                        style={{ background: '#6366f1', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '8px 18px', fontSize: '0.85rem', fontWeight: 600, opacity: name.trim() ? 1 : 0.4 }}
                    >
                        Add Section
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── ColumnManagerSection ─────────────────────────────────────────────────────

const ColumnManagerSection = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeId, setActiveId] = useState<number | null>(null);
    const [columns, setColumns] = useState<ColumnDef[]>([]);
    const [showAddCol, setShowAddCol] = useState(false);
    const [showAddSection, setShowAddSection] = useState(false);
    const [saved, setSaved] = useState(false);
    const [dirty, setDirty] = useState(false);
    // Inline category rename
    const [renamingId, setRenamingId] = useState<number | null>(null);
    const [renameValue, setRenameValue] = useState('');
    // Inline category delete confirm
    const [pendingDeleteCatId, setPendingDeleteCatId] = useState<number | null>(null);

    const loadCategories = () => {
        api.getCategories().then(cats => {
            setCategories(cats);
            if (cats.length > 0 && activeId === null) setActiveId(cats[0].id);
        }).catch(console.error);
    };

    useEffect(() => { loadCategories(); }, []);

    useEffect(() => {
        if (activeId === null) return;
        const cat = categories.find(c => c.id === activeId);
        if (!cat) return;
        const parsed = parseColumnDefs(cat.template_fields);
        const hasBase = parsed.some(c => c.isBase);
        setColumns(hasBase ? parsed : [...BASE_COLUMNS, ...parsed]);
        setDirty(false);
    }, [activeId, categories]);

    const updateColumn = (index: number, updated: ColumnDef) => {
        setColumns(prev => prev.map((c, i) => i === index ? updated : c));
        setDirty(true);
    };

    const deleteColumn = (index: number) => {
        setColumns(prev => prev.filter((_, i) => i !== index));
        setDirty(true);
    };

    const addColumn = (col: ColumnDef) => {
        setColumns(prev => [...prev, col]);
        setDirty(true);
    };

    const handleSave = async () => {
        if (!activeId) return;
        const cat = categories.find(c => c.id === activeId);
        if (!cat) return;
        const catToSave: Category = { ...cat, template_fields: JSON.stringify(columns) };
        await api.updateCategory(activeId, catToSave);
        setCategories(prev => prev.map(c => c.id === activeId ? catToSave : c));
        categoryEvents.dispatchEvent(new Event('change'));
        setDirty(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleAddSection = async (name: string) => {
        const type = name.toLowerCase().replace(/\s+/g, '_');
        const result = await api.addCategory({ name, type, template_fields: JSON.stringify([...BASE_COLUMNS]) });
        const newId = (result as any).lastInsertRowid;
        await loadCategories();
        categoryEvents.dispatchEvent(new Event('change'));
        setActiveId(newId ?? null);
    };

    const handleRenameCategory = async (id: number, newName: string) => {
        const cat = categories.find(c => c.id === id);
        if (!cat) return;
        await api.updateCategory(id, { ...cat, name: newName });
        setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c));
        categoryEvents.dispatchEvent(new Event('change'));
        setRenamingId(null);
    };

    const handleDeleteCategory = async (id: number) => {
        await api.deleteCategory(id);
        const remaining = categories.filter(c => c.id !== id);
        setCategories(remaining);
        categoryEvents.dispatchEvent(new Event('change'));
        setPendingDeleteCatId(null);
        setActiveId(remaining.length > 0 ? remaining[0].id : null);
    };

    return (
        <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <Layers size={20} style={{ color: '#6366f1' }} />
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem' }}>Column Manager</h3>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', marginTop: 2 }}>Configure columns and sections for each inventory category</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={() => setShowAddCol(true)}
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, padding: '7px 14px', color: '#a5b4fc', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <PlusCircle size={14} /> Add Column
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!dirty}
                        style={{ background: dirty ? '#6366f1' : 'rgba(99,102,241,0.2)', border: 'none', borderRadius: 8, padding: '7px 14px', color: dirty ? '#fff' : '#4f46e5', cursor: dirty ? 'pointer' : 'default', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' }}
                    >
                        <Save size={14} /> {saved ? 'Saved!' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Category tabs */}
            <div style={{ display: 'flex', padding: '12px 24px 0', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(2,6,23,0.5)', flexWrap: 'wrap', alignItems: 'center' }}>
                {categories.map(cat => (
                    <div key={cat.id} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        {renamingId === cat.id ? (
                            /* Inline rename input */
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(99,102,241,0.15)', borderRadius: '8px 8px 0 0', padding: '4px 8px' }}>
                                <input
                                    autoFocus
                                    value={renameValue}
                                    onChange={e => setRenameValue(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleRenameCategory(cat.id, renameValue);
                                        if (e.key === 'Escape') setRenamingId(null);
                                    }}
                                    style={{ ...inputStyle, width: 120, background: 'transparent', border: 'none', padding: '2px 4px', fontSize: '0.8rem' }}
                                />
                                <button onClick={() => handleRenameCategory(cat.id, renameValue)} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', padding: 2 }}><Check size={12} /></button>
                                <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 2 }}><X size={12} /></button>
                            </div>
                        ) : pendingDeleteCatId === cat.id ? (
                            /* Inline delete confirm */
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(239,68,68,0.15)', borderRadius: '8px 8px 0 0', padding: '6px 10px' }}>
                                <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 600 }}>Delete "{cat.name}"?</span>
                                <button onClick={() => handleDeleteCategory(cat.id)} style={{ background: '#ef4444', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700 }}>Yes</button>
                                <button onClick={() => setPendingDeleteCatId(null)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px 6px', fontSize: '0.72rem' }}>No</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => { if (dirty && !confirm('Unsaved changes. Switch anyway?')) return; setActiveId(cat.id); }}
                                style={{ background: activeId === cat.id ? '#6366f1' : 'none', border: 'none', borderRadius: '8px 8px 0 0', padding: '8px 12px', color: activeId === cat.id ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                                {cat.name}
                                {/* Edit/Delete icons on hover */}
                                <span style={{ display: 'flex', gap: 2, marginLeft: 4 }}>
                                    <span
                                        onClick={e => { e.stopPropagation(); setRenamingId(cat.id); setRenameValue(cat.name); }}
                                        style={{ color: activeId === cat.id ? 'rgba(255,255,255,0.5)' : '#334155', cursor: 'pointer', lineHeight: 0 }}
                                        title="Rename"
                                    >
                                        <Edit2 size={11} />
                                    </span>
                                    <span
                                        onClick={e => { e.stopPropagation(); setPendingDeleteCatId(cat.id); }}
                                        style={{ color: activeId === cat.id ? 'rgba(255,100,100,0.7)' : '#334155', cursor: 'pointer', lineHeight: 0 }}
                                        title="Delete section"
                                    >
                                        <Trash2 size={11} />
                                    </span>
                                </span>
                            </button>
                        )}
                    </div>
                ))}

                {/* Add section button */}
                <button
                    onClick={() => setShowAddSection(true)}
                    style={{ background: 'none', border: '1px dashed rgba(99,102,241,0.3)', borderRadius: '8px 8px 0 0', padding: '6px 12px', color: '#4f46e5', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 0 }}
                    title="Add new inventory section"
                >
                    <Plus size={13} /> New Section
                </button>
            </div>

            {/* Column table */}
            {activeId && (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'rgba(2,6,23,0.8)' }}>
                                {['Label', 'Key', 'Type', 'Min / Max', 'Visible', ''].map(h => (
                                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#475569', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {columns.map((col, i) => (
                                <ColumnRow
                                    key={col.key + i}
                                    col={col}
                                    onChange={updated => updateColumn(i, updated)}
                                    onDelete={() => deleteColumn(i)}
                                />
                            ))}
                        </tbody>
                    </table>
                    {columns.length === 0 && (
                        <div style={{ padding: '32px', textAlign: 'center', color: '#334155', fontSize: '0.85rem' }}>
                            No columns yet. Click <strong style={{ color: '#6366f1' }}>Add Column</strong> to create one.
                        </div>
                    )}
                </div>
            )}

            {/* Dialogs */}
            {showAddCol && <AddColumnDialog onAdd={addColumn} onClose={() => setShowAddCol(false)} />}
            {showAddSection && <AddSectionDialog onAdd={handleAddSection} onClose={() => setShowAddSection(false)} />}
        </div>
    );
};

// ─── Settings Page ────────────────────────────────────────────────────────────

const Settings = () => {
    return (
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
                <h2 style={{ color: '#f1f5f9', fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Settings</h2>
                <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 2 }}>Manage column layouts, sections, cloud backup, and data.</p>
            </div>

            {/* ── Column Manager ─────────────────────────────────────── */}
            <ColumnManagerSection />

            {/* ── Cloud Backup ───────────────────────────────────────── */}
            <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Cloud size={18} style={{ color: '#60a5fa' }} /> Cloud Backup
                        </h3>
                        <p style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4, maxWidth: 440 }}>
                            Connect Google Drive to automatically backup your inventory database.
                        </p>
                    </div>
                    <button style={{ background: '#2563eb', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600 }}>
                        Connect Drive
                    </button>
                </div>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>Auto-Backup</p>
                        <p style={{ color: '#64748b', fontSize: '0.75rem' }}>Backup every time you close the app.</p>
                    </div>
                    <div style={{ width: 44, height: 24, background: '#1e293b', borderRadius: 12, position: 'relative', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <div style={{ position: 'absolute', top: 3, left: 3, width: 16, height: 16, background: '#475569', borderRadius: '50%' }} />
                    </div>
                </div>
            </div>

            {/* ── Data Management ────────────────────────────────────── */}
            <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 24 }}>
                <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Shield size={18} style={{ color: '#34d399' }} /> Data Management
                </h3>
                <div style={{ background: 'rgba(2,6,23,0.6)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                        <p style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 500 }}>Local Database</p>
                        <p style={{ color: '#475569', fontSize: '0.75rem' }}>AppData/Roaming/InventoryV2/inventory.db</p>
                    </div>
                    <button style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, color: '#94a3b8', cursor: 'pointer', padding: '6px 12px', fontSize: '0.8rem' }}>
                        Open Location
                    </button>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button style={{ background: 'none', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 600 }}>
                        Reset Database
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
