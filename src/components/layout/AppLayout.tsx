import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { ActionProvider } from '../../context/ActionContext';
import { ItemModal } from '../inventory/ItemModal';

const AppLayout = () => {
    return (
        <ActionProvider>
            <div className="flex h-screen bg-background text-gray-100 font-sans overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-hidden relative flex flex-col">
                    {/* Header or Topbar could go here */}
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                        <Outlet />
                    </div>
                </main>
                <ItemModal />
            </div>
        </ActionProvider>
    );
};

export default AppLayout;
