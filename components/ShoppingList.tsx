
import React, { useState } from 'react';
import { ShoppingItem } from '../types';
import { Plus, Trash2, ShoppingCart, CheckCircle2, Circle, DollarSign, Hash, Tag, Edit3, Check, X } from 'lucide-react';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAddItem: (name: string, value: number, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onToggleItem: (id: string) => void;
  onUpdateItemValue: (id: string, newValue: number) => void;
  onUpdateItemQuantity: (id: string, newQuantity: number) => void;
}

const ShoppingList: React.FC<ShoppingListProps> = ({ 
  items, 
  onAddItem, 
  onRemoveItem, 
  onToggleItem, 
  onUpdateItemValue,
  onUpdateItemQuantity 
}) => {
  const [newItemName, setNewItemName] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('1');

  // Estados para edição
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editQuantity, setEditQuantity] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const val = parseFloat(newItemValue) || 0;
    const qty = parseFloat(newItemQuantity) || 1;
    onAddItem(newItemName, val, qty);
    setNewItemName('');
    setNewItemValue('');
    setNewItemQuantity('1');
  };

  const startEditing = (item: ShoppingItem) => {
    setEditingId(item.id);
    setEditValue(item.value.toString());
    setEditQuantity(item.quantity.toString());
  };

  const saveEdit = (id: string) => {
    const newVal = parseFloat(editValue);
    const newQty = parseFloat(editQuantity);
    if (!isNaN(newVal)) onUpdateItemValue(id, newVal);
    if (!isNaN(newQty)) onUpdateItemQuantity(id, newQty);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const total = items.reduce((acc, item) => acc + (item.value * item.quantity), 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full transition-colors duration-300">
      <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50/30 dark:bg-emerald-900/20">
        <div className="flex items-center gap-3 self-start">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
            <ShoppingCart size={22} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100">Compras</h2>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">{items.length} itens na lista</p>
          </div>
        </div>
        <div className="text-right self-end sm:self-center">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Estimado</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 transition-colors">
            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
        </div>
      </div>

      <div className="p-4 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
        <form onSubmit={handleAdd} className="flex flex-col gap-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="O que você precisa comprar?"
            className="w-full px-4 py-2 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Hash className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={newItemQuantity}
                onChange={(e) => setNewItemQuantity(e.target.value)}
                placeholder="Qtd/kg"
                className="w-full pl-7 pr-2 py-2 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none"
              />
            </div>
            <div className="relative flex-1">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="number"
                step="0.01"
                value={newItemValue}
                onChange={(e) => setNewItemValue(e.target.value)}
                placeholder="Preço un/kg"
                className="w-full pl-7 pr-2 py-2 bg-white dark:bg-slate-700 dark:text-slate-100 border border-slate-200 dark:border-slate-600 rounded-xl text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-md active:scale-95"
            >
              <Plus size={20} />
            </button>
          </div>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 opacity-30 italic">
            <ShoppingCart size={48} className="mb-2" />
            <p className="text-sm">Sua lista está vazia</p>
          </div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                item.completed 
                ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 opacity-60' 
                : 'bg-white dark:bg-slate-700/50 border-slate-200 dark:border-slate-700 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <button
                  onClick={() => onToggleItem(item.id)}
                  className={`mt-1 flex-shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-400'}`}
                >
                  {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                </button>
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <p className={`text-sm sm:text-base font-bold truncate transition-colors ${item.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'}`}>
                    {item.name}
                  </p>
                  
                  {editingId === item.id ? (
                    <div className="flex flex-wrap items-center gap-2 mt-1 animate-in fade-in slide-in-from-left-2">
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        <Hash size={10} className="text-slate-400" />
                        <input 
                          type="number" 
                          step="0.01" 
                          value={editQuantity} 
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-12 bg-transparent text-[10px] sm:text-xs font-bold outline-none border-none p-0 dark:text-white"
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600">
                        <DollarSign size={10} className="text-emerald-500" />
                        <input 
                          type="number" 
                          step="0.01" 
                          value={editValue} 
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-16 bg-transparent text-[10px] sm:text-xs font-bold outline-none border-none p-0 dark:text-white"
                        />
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => saveEdit(item.id)} className="p-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-md hover:bg-emerald-200">
                          <Check size={14} />
                        </button>
                        <button onClick={cancelEdit} className="p-1 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md hover:bg-slate-200">
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        <Hash size={10} className="text-slate-400" /> {item.quantity} un/kg
                      </span>
                      <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <Tag size={10} className="text-slate-300 dark:text-slate-600" />
                        {item.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}/un
                      </span>
                      <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <DollarSign size={10} className="text-emerald-500" />
                        Subtotal: {(item.value * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                {!item.completed && editingId !== item.id && (
                  <button
                    onClick={() => startEditing(item)}
                    className="p-2 text-slate-300 hover:text-indigo-500 transition-all hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl"
                    title="Editar valor"
                  >
                    <Edit3 size={18} />
                  </button>
                )}
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-slate-300 hover:text-red-500 transition-all hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                  title="Remover item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ShoppingList;
