'use client'

import React, { useState, useEffect } from 'react'
import { Package, AlertTriangle, Plus, ArrowDown, ArrowUp, RefreshCw, CheckCircle2 } from 'lucide-react'

export default function WarehouseDashboard() {
  const [items, setItems] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Modals
  const [showItemModal, setShowItemModal] = useState(false)
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // New Item State
  const [sku, setSku] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Расходники')
  const [unit, setUnit] = useState('шт')
  const [minQty, setMinQty] = useState('10')
  const [initialQty, setInitialQty] = useState('0')

  // Transaction State
  const [transType, setTransType] = useState('IN')
  const [transQty, setTransQty] = useState('')
  const [transNotes, setTransNotes] = useState('')

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/inventory')
      const data = await res.json()
      if (data.items) {
        setItems(data.items)
        setStats(data.stats)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku, name, category, unit, 
          minQuantity: parseFloat(minQty), 
          initialQuantity: parseFloat(initialQty)
        })
      })
      setShowItemModal(false)
      fetchInventory()
    } catch (e) {
      console.error(e)
    }
  }

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    try {
      await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TRANSACTION',
          itemId: selectedItem.id,
          type: transType,
          quantity: parseFloat(transQty),
          notes: transNotes
        })
      })
      setShowTransactionModal(false)
      fetchInventory()
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Package className="text-blue-600 w-7 h-7" />
            Склад и Инвентаризация
          </h1>
          <p className="text-sm text-slate-500 mt-1">Учет медикаментов и расходных материалов (Фаза 10)</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchInventory()} className="p-2 bg-white border border-slate-200 shadow-sm rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition">
            <RefreshCw size={20} />
          </button>
          <button 
            onClick={() => setShowItemModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:bg-blue-700 transition"
          >
            <Plus size={16} /> Новый товар
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Всего позиций</p>
            <h3 className="text-2xl font-black text-slate-900">{stats?.totalItems || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">Заканчиваются</p>
            <h3 className="text-2xl font-black text-rose-600">{stats?.lowStockItems || 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">В наличии</p>
            <h3 className="text-2xl font-black text-emerald-700">{(stats?.totalItems || 0) - (stats?.lowStockItems || 0)}</h3>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-400">Загрузка склада...</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-center text-slate-400">Склад пуст. Добавьте первый товар.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <th className="p-4 font-semibold">SKU / Артикул</th>
                <th className="p-4 font-semibold">Наименование</th>
                <th className="p-4 font-semibold">Категория</th>
                <th className="p-4 font-semibold text-right">Остаток</th>
                <th className="p-4 font-semibold text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const isLow = item.quantity <= item.minQuantity
                return (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                    <td className="p-4 text-sm font-mono text-slate-500">{item.sku}</td>
                    <td className="p-4 font-semibold text-slate-800">
                      {item.name}
                      {isLow && <span className="ml-2 inline-flex items-center text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold">Мало</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-500">{item.category}</td>
                    <td className="p-4 text-right">
                      <span className={`font-bold text-lg ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>{item.quantity}</span>
                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {
                          setSelectedItem(item)
                          setTransType('IN')
                          setShowTransactionModal(true)
                        }}
                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg mr-2 transition"
                        title="Оприходовать"
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedItem(item)
                          setTransType('OUT')
                          setShowTransactionModal(true)
                        }}
                        className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                        title="Списать"
                      >
                        <ArrowUp size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* New Item Modal */}
      {showItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-4 border-b border-slate-100 pb-3">Новая позиция на складе</h3>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Артикул / SKU</label>
                  <input required type="text" value={sku} onChange={e => setSku(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Категория</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Расходники</option>
                    <option>Медикаменты</option>
                    <option>Инвентарь</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Наименование</label>
                <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ед. изм.</label>
                  <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                    <option>шт</option>
                    <option>упак</option>
                    <option>мл</option>
                    <option>л</option>
                    <option>м</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Неснижаемый</label>
                  <input required type="number" value={minQty} onChange={e => setMinQty(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Нач. остаток</label>
                  <input required type="number" value={initialQty} onChange={e => setInitialQty(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowItemModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">Отмена</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-xl">Сохранить</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-1">Движение товара</h3>
            <p className="text-sm text-slate-500 mb-4 pb-3 border-b border-slate-100">{selectedItem.name} ({selectedItem.quantity} {selectedItem.unit})</p>
            <form onSubmit={handleTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Тип операции</label>
                <select value={transType} onChange={e => setTransType(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="IN">Оприходование (Приход)</option>
                  <option value="OUT">Списание (Расход)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Количество ({selectedItem.unit})</label>
                <input required type="number" min="0.01" step="0.01" value={transQty} onChange={e => setTransQty(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Основание / Примечание</label>
                <input required type="text" value={transNotes} onChange={e => setTransNotes(e.target.value)} className="w-full border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowTransactionModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-xl">Отмена</button>
                <button type="submit" className={`px-4 py-2 text-white font-semibold rounded-xl ${transType === 'IN' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  {transType === 'IN' ? 'Оприходовать' : 'Списать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
