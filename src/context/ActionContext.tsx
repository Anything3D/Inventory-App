import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Item } from '../api';

interface ActionContextType {
    isModalOpen: boolean;
    modalMode: 'add' | 'edit';
    editingItem: Item | null;
    initialCategory: number;
    openAddModal: (categoryId?: number) => void;
    openEditModal: (item: Item) => void;
    closeModal: () => void;
}

const ActionContext = createContext<ActionContextType | undefined>(undefined);

export const ActionProvider = ({ children }: { children: ReactNode }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [initialCategory, setInitialCategory] = useState<number>(0);

    const openAddModal = (categoryId: number = 0) => {
        setModalMode('add');
        setEditingItem(null);
        setInitialCategory(categoryId);
        setIsModalOpen(true);
    };

    const openEditModal = (item: Item) => {
        setModalMode('edit');
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
        setInitialCategory(0);
    };

    return (
        <ActionContext.Provider value={{
            isModalOpen,
            modalMode,
            editingItem,
            initialCategory,
            openAddModal,
            openEditModal,
            closeModal
        }}>
            {children}
        </ActionContext.Provider>
    );
};

export const useActions = () => {
    const context = useContext(ActionContext);
    if (!context) {
        throw new Error('useActions must be used within an ActionProvider');
    }
    return context;
};
