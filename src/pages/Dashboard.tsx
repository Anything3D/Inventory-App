import React, { useEffect, useState } from 'react';
import { api, DashboardStats } from '../api';
import { Card } from '../components/ui/Card';
import { Package, DollarSign, AlertTriangle, Activity } from 'lucide-react';

import { useActions } from '../context/ActionContext';

const Dashboard = () => {
    const { openAddModal } = useActions();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await api.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                    Overview
                </h2>
                <p className="text-gray-400 mt-1">Welcome back, here is your inventory summary.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Items"
                    value={stats?.totalItems ?? 0}
                    icon={Package}
                    color="text-blue-400"
                    delay={0.1}
                />
                <StatsCard
                    title="Total Value"
                    value={`$${stats?.totalValue ?? 0}`}
                    icon={DollarSign}
                    color="text-green-400"
                    delay={0.2}
                />
                <StatsCard
                    title="Low Stock"
                    value={stats?.lowStock ?? 0}
                    icon={AlertTriangle}
                    color="text-yellow-400"
                    delay={0.3}
                />
                <StatsCard
                    title="Recent Activity"
                    value={stats?.recentActivity?.length ?? 0}
                    icon={Activity}
                    color="text-purple-400"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2" delay={0.5}>
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Recent Activity
                    </h3>
                    <div className="space-y-4">
                        {stats?.recentActivity?.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No recent activity found.</p>
                        ) : (
                            stats?.recentActivity.map((activity, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${activity.action === 'add' ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <p className="font-medium text-gray-200">{activity.item_name || 'Unknown Item'}</p>
                                            <p className="text-xs text-gray-400 uppercase">{activity.action}</p>
                                        </div>
                                    </div>
                                    <span className="text-sm text-gray-400">
                                        {new Date(activity.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Placeholder for Quick Actions or Charts */}
                <Card delay={0.6}>
                    <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                        <button
                            onClick={() => openAddModal()}
                            className="w-full p-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors text-left flex items-center gap-2"
                        >
                            <Package size={18} /> Add New Item
                        </button>
                        <button className="w-full p-3 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-lg border border-secondary/20 transition-colors text-left flex items-center gap-2">
                            <DollarSign size={18} /> Update Pricing
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, color, delay }: any) => (
    <Card delay={delay} className="flex items-center gap-4">
        <div className={`p-3 rounded-xl bg-gray-800 border border-gray-700 ${color}`}>
            <Icon size={24} />
        </div>
        <div>
            <p className="text-gray-400 text-sm font-medium">{title}</p>
            <h3 className="text-2xl font-bold text-gray-100">{value}</h3>
        </div>
    </Card>
);

export default Dashboard;
