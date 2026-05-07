/**
 * Trade Management Modal
 * Allows users to add or edit trades manually
 */
'use client'

import { useState, useEffect } from 'react'

export function TradeModal({ isOpen, mode = 'add', trade = null, onClose, onSuccess, token }) {
  const [formData, setFormData] = useState({
    symbol: '',
    company_name: '',
    trade_type: 'BUY',
    trade_date: new Date().toISOString().split('T')[0],
    quantity: '',
    rate: '',
    total_charges: '0',
    commission: '0',
    broker: 'Munir Khanani',
    settlement_type: 'Ready',
    is_futures: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API = process.env.NEXT_PUBLIC_API_URL

  // Populate form when editing or reset when adding
  useEffect(() => {
    if (mode === 'edit' && trade) {
      setFormData({
        symbol: trade.symbol || '',
        company_name: trade.company_name || '',
        trade_type: trade.trade_type || 'BUY',
        trade_date: trade.trade_date || new Date().toISOString().split('T')[0],
        quantity: trade.quantity?.toString() || '',
        rate: trade.rate?.toString() || '',
        total_charges: trade.total_charges?.toString() || '0',
        commission: trade.commission?.toString() || '0',
        broker: trade.broker || 'Munir Khanani',
        settlement_type: trade.settlement_type || 'Ready',
        is_futures: trade.is_futures || false,
      })
    } else if (mode === 'add') {
      // Reset form for new trade
      setFormData({
        symbol: '',
        company_name: '',
        trade_type: 'BUY',
        trade_date: new Date().toISOString().split('T')[0],
        quantity: '',
        rate: '',
        total_charges: '0',
        commission: '0',
        broker: 'Munir Khanani',
        settlement_type: 'Ready',
        is_futures: false,
      })
    }
  }, [mode, trade, isOpen])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (!formData.symbol || !formData.quantity || !formData.rate) {
        throw new Error('Symbol, Quantity, and Rate are required')
      }

      const method = mode === 'add' ? 'POST' : 'PUT'
      const endpoint = mode === 'add' 
        ? `${API}/api/trades/add` 
        : `${API}/api/trades/${trade.id}`

      const res = await fetch(endpoint, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.detail || 'Operation failed')
      }

      onSuccess()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-card trade-modal">
        <div className="modal-header">
          <h2>{mode === 'add' ? '➕ Add New Trade' : '✏️ Edit Trade'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="trade-form">
          <div className="form-grid">
            {/* Symbol */}
            <div className="form-group">
              <label>Symbol *</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleChange}
                placeholder="e.g., PSX, HBL"
                required
              />
            </div>

            {/* Company Name */}
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                placeholder="Full company name"
              />
            </div>

            {/* Trade Type */}
            <div className="form-group">
              <label>Trade Type *</label>
              <select name="trade_type" value={formData.trade_type} onChange={handleChange} required>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>

            {/* Trade Date */}
            <div className="form-group">
              <label>Trade Date *</label>
              <input
                type="date"
                name="trade_date"
                value={formData.trade_date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Quantity */}
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                placeholder="0"
                step="1"
                min="1"
                required
              />
            </div>

            {/* Rate */}
            <div className="form-group">
              <label>Rate (Rs.) *</label>
              <input
                type="number"
                name="rate"
                value={formData.rate}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            {/* Commission */}
            <div className="form-group">
              <label>Commission</label>
              <input
                type="number"
                name="commission"
                value={formData.commission}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Total Charges */}
            <div className="form-group">
              <label>Total Charges</label>
              <input
                type="number"
                name="total_charges"
                value={formData.total_charges}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            {/* Broker */}
            <div className="form-group">
              <label>Broker</label>
              <select name="broker" value={formData.broker} onChange={handleChange} required>
                <option value="Munir Khanani">Munir Khanani</option>
                <option value="AKD">AKD</option>
              </select>
            </div>

            {/* Settlement Type */}
            <div className="form-group">
              <label>Settlement Type</label>
              <select name="settlement_type" value={formData.settlement_type} onChange={handleChange}>
                <option value="Ready">Ready</option>
                <option value="Futures">Futures</option>
              </select>
            </div>

          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : mode === 'add' ? 'Add Trade' : 'Update Trade'}
            </button>
          </div>
        </form>

        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
          }

          .modal-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            box-shadow: 0 30px 80px rgba(0, 0, 0, 0.4);
            width: 90%;
            max-width: 700px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
          }

          .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.5rem;
            border-bottom: 1px solid var(--border);
            flex-shrink: 0;
          }

          .modal-header h2 {
            font-size: 20px;
            margin: 0;
          }

          .modal-close {
            background: none;
            border: none;
            color: var(--muted);
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .modal-close:hover {
            color: var(--text);
          }

          .trade-form {
            padding: 1.5rem;
            flex: 1;
            display: flex;
            flex-direction: column;
          }

          .form-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .form-group {
            display: flex;
            flex-direction: column;
          }

          .form-group label {
            font-size: 12px;
            color: var(--muted);
            margin-bottom: 6px;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            font-weight: 600;
          }

          .form-group input,
          .form-group select {
            padding: 10px 12px;
            background: var(--bg);
            border: 1px solid var(--border2);
            border-radius: 6px;
            color: var(--text);
            font-size: 14px;
            outline: none;
            transition: border-color 0.2s;
          }

          .form-group input:focus,
          .form-group select:focus {
            border-color: var(--accent);
          }

          .checkbox-group {
            flex-direction: row;
            align-items: center;
            gap: 8px;
          }

          .checkbox-group label {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0;
            text-transform: none;
            text-decoration: none;
          }

          .checkbox-group input[type="checkbox"] {
            width: 18px;
            height: 18px;
            cursor: pointer;
          }

          .form-error {
            background: var(--loss-bg);
            border: 1px solid var(--loss);
            color: var(--loss);
            padding: 12px;
            border-radius: 6px;
            font-size: 13px;
            margin-bottom: 1rem;
          }

          .form-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
            margin-top: auto;
            padding-top: 1rem;
            border-top: 1px solid var(--border);
          }

          .btn-secondary {
            padding: 10px 16px;
            background: var(--surface2);
            color: var(--text);
            border: 1px solid var(--border);
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-secondary:hover {
            background: var(--border);
          }

          .btn-primary {
            padding: 10px 16px;
            background: var(--accent);
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
          }

          .btn-primary:hover:not(:disabled) {
            background: var(--accent2);
          }

          .btn-primary:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          @media (max-width: 600px) {
            .modal-card {
              width: 95%;
              max-height: 95vh;
            }

            .form-grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
