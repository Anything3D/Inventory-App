import React, { useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-quartz.css";
import { ColDef, ModuleRegistry, ClientSideRowModelModule, ValidationModule, ICellRendererParams } from 'ag-grid-community';
import { Item } from '../../api';

// Register modules
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

// ─── Custom Cell Renderers ────────────────────────────────────────────────────

/** Renders a colored circle swatch for hex color values */
const ColorSwatchRenderer = (params: ICellRendererParams) => {
    const value = params.value;
    if (!value) return <span className="text-gray-600">—</span>;

    const isHex = typeof value === 'string' && /^#[0-9A-Fa-f]{3,6}$/.test(value);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '100%' }}>
            {isHex && (
                <div style={{
                    width: 28, height: 28,
                    borderRadius: '50%',
                    backgroundColor: value,
                    border: '2px solid rgba(255,255,255,0.15)',
                    flexShrink: 0,
                    boxShadow: `0 0 8px ${value}60`,
                }} />
            )}
            <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>{value}</span>
        </div>
    );
};

/** Renders qty with neon green color */
const QtyRenderer = (params: ICellRendererParams) => {
    const qty = params.value;
    if (qty === null || qty === undefined) return <span>—</span>;
    const isLow = qty < 5;
    return (
        <span style={{
            color: isLow ? '#ef4444' : '#22c55e',
            fontWeight: 700,
            fontSize: '1rem',
            display: 'flex',
            alignItems: 'center',
            height: '100%',
        }}>
            {qty}
        </span>
    );
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface DataGridProps {
    rowData: Item[];
    onCellValueChanged?: (event: any) => void;
    onRowSelected?: (event: any) => void;
    dynamicFields?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export const DataGrid = ({ rowData, onCellValueChanged, onRowSelected, dynamicFields = [] }: DataGridProps) => {

    const defaultColDef = useMemo<ColDef>(() => ({
        flex: 1,
        minWidth: 120,
        filter: true,
        sortable: true,
        resizable: true,
        editable: true,
        suppressHeaderMenuButton: false,
    }), []);

    const colDefs = useMemo<ColDef[]>(() => {
        const baseCols: ColDef[] = [
            {
                field: "name",
                headerName: "NAME",
                pinned: 'left',
                checkboxSelection: true,
                headerCheckboxSelection: true,
                minWidth: 220,
                cellStyle: { color: '#f1f5f9', fontWeight: 600, display: 'flex', alignItems: 'center' },
            },
            {
                field: "quantity",
                headerName: "QTY",
                width: 90,
                editable: true,
                cellRenderer: QtyRenderer,
                type: 'numericColumn',
            },
            {
                field: "unit",
                headerName: "UNIT",
                width: 100,
                cellStyle: { color: '#94a3b8', display: 'flex', alignItems: 'center' },
            },
            {
                field: "location",
                headerName: "LOCATION",
                minWidth: 130,
                cellStyle: { color: '#94a3b8', display: 'flex', alignItems: 'center' },
            },
            {
                field: "description",
                headerName: "DESCRIPTION",
                minWidth: 200,
                cellStyle: { color: '#64748b', display: 'flex', alignItems: 'center' },
            },
        ];

        const dynamicCols: ColDef[] = dynamicFields.map(field => {
            const label = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
            const isColorField = /color|colour|hex/i.test(field);

            return {
                headerName: label.toUpperCase(),
                field: `specs.${field}`,
                minWidth: isColorField ? 180 : 140,
                editable: true,
                cellRenderer: isColorField ? ColorSwatchRenderer : undefined,
                cellStyle: isColorField ? undefined : { color: '#e2e8f0', display: 'flex', alignItems: 'center' },
                valueGetter: (params: any) => {
                    if (!params.data?.specs) return '';
                    const specs = typeof params.data.specs === 'string' ? JSON.parse(params.data.specs) : params.data.specs;
                    return specs?.[field] ?? '';
                },
                valueSetter: (params: any) => {
                    const specs = typeof params.data.specs === 'string'
                        ? JSON.parse(params.data.specs)
                        : (params.data.specs || {});
                    specs[field] = params.newValue;
                    params.data.specs = JSON.stringify(specs);
                    return true;
                },
            };
        });

        return [...baseCols, ...dynamicCols];
    }, [dynamicFields]);

    return (
        <div
            className="ag-theme-quartz-dark"
            style={{ height: '100%', width: '100%', backgroundColor: '#0d1117' }}
        >
            <style>{`
                /* ── Base ──────────────────────────────────────────── */
                .ag-theme-quartz-dark {
                    --ag-background-color: #0d1117;
                    --ag-foreground-color: #e2e8f0;
                    --ag-border-color: transparent;
                    --ag-row-border-color: rgba(48, 54, 61, 0.6);
                    --ag-header-background-color: #0d1117;
                    --ag-odd-row-background-color: #0d1117;
                    --ag-row-hover-color: rgba(255,255,255,0.03);
                    --ag-selected-row-background-color: rgba(6,182,212,0.08);
                    --ag-cell-horizontal-border: none;
                    --ag-header-column-separator-display: none;
                    --ag-font-family: inherit;
                    --ag-font-size: 14px;
                    --ag-row-height: 52px;
                    --ag-header-height: 44px;
                    --ag-checkbox-checked-color: #06b6d4;
                    --ag-range-selection-border-color: #06b6d4;
                    --ag-input-focus-border-color: #06b6d4;
                }

                /* ── Root ──────────────────────────────────────────── */
                .ag-root-wrapper {
                    background: #0d1117 !important;
                    border: none !important;
                    border-radius: 0 !important;
                }
                .ag-root-wrapper-body,
                .ag-body,
                .ag-center-cols-viewport,
                .ag-body-viewport,
                .ag-full-width-container {
                    background: #0d1117 !important;
                }

                /* ── Header ────────────────────────────────────────── */
                .ag-header {
                    background: #0d1117 !important;
                    border-bottom: 1px solid rgba(48,54,61,0.8) !important;
                }
                .ag-header-cell {
                    background: #0d1117 !important;
                }
                .ag-header-cell-text {
                    color: #475569 !important;
                    font-size: 11px !important;
                    font-weight: 700 !important;
                    letter-spacing: 0.1em !important;
                    text-transform: uppercase !important;
                }
                .ag-header-cell-resize::after {
                    background: rgba(48,54,61,0.5) !important;
                }

                /* ── Rows ──────────────────────────────────────────── */
                .ag-row {
                    background: #0d1117 !important;
                    border-bottom: 1px solid rgba(48, 54, 61, 0.5) !important;
                    transition: background 0.15s;
                }
                .ag-row:hover {
                    background: rgba(255,255,255,0.025) !important;
                }
                .ag-row-selected {
                    background: rgba(6,182,212,0.06) !important;
                }

                /* ── Pinned columns ────────────────────────────────── */
                .ag-pinned-left-cols-container .ag-row,
                .ag-pinned-left-header-container {
                    background: #0d1117 !important;
                }
                .ag-pinned-left-header-container {
                    border-right: 1px solid rgba(48,54,61,0.5) !important;
                }

                /* ── Cell focus ────────────────────────────────────── */
                .ag-cell-focus {
                    border: 1px solid rgba(6,182,212,0.4) !important;
                }

                /* ── Inline editing input ──────────────────────────── */
                .ag-cell-edit-wrapper, .ag-input-field-input {
                    background: #161b22 !important;
                    border: 1px solid rgba(6,182,212,0.5) !important;
                    color: #f1f5f9 !important;
                    border-radius: 4px;
                }
                .ag-cell-inline-editing {
                    box-shadow: 0 0 0 2px rgba(6,182,212,0.2);
                }

                /* ── Checkbox ──────────────────────────────────────── */
                .ag-checkbox-input-wrapper::after {
                    color: #06b6d4 !important;
                }

                /* ── Pagination ────────────────────────────────────── */
                .ag-paging-panel {
                    background: #0d1117 !important;
                    border-top: 1px solid rgba(48,54,61,0.5) !important;
                    color: #64748b !important;
                }
                .ag-paging-button {
                    color: #64748b !important;
                }
                .ag-paging-button:hover {
                    color: #06b6d4 !important;
                }

                /* ── Scrollbar ─────────────────────────────────────── */
                .ag-body-viewport::-webkit-scrollbar {
                    width: 6px; height: 6px;
                }
                .ag-body-viewport::-webkit-scrollbar-track { background: #0d1117; }
                .ag-body-viewport::-webkit-scrollbar-thumb {
                    background: #30363d;
                    border-radius: 3px;
                }
                .ag-body-viewport::-webkit-scrollbar-thumb:hover { background: #475569; }

                /* ── Filter/Tool panel ─────────────────────────────── */
                .ag-menu, .ag-popup {
                    background: #161b22 !important;
                    border: 1px solid rgba(48,54,61,0.8) !important;
                    color: #e2e8f0 !important;
                }
                .ag-filter-condition, .ag-filter-body-wrapper {
                    background: #161b22 !important;
                }
            `}</style>

            <AgGridReact
                rowData={rowData}
                columnDefs={colDefs}
                defaultColDef={defaultColDef}
                rowSelection="multiple"
                onCellValueChanged={onCellValueChanged}
                onSelectionChanged={onRowSelected}
                pagination={true}
                paginationPageSize={25}
                animateRows={true}
                enableCellTextSelection={true}
                suppressCellFocus={false}
            />
        </div>
    );
};
