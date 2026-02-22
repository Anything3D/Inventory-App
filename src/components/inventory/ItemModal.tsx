import React, { useEffect, useState } from 'react';
import { api, Category, Item, ColumnDef, BASE_COLUMNS, parseColumnDefs } from '../../api';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useActions } from '../../context/ActionContext';

// Event bus to notify other components to refresh
export const refreshEvents = new EventTarget();

// ─── Map a ColumnDef key to the Item field it writes to ──────────────────────
//  Base cols write directly to top-level item properties.
//  Custom cols write into item.specs.
const BASE_KEYS: Record<string, keyof Item> = {
    name: 'name',
    quantity: 'quantity',
    unit: 'unit',
    location: 'location',
    description: 'description',
};

// ─── Shared field style ───────────────────────────────────────────────────────
const fieldClass = 'w-full bg-background border border-gray-700 rounded-xl px-4 py-2 text-gray-200 focus:ring-2 focus:ring-primary outline-none';
const fieldStyle = { caretColor: '#f1f5f9' };
const labelClass = 'block text-sm font-medium text-gray-400 mb-1 capitalize';

export const ItemModal = () => {
    const { isModalOpen, modalMode, editingItem, initialCategory, closeModal } = useActions();
    const [categories, setCategories] = useState<Category[]>([]);
    const [categoryId, setCategoryId] = useState<number>(0);

    // Flat data store: one record for ALL fields (base + custom)
    const [fields, setFields] = useState<Record<string, any>>({});

    const loadCategories = () =>
        api.getCategories().then(setCategories).catch(console.error);

    useEffect(() => { loadCategories(); }, []);

    // Build initial flat fields record when modal opens — also refreshes categories
    useEffect(() => {
        if (!isModalOpen) return;

        // Always reload fresh category data (picks up column changes from Settings)
        api.getCategories().then(freshCats => {
            setCategories(freshCats);

            if (modalMode === 'edit' && editingItem) {
                const specs = typeof editingItem.specs === 'string'
                    ? JSON.parse(editingItem.specs || '{}')
                    : (editingItem.specs || {});
                setCategoryId(editingItem.category_id);
                setFields({
                    name: editingItem.name ?? '',
                    description: editingItem.description ?? '',
                    quantity: editingItem.quantity ?? 1,
                    unit: editingItem.unit ?? '',
                    location: editingItem.location ?? '',
                    ...specs,
                });
            } else {
                const initCatId = initialCategory || (freshCats.length > 0 ? freshCats[0].id : 0);
                setCategoryId(initCatId);
                setFields({ name: '', description: '', quantity: 1, unit: 'pcs', location: '' });
            }
        }).catch(console.error);
    }, [isModalOpen, modalMode, editingItem, initialCategory]);

    // Reset fields when category changes (keep filled values only for matching keys)
    const handleCategoryChange = (newId: number) => {
        setCategoryId(newId);
        setFields({ name: '', description: '', quantity: 1, unit: 'pcs', location: '' });
    };

    const handleFieldChange = (key: string, value: any) => {
        setFields(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId || !fields.name) {
            alert('Please select a category and enter a name.');
            return;
        }

        // Split fields back into item + specs
        const baseKeySet = new Set(Object.keys(BASE_KEYS));
        const specs: Record<string, any> = {};
        for (const [k, v] of Object.entries(fields)) {
            if (!baseKeySet.has(k)) specs[k] = v;
        }

        const item: Item = {
            category_id: categoryId,
            name: fields.name || '',
            description: fields.description || '',
            quantity: Number(fields.quantity) || 0,
            unit: fields.unit || '',
            location: fields.location || '',
            specs: JSON.stringify(specs),
        };

        try {
            if (modalMode === 'edit' && editingItem?.id) {
                await api.updateItem(editingItem.id, item);
            } else {
                await api.addItem(item);
            }
            closeModal();
            refreshEvents.dispatchEvent(new Event('refresh'));
        } catch (err: any) {
            console.error(err);
            alert(`Failed to save item: ${err.message}`);
        }
    };

    // ── Columns from selected category ─────────────────────────────────────────
    const selectedCategory = categories.find(c => c.id === categoryId);
    const rawCols = parseColumnDefs(selectedCategory?.template_fields);
    // If stored with isBase, use as-is; otherwise prepend BASE_COLUMNS
    const colDefs: ColumnDef[] = rawCols.some(c => c.isBase) ? rawCols : [...BASE_COLUMNS, ...rawCols];
    // Only show visible columns (hidden:true = excluded from form too)
    const visibleCols = colDefs.filter(c => !c.hidden);

    // ── Render a single field input ────────────────────────────────────────────
    const renderField = (col: ColumnDef) => {
        const val = fields[col.key] ?? '';

        if (col.key === 'description') {
            return (
                <div key={col.key} style={{ gridColumn: '1 / -1' }}>
                    <label className={labelClass}>{col.label}</label>
                    <textarea
                        className={fieldClass}
                        style={fieldStyle}
                        value={val}
                        onChange={e => handleFieldChange(col.key, e.target.value)}
                        rows={2}
                    />
                </div>
            );
        }

        if (col.type === 'color') {
            return (
                <div key={col.key}>
                    <label className={labelClass}>{col.label}</label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                            type="color"
                            value={val || '#000000'}
                            onChange={e => handleFieldChange(col.key, e.target.value)}
                            style={{ width: 36, height: 36, border: 'none', borderRadius: 6, cursor: 'pointer', background: 'none', padding: 0, flexShrink: 0 }}
                        />
                        <input
                            className={fieldClass}
                            style={{ ...fieldStyle, fontFamily: 'monospace' }}
                            placeholder="#RRGGBB"
                            value={val}
                            onChange={e => handleFieldChange(col.key, e.target.value)}
                        />
                    </div>
                </div>
            );
        }

        if (col.type === 'checkbox') {
            return (
                <div key={col.key}>
                    <label className={labelClass}>{col.label}</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8 }}>
                        <input
                            type="checkbox"
                            checked={!!val && val !== 'false'}
                            onChange={e => handleFieldChange(col.key, e.target.checked ? 'true' : 'false')}
                            style={{ width: 18, height: 18, accentColor: '#6366f1', cursor: 'pointer' }}
                        />
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{val === 'true' ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            );
        }

        // number or text
        return (
            <div key={col.key}>
                <label className={labelClass}>
                    {col.label}
                    {col.type === 'number' && col.min !== undefined && col.max !== undefined && (
                        <span style={{ color: '#475569', fontSize: '0.7rem', marginLeft: 6 }}>({col.min}–{col.max})</span>
                    )}
                </label>
                <input
                    type={col.type === 'number' ? 'number' : 'text'}
                    className={fieldClass}
                    style={fieldStyle}
                    value={val}
                    onChange={e => handleFieldChange(col.key, col.type === 'number' ? Number(e.target.value) : e.target.value)}
                    min={0}
                    required={col.key === 'name'}
                    placeholder={col.key === 'name' ? 'e.g. PLA Filament Red' : col.key === 'unit' ? 'kg, pcs, m...' : col.key === 'location' ? 'e.g. Shelf A1' : ''}
                />
            </div>
        );
    };

    return (
        <Modal
            isOpen={isModalOpen}
            onClose={closeModal}
            title={modalMode === 'edit' ? 'Edit Item' : 'Add New Item'}
        >
            <form onSubmit={handleSave} className="space-y-4">
                {/* Category picker — always first */}
                <div>
                    <label className={labelClass}>Category</label>
                    <select
                        className={fieldClass}
                        value={categoryId}
                        onChange={e => handleCategoryChange(Number(e.target.value))}
                    >
                        <option value={0} disabled>Select Category</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>

                {/* All fields — driven entirely by ColumnDefs */}
                {visibleCols.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                        {visibleCols.map(col => renderField(col))}
                    </div>
                ) : (
                    <p style={{ color: '#475569', fontSize: '0.8rem', textAlign: 'center' }}>
                        Select a category to see fields.
                    </p>
                )}

                <div className="pt-4 flex justify-end gap-3 border-t border-gray-700 mt-4">
                    <Button type="button" variant="ghost" onClick={closeModal}>Cancel</Button>
                    <Button type="submit">{modalMode === 'edit' ? 'Save Changes' : 'Create Item'}</Button>
                </div>
            </form>
        </Modal>
    );
};
