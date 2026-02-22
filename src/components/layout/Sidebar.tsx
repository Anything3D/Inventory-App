import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    Settings,
    Cpu,
    Wrench,
    Car,
    Spool,
    Map,
    Layers,
    Box,
} from 'lucide-react';
import { api, Category } from '../../api';

// Shared event bus — Settings dispatches 'change' here after any category mutation
export const categoryEvents = new EventTarget();

// Pick a sensible icon based on category type/name
function getIcon(type: string) {
    const t = type.toLowerCase();
    if (t.includes('filament') || t.includes('spool')) return Spool;
    if (t.includes('electronic') || t.includes('cpu')) return Cpu;
    if (t.includes('hardware') || t.includes('wrench')) return Wrench;
    if (t.includes('auto') || t.includes('car')) return Car;
    if (t.includes('storage') || t.includes('map')) return Map;
    return Box;
}

const Sidebar = () => {
    const [categories, setCategories] = useState<Category[]>([]);

    const loadCategories = () => {
        api.getCategories().then(setCategories).catch(console.error);
    };

    useEffect(() => {
        loadCategories();
        // Listen for category changes dispatched by Settings
        categoryEvents.addEventListener('change', loadCategories);
        return () => categoryEvents.removeEventListener('change', loadCategories);
    }, []);

    const staticTop = [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    ];

    const staticBottom = [
        { name: 'Storage Map', path: '/storage', icon: Map },
        { name: 'All Items', path: '/inventory/all', icon: Package },
        { name: 'Settings', path: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-surface text-gray-100 flex flex-col h-screen border-r border-gray-700/50">
            <div className="p-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Inventory V2
                </h1>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {/* Static top items */}
                {staticTop.map(item => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                                : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span className="font-medium">{item.name}</span>
                    </NavLink>
                ))}

                {/* Dynamic category links */}
                {categories.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                        <p style={{ color: '#334155', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 16px 4px' }}>
                            Sections
                        </p>
                        {categories.map(cat => {
                            const Icon = getIcon(cat.type);
                            // Route by type to match the :category param in Inventory.tsx
                            const routeParam = cat.type.toLowerCase().replace(/\s+/g, '_');
                            return (
                                <NavLink
                                    key={cat.id}
                                    to={`/inventory/${routeParam}`}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                            ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                                            : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                                        }`
                                    }
                                >
                                    <Icon size={18} />
                                    <span className="font-medium">{cat.name}</span>
                                </NavLink>
                            );
                        })}
                    </div>
                )}

                {/* Static bottom items */}
                <div style={{ marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
                    {staticBottom.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-primary/20 text-primary shadow-lg shadow-primary/10'
                                    : 'text-gray-400 hover:bg-gray-700/30 hover:text-gray-200'
                                }`
                            }
                        >
                            <item.icon size={20} />
                            <span className="font-medium">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            <div className="p-4 border-t border-gray-700/50">
                <div className="flex items-center gap-3 text-sm text-gray-500">
                    <span>Status: Offline</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
