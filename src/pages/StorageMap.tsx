import React, { useEffect, useState } from 'react';
import { api, Item } from '../api';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Box, Map, Search } from 'lucide-react';

const StorageMap = () => {
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.getItems();
                setItems(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Group items by location
    const locationMap = items.reduce((acc, item) => {
        const loc = item.location?.trim() || 'Unassigned';
        if (!acc[loc]) {
            acc[loc] = [];
        }
        acc[loc].push(item);
        return acc;
    }, {} as Record<string, Item[]>);

    const locations = Object.keys(locationMap).sort();

    const handleLocationClick = (loc: string) => {
        // Navigate to inventory with search query for this location
        // Note: Inventory.tsx search logic might need to be robust enough to handle this, 
        // or we use a URL param. For now, we'll assume user filters manually or we pass state.
        // Actually, let's just go to all items and user can search. 
        // Better: We can implement a "?search=" query param in Inventory.tsx later.
        navigate(`/inventory/all?search=${encodeURIComponent(loc)}`);
    };

    if (loading) return <div className="text-center p-10 text-gray-500">Loading Storage Map...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Storage Map
                </h2>
                <p className="text-gray-400 text-sm">Overview of {locations.length} storage locations</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {locations.map((loc, index) => {
                    const count = locationMap[loc].length;
                    const isUnassigned = loc === 'Unassigned';

                    return (
                        <motion.div
                            key={loc}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => handleLocationClick(loc)}
                            className={`
                                relative p-4 rounded-xl border cursor-pointer group transition-all duration-300
                                ${isUnassigned
                                    ? 'bg-red-500/10 border-red-500/30 hover:border-red-500'
                                    : 'bg-surface border-gray-700 hover:border-primary hover:shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                }
                            `}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <Box size={20} className={isUnassigned ? "text-red-400" : "text-gray-400 group-hover:text-primary transition-colors"} />
                                <span className="bg-black/40 text-xs px-2 py-0.5 rounded text-gray-400">{count} items</span>
                            </div>

                            <h3 className={`font-bold text-lg truncate ${isUnassigned ? 'text-red-400' : 'text-gray-200'}`}>
                                {loc}
                            </h3>

                            {/* Preview of first 3 items */}
                            <div className="mt-2 text-xs text-gray-500 space-y-1">
                                {locationMap[loc].slice(0, 3).map(i => (
                                    <div key={i.id} className="truncate">• {i.name}</div>
                                ))}
                                {count > 3 && <div className="opacity-50">+ {count - 3} more</div>}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {locations.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                    <Map size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No locations found. Add items with location data to see them here.</p>
                </div>
            )}
        </div>
    );
};

export default StorageMap;
