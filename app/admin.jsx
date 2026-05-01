'use client'
import { useState, useEffect } from 'react'

const fmt = (n) => new Intl.NumberFormat('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n || 0)

// Helper: Get current time in Pakistani timezone (PKT = UTC+5)
const getNowPKT = () => {
  const now = new Date()
  const pktOffset = 5 * 60 * 60 * 1000
  const pktTime = new Date(now.getTime() + pktOffset)
  return pktTime
}

// Format: Get default scheduled time (current time in PKT)
const getDefaultScheduledTime = () => {
  const pktNow = getNowPKT()
  const year = pktNow.getUTCFullYear()
  const month = String(pktNow.getUTCMonth() + 1).padStart(2, '0')
  const day = String(pktNow.getUTCDate()).padStart(2, '0')
  const hours = String(pktNow.getUTCHours()).padStart(2, '0')
  const minutes = String(pktNow.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Format date for display in PKT
const fmtDateTimePKT = (dateStr) => {
  if (!dateStr) return ''
  const [datePart, timePart] = dateStr.split('T')
  const [year, month, day] = datePart.split('-')
  const time = timePart ? timePart.slice(0, 5) : '00:00'
  return `${day}/${month}/${year} ${time}`
}

// ─── ADMIN PANEL ────────────────────────────
export default function AdminPanel({ token }) {
  const [activeTab, setActiveTab] = useState('schedule')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    symbol: '',
    trade_date: new Date().toISOString().split('T')[0],
    trade_time: '14:30',
    buy_price: '',
    sell_price: '',
    stop_loss: '',
    difference: '',
    result: 'Pending',
    channel_id: '1498347963532054768',
    message_format: 'embed',
    scheduled_at: getDefaultScheduledTime(),
  })

  const API = process.env.NEXT_PUBLIC_API_URL

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessages()
    }
  }, [activeTab])

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/discord/messages`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (err) {
      console.error('Error fetching messages:', err)
    }
    setLoading(false)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {

      const res = await fetch(`${API}/api/discord/schedule`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
  ...formData,
  scheduled_at: formData.scheduled_at + ':00',  // use the actual Publish At field
})
      })

      const data = await res.json()
      if (res.ok) {
        alert(`✓ Message scheduled for ${formData.trade_date} at ${formData.trade_time}`)
        setFormData({
          symbol: '',
          trade_date: new Date().toISOString().split('T')[0],
          trade_time: '14:30',
          buy_price: '',
          sell_price: '',
          stop_loss: '',
          difference: '',
          result: 'Pending',
          channel_id: '1498347963532054768',
          message_format: 'embed',
          scheduled_at: getDefaultScheduledTime(),
        })
        fetchMessages()
      } else {
        alert(`Error: ${data.detail || 'Failed to schedule message'}`)
      }
    } catch (err) {
      console.error('Error scheduling message:', err)
      alert('Failed to schedule message')
    }
    setLoading(false)
  }

  const handleDelete = async (messageId) => {
    if (!confirm('Cancel this scheduled message?')) return

    try {
      const res = await fetch(`${API}/api/discord/messages/${messageId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.ok) {
        alert('✓ Message cancelled')
        fetchMessages()
      } else {
        alert('Failed to cancel message')
      }
    } catch (err) {
      console.error('Error deleting message:', err)
    }
  }

  const getChannelName = (channelId) => {
    return channelId === '1498347963532054768' ? 'INTRADAY' : 'SWING'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled': return '#F59E0B'
      case 'sent': return '#10B981'
      case 'failed': return '#EF4444'
      default: return '#6B7FA3'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return '⏱️'
      case 'sent': return '✓'
      case 'failed': return '✗'
      default: return '○'
    }
  }

  return (
    <div className="admin-panel">
      <style>{`
        .admin-panel {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.5rem;
        }
        .admin-header {
          margin-bottom: 2rem;
        }
        .admin-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 0.5rem;
          color: var(--text);
        }
        .admin-subtitle {
          color: var(--muted);
          font-size: 13px;
        }
        .admin-tabs {
          display: flex;
          gap: 10px;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0;
        }
        .admin-tab {
          padding: 12px 20px;
          background: none;
          border: none;
          color: var(--muted);
          cursor: pointer;
          font-size: 14px;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .admin-tab.active {
          color: var(--text);
          border-bottom-color: var(--accent);
        }
        .admin-tab:hover {
          color: var(--text);
        }
        .admin-form {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group.full {
          grid-column: 1 / -1;
        }
        .form-label {
          font-size: 12px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }
        .form-input,
        .form-select {
          padding: 10px 12px;
          background: var(--bg);
          border: 1px solid var(--border2);
          border-radius: 6px;
          color: var(--text);
          font-size: 14px;
          font-family: inherit;
        }
        .form-input:focus,
        .form-select:focus {
          outline: none;
          border-color: var(--accent);
          background: var(--surface2);
        }
        .form-buttons {
          grid-column: 1 / -1;
          display: flex;
          gap: 10px;
          margin-top: 1rem;
        }
        .btn-submit {
          flex: 1;
          padding: 12px 20px;
          background: var(--accent);
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-submit:hover:not(:disabled) {
          background: var(--accent2);
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .message-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 1rem;
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 1rem;
        }
        .message-content {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1rem;
        }
        .message-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .message-label {
          font-size: 11px;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .message-value {
          font-size: 14px;
          color: var(--text);
          font-weight: 500;
        }
        .message-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          justify-content: center;
          align-items: flex-end;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .btn-delete {
          padding: 6px 12px;
          background: var(--loss-bg);
          color: var(--loss);
          border: 1px solid var(--loss);
          border-radius: 6px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-delete:hover {
          background: var(--loss);
          color: white;
        }
        .empty-state {
          text-align: center;
          padding: 3rem 1rem;
          color: var(--muted);
        }
        .empty-icon {
          font-size: 2rem;
          margin-bottom: 1rem;
        }
        @media (max-width: 768px) {
          .admin-form {
            grid-template-columns: 1fr;
          }
          .message-content {
            grid-template-columns: 1fr;
          }
          .message-card {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-header">
        <div className="admin-title">📊 Discord Admin Panel</div>
        <div className="admin-subtitle">Schedule trade alerts to Discord channels</div>
      </div>

      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'schedule' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedule')}
        >
          📝 Schedule Message
        </button>
        <button
          className={`admin-tab ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          📋 Scheduled Messages
        </button>
      </div>

      {activeTab === 'schedule' && (
        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">Symbol</label>
            <input
              type="text"
              name="symbol"
              className="form-input"
              placeholder="e.g., PAEL"
              value={formData.symbol}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Channel</label>
            <select
              name="channel_id"
              className="form-select"
              value={formData.channel_id}
              onChange={handleInputChange}
            >
              <option value="1498347963532054768">📈 INTRADAY</option>
              <option value="1498348133514612746">📊 SWING</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Trade Date</label>
            <input
              type="date"
              name="trade_date"
              className="form-input"
              value={formData.trade_date}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trade Time</label>
            <input
              type="time"
              name="trade_time"
              className="form-input"
              value={formData.trade_time}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Buy Price (Rs.)</label>
            <input
              type="number"
              step="0.01"
              name="buy_price"
              className="form-input"
              placeholder="0.00"
              value={formData.buy_price}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Sell Price (Rs.)</label>
            <input
              type="number"
              step="0.01"
              name="sell_price"
              className="form-input"
              placeholder="0.00"
              value={formData.sell_price}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Stop Loss (Rs.)</label>
            <input
              type="number"
              step="0.01"
              name="stop_loss"
              className="form-input"
              placeholder="0.00"
              value={formData.stop_loss}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Difference (Rs.)</label>
            <input
              type="number"
              step="0.01"
              name="difference"
              className="form-input"
              placeholder="0.00"
              value={formData.difference}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Result</label>
            <select
              name="result"
              className="form-select"
              value={formData.result}
              onChange={handleInputChange}
            >
              <option value="Pending">⏳ Pending</option>
              <option value="Win">🟢 Win</option>
              <option value="Loss">🔴 Loss</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Message Format</label>
            <select
              name="message_format"
              className="form-select"
              value={formData.message_format}
              onChange={handleInputChange}
            >
              <option value="embed">📱 Embed (Formatted Card)</option>
              <option value="plain_text">📄 Plain Text</option>
            </select>
          </div>

          <div className="form-group full">
            <label className="form-label">Publish At — Pakistan Time (PKT)</label>
            <input
              type="datetime-local"
              name="scheduled_at"
              className="form-input"
              value={formData.scheduled_at}
              onChange={handleInputChange}
              required
            />
            <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '0.25rem' }}>
              Current Pakistan time is shown. Message will be sent at this exact PKT time.
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Scheduling...' : '📤 Schedule Message'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'messages' && (
        <div>
          {loading && <div style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>}

          {!loading && messages.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>No scheduled messages</p>
            </div>
          )}

          {!loading && messages.length > 0 && (
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className="message-card">
                  <div className="message-content">
                    <div className="message-item">
                      <div className="message-label">Symbol</div>
                      <div className="message-value">{msg.symbol}</div>
                    </div>
                    <div className="message-item">
                      <div className="message-label">Channel</div>
                      <div className="message-value">{msg.channel_name}</div>
                    </div>
                    <div className="message-item">
                      <div className="message-label">Trade Date</div>
                      <div className="message-value">{msg.trade_date} {msg.trade_time}</div>
                    </div>
                    <div className="message-item">
                      <div className="message-label">Publish At (PKT)</div>
                      <div className="message-value">{fmtDateTimePKT(msg.scheduled_at)}</div>
                    </div>
                    <div className="message-item">
                      <div className="message-label">Buy Price</div>
                      <div className="message-value">Rs. {fmt(msg.buy_price)}</div>
                    </div>
                    <div className="message-item">
                      <div className="message-label">Sell Price</div>
                      <div className="message-value">Rs. {fmt(msg.sell_price)}</div>
                    </div>
                  </div>

                  <div className="message-actions">
                    <div
                      className="status-badge"
                      style={{
                        backgroundColor: getStatusColor(msg.status) + '20',
                        color: getStatusColor(msg.status)
                      }}
                    >
                      {getStatusIcon(msg.status)} {msg.status}
                    </div>
                    {msg.status === 'scheduled' && (
                      <button
                        className="btn-delete"
                        onClick={() => handleDelete(msg.id)}
                      >
                        ✕ Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}