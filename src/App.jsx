import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import emptyInvoiceImage from './assets/image.png'
import appIcon from './assets/icon.png'
import profileAvatar from './assets/profile.jpeg'

const STORAGE_KEYS = {
  invoices: 'invoice-app.invoices',
  theme: 'invoice-app.theme',
}

const PAYMENT_TERMS = [
  { value: 1, label: 'Net 1 Day' },
  { value: 7, label: 'Net 7 Days' },
  { value: 14, label: 'Net 14 Days' },
  { value: 30, label: 'Net 30 Days' },
]

const STATUS_OPTIONS = ['draft', 'pending', 'paid']

const initialInvoices = [
  {
    id: 'RT3080',
    createdAt: '2026-04-12',
    paymentTerms: 1,
    description: 'Brand identity redesign',
    clientName: 'Jensen Huang',
    clientEmail: 'jensen@visionarylabs.com',
    status: 'paid',
    senderAddress: {
      street: '19 Union Terrace',
      city: 'Boston',
      postCode: '02108',
      country: 'United States',
    },
    clientAddress: {
      street: '84 Market Street',
      city: 'San Francisco',
      postCode: '94103',
      country: 'United States',
    },
    items: [
      { id: 'item-1', name: 'Logo concept set', quantity: 2, price: 450 },
      { id: 'item-2', name: 'Brand guidelines', quantity: 1, price: 1200 },
    ],
  },
  {
    id: 'XM9141',
    createdAt: '2026-04-18',
    paymentTerms: 7,
    description: 'Monthly web maintenance',
    clientName: 'Alex Grim',
    clientEmail: 'alexgrim@mail.com',
    status: 'pending',
    senderAddress: {
      street: '19 Union Terrace',
      city: 'London',
      postCode: 'E1 3EZ',
      country: 'United Kingdom',
    },
    clientAddress: {
      street: '84 Church Way',
      city: 'Bradford',
      postCode: 'BD1 9PB',
      country: 'United Kingdom',
    },
    items: [
      { id: 'item-1', name: 'Banner Design', quantity: 1, price: 156 },
      { id: 'item-2', name: 'Email Design', quantity: 2, price: 200 },
    ],
  },
  {
    id: 'RG0314',
    createdAt: '2026-04-20',
    paymentTerms: 30,
    description: 'Product strategy workshop',
    clientName: '',
    clientEmail: '',
    status: 'draft',
    senderAddress: {
      street: '19 Union Terrace',
      city: 'Boston',
      postCode: '02108',
      country: 'United States',
    },
    clientAddress: {
      street: '',
      city: '',
      postCode: '',
      country: '',
    },
    items: [{ id: 'item-1', name: 'Discovery session', quantity: 1, price: 0 }],
  },
]

function App() {
  const [theme, setTheme] = usePersistentState(STORAGE_KEYS.theme, 'light', normalizeTheme)
  const [invoices, setInvoices] = usePersistentState(
    STORAGE_KEYS.invoices,
    initialInvoices,
    normalizeInvoices,
  )
  const [currentPage, setCurrentPage] = useState('list')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(() => invoices[0]?.id ?? null)
  const [activeFilters, setActiveFilters] = useState([])
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [drawerState, setDrawerState] = useState({ open: false, mode: 'create', invoiceId: null })
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  const filteredInvoices = useMemo(() => {
    if (!activeFilters.length) {
      return invoices
    }

    return invoices.filter((invoice) => activeFilters.includes(invoice.status))
  }, [activeFilters, invoices])

  const selectedInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0] ?? null,
    [invoices, selectedInvoiceId],
  )

  const invoiceSummary = useMemo(() => {
    if (!filteredInvoices.length) {
      return 'No invoices'
    }
    return `There ${filteredInvoices.length === 1 ? 'is' : 'are'} ${filteredInvoices.length} total ${filteredInvoices.length === 1 ? 'invoice' : 'invoices'
      }`
  }, [filteredInvoices.length])

  const openCreateDrawer = () => setDrawerState({ open: true, mode: 'create', invoiceId: null })
  const openEditDrawer = (invoiceId) => setDrawerState({ open: true, mode: 'edit', invoiceId })
  const closeDrawer = () => setDrawerState((current) => ({ ...current, open: false }))

  const handleToggleFilter = (status) => {
    setActiveFilters((current) =>
      current.includes(status) ? current.filter((value) => value !== status) : [...current, status],
    )
  }

  const handleSaveInvoice = (payload, nextStatus) => {
    const normalizedInvoice = normalizeInvoice({
      ...payload,
      status: nextStatus,
      id: drawerState.mode === 'edit' ? payload.id : generateInvoiceId(invoices),
    })

    setInvoices((current) => {
      if (drawerState.mode === 'edit') {
        return current.map((invoice) => (invoice.id === normalizedInvoice.id ? normalizedInvoice : invoice))
      }
      return [normalizedInvoice, ...current]
    })

    setSelectedInvoiceId(normalizedInvoice.id)
    setCurrentPage('detail')
    closeDrawer()
  }

  const handleDeleteInvoice = () => {
    if (!deleteTargetId) {
      return
    }

    const nextInvoices = invoices.filter((invoice) => invoice.id !== deleteTargetId)
    setInvoices(nextInvoices)
    if (deleteTargetId === selectedInvoiceId) {
      setSelectedInvoiceId(nextInvoices[0]?.id ?? null)
    }
    setDeleteTargetId(null)
    setCurrentPage('list')
  }

  const handleMarkAsPaid = () => {
    if (!selectedInvoice || selectedInvoice.status !== 'pending') {
      return
    }

    setInvoices((current) =>
      current.map((invoice) =>
        invoice.id === selectedInvoice.id ? { ...invoice, status: 'paid' } : invoice,
      ),
    )
  }

  const invoiceForDrawer =
    drawerState.mode === 'edit'
      ? invoices.find((invoice) => invoice.id === drawerState.invoiceId) ?? null
      : null

  return (
    <div className="app-shell">
      <Sidebar
        theme={theme}
        onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))}
      />

      <main className={`app-main ${currentPage === 'detail' ? 'app-main--detail' : ''}`}>
        {currentPage === 'list' ? (
          <section className="list-pane list-pane--landing">
            <InvoiceListHeader
              invoiceSummary={invoiceSummary}
              activeFilters={activeFilters}
              isFilterOpen={isFilterOpen}
              onToggleFilterMenu={() => setIsFilterOpen((current) => !current)}
              onToggleFilter={handleToggleFilter}
              onCreateInvoice={openCreateDrawer}
            />

            {filteredInvoices.length ? (
              <ul className="invoice-list" aria-label="Invoice list">
                {filteredInvoices.map((invoice) => (
                  <li key={invoice.id}>
                    <InvoiceListItem
                      invoice={invoice}
                      onOpen={() => {
                        setSelectedInvoiceId(invoice.id)
                        setCurrentPage('detail')
                        setIsFilterOpen(false)
                      }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}
          </section>
        ) : (
          <section className="detail-pane detail-pane--page">
            {selectedInvoice ? (
              <InvoiceDetail
                invoice={selectedInvoice}
                onBack={() => setCurrentPage('list')}
                onEdit={() => openEditDrawer(selectedInvoice.id)}
                onDelete={() => setDeleteTargetId(selectedInvoice.id)}
                onMarkAsPaid={handleMarkAsPaid}
              />
            ) : (
              <div className="detail-empty">
                <h2>No invoice selected</h2>
                <p>Choose an invoice from the list or create a new one to get started.</p>
              </div>
            )}
          </section>
        )}
      </main>

      {drawerState.open ? (
        <InvoiceFormDrawer
          key={`${drawerState.mode}-${invoiceForDrawer?.id ?? 'new'}`}
          mode={drawerState.mode}
          invoice={invoiceForDrawer}
          onClose={closeDrawer}
          onSave={handleSaveInvoice}
        />
      ) : null}

      {deleteTargetId ? (
        <ConfirmDeleteModal
          invoiceId={deleteTargetId}
          onCancel={() => setDeleteTargetId(null)}
          onConfirm={handleDeleteInvoice}
        />
      ) : null}
    </div>
  )
}

function Sidebar({ theme, onToggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="logo-tile" aria-hidden="true">
        <img src={appIcon} alt="" />
      </div>

      <div className="sidebar__bottom">
        <button
          type="button"
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>

        <img className="avatar" src={profileAvatar} alt="Profile avatar" />
      </div>
    </aside>
  )
}

function InvoiceListHeader({
  invoiceSummary,
  activeFilters,
  isFilterOpen,
  onToggleFilterMenu,
  onToggleFilter,
  onCreateInvoice,
}) {
  return (
    <header className="list-header">
      <div className="list-header__copy">
        <h1>Invoices</h1>
        <p>{invoiceSummary}</p>
      </div>

      <div className="toolbar">
        <div className="filter-wrap">
          <button
            type="button"
            className={`filter-button ${isFilterOpen ? 'is-open' : ''}`}
            aria-haspopup="true"
            aria-expanded={isFilterOpen}
            onClick={onToggleFilterMenu}
          >
            <span className="filter-button__label">Filter by status</span>
            <span className="filter-button__value">
              {activeFilters.length ? activeFilters.join(', ') : 'All'}
            </span>
            <ChevronIcon />
          </button>

          {isFilterOpen ? (
            <div className="filter-menu" role="menu" aria-label="Filter invoices by status">
              {STATUS_OPTIONS.map((status) => (
                <label key={status} className="checkbox-option">
                  <input
                    type="checkbox"
                    checked={activeFilters.includes(status)}
                    onChange={() => onToggleFilter(status)}
                  />
                  <span>{capitalize(status)}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <button type="button" className="primary-button" onClick={onCreateInvoice}>
          <span className="primary-button__icon">+</span>
          <span>New Invoice</span>
        </button>
      </div>
    </header>
  )
}

function InvoiceListItem({ invoice, onOpen }) {
  return (
    <article className="invoice-card">
      <span className="invoice-card__id">#{invoice.id}</span>
      <p className="muted-label invoice-card__due">{formatDisplayDate(invoice.paymentDue)}</p>
      <h2 className="invoice-card__client">{invoice.clientName || 'Untitled client'}</h2>
      <strong className="invoice-card__amount">{formatCurrency(invoice.total)}</strong>
      <div className="invoice-card__status">
        <StatusBadge status={invoice.status} />
      </div>
      <button
        type="button"
        className="invoice-card__chevron"
        onClick={onOpen}
        aria-label={`View invoice ${invoice.id}`}
      >
        <ChevronRightIcon />
      </button>
    </article>
  )
}

function InvoiceDetail({ invoice, onBack, onEdit, onDelete, onMarkAsPaid }) {
  return (
    <article className="detail-page" aria-labelledby="invoice-title">
      <button type="button" className="back-button" onClick={onBack}>
        <span>Go Back</span>
      </button>

      <div className="detail-status-bar">
        <div className="detail-status-bar__label">
          <span>Status</span>
          <StatusBadge status={invoice.status} />
        </div>

        <div className="detail-status-bar__actions detail-status-bar__actions--desktop">
          <button type="button" className="secondary-button" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="danger-button" onClick={onDelete}>
            Delete
          </button>
          <button
            type="button"
            className="primary-button primary-button--compact"
            onClick={onMarkAsPaid}
            disabled={invoice.status !== 'pending'}
          >
            Mark as Paid
          </button>
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-hero">
          <div>
            <h2 id="invoice-title">#{invoice.id}</h2>
            <p>{invoice.description || 'No project description yet'}</p>
          </div>

          <address>
            <span>{invoice.senderAddress.street}</span>
            <span>{invoice.senderAddress.city}</span>
            <span>{invoice.senderAddress.postCode}</span>
            <span>{invoice.senderAddress.country}</span>
          </address>
        </div>

        <div className="detail-meta-grid">
          <div>
            <p className="meta-label">Invoice Date</p>
            <strong>{formatDisplayDate(invoice.createdAt)}</strong>
          </div>
          <div>
            <p className="meta-label">Bill To</p>
            <strong>{invoice.clientName || 'Draft client'}</strong>
            <address className="stacked-address">
              <span>{invoice.clientAddress.street || '-'}</span>
              <span>{invoice.clientAddress.city || '-'}</span>
              <span>{invoice.clientAddress.postCode || '-'}</span>
              <span>{invoice.clientAddress.country || '-'}</span>
            </address>
          </div>
          <div>
            <p className="meta-label">Payment Due</p>
            <strong>{formatDisplayDate(invoice.paymentDue)}</strong>
          </div>
          <div>
            <p className="meta-label">Send To</p>
            <strong>{invoice.clientEmail || 'No email added'}</strong>
          </div>
        </div>

        <section className="line-items" aria-labelledby="line-items-title">
          <div className="line-items__header">
            <h3 id="line-items-title">Line Items</h3>
          </div>

          <div className="line-items__table">
            <div className="line-items__head">
              <span>Item Name</span>
              <span>Qty.</span>
              <span>Price</span>
              <span>Total</span>
            </div>

            <div className="line-items__body">
              {invoice.items.map((item) => (
                <div key={item.id} className="line-items__row">
                  <strong>{item.name || 'Untitled item'}</strong>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.price)}</span>
                  <strong>{formatCurrency(item.quantity * item.price)}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="line-items__footer">
            <span>Grand Total</span>
            <strong>{formatCurrency(invoice.total)}</strong>
          </div>
        </section>
      </div>

    </article>
  )
}

function InvoiceFormDrawer({ mode, invoice, onClose, onSave }) {
  const dialogRef = useDialog({ isOpen: true, onClose })
  const [formState, setFormState] = useState(() => createFormState(invoice))
  const [errors, setErrors] = useState({})

  const handleChange = (section, field, value) => {
    setFormState((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [field]: value,
      },
    }))
  }

  const handleRootChange = (field, value) => {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }))
  }

  const handleItemChange = (itemId, field, value) => {
    setFormState((current) => ({
      ...current,
      items: current.items.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item,
      ),
    }))
  }

  const handleAddItem = () => {
    setFormState((current) => ({
      ...current,
      items: [...current.items, createEmptyItem()],
    }))
  }

  const handleRemoveItem = (itemId) => {
    setFormState((current) => ({
      ...current,
      items: current.items.filter((item) => item.id !== itemId),
    }))
  }

  const submitForm = (nextStatus) => {
    const validationErrors = validateInvoice(formState, nextStatus)
    setErrors(validationErrors)

    if (Object.keys(validationErrors).length) {
      return
    }

    onSave(
      {
        ...formState,
        items: formState.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price),
        })),
      },
      nextStatus,
    )
  }

  return (
    <div className="overlay">
      <div className="drawer-backdrop" onClick={onClose} aria-hidden="true" />

      <section
        ref={dialogRef}
        className={`invoice-drawer invoice-drawer--${mode}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-form-title"
      >
        <header className="drawer-header">
          <div>
            <h2 id="invoice-form-title">{mode === 'edit' ? `Edit #${invoice?.id ?? ''}` : 'New Invoice'}</h2>
          </div>
        </header>

        <div className="drawer-content">
          <fieldset className="form-section">
            <legend>Bill From</legend>
            <div className="form-grid">
              <Field
                label="Street Address"
                value={formState.senderAddress.street}
                error={errors['senderAddress.street']}
                onChange={(value) => handleChange('senderAddress', 'street', value)}
              />
              <Field
                label="City"
                value={formState.senderAddress.city}
                error={errors['senderAddress.city']}
                onChange={(value) => handleChange('senderAddress', 'city', value)}
              />
              <Field
                label="Post Code"
                value={formState.senderAddress.postCode}
                error={errors['senderAddress.postCode']}
                onChange={(value) => handleChange('senderAddress', 'postCode', value)}
              />
              <Field
                label="Country"
                value={formState.senderAddress.country}
                error={errors['senderAddress.country']}
                onChange={(value) => handleChange('senderAddress', 'country', value)}
              />
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>Bill To</legend>
            <div className="form-grid">
              <Field
                label="Client's Name"
                value={formState.clientName}
                error={errors.clientName}
                onChange={(value) => handleRootChange('clientName', value)}
              />
              <Field
                label="Client's Email"
                type="email"
                value={formState.clientEmail}
                error={errors.clientEmail}
                onChange={(value) => handleRootChange('clientEmail', value)}
              />
              <Field
                label="Street Address"
                value={formState.clientAddress.street}
                error={errors['clientAddress.street']}
                onChange={(value) => handleChange('clientAddress', 'street', value)}
              />
              <Field
                label="City"
                value={formState.clientAddress.city}
                error={errors['clientAddress.city']}
                onChange={(value) => handleChange('clientAddress', 'city', value)}
              />
              <Field
                label="Post Code"
                value={formState.clientAddress.postCode}
                error={errors['clientAddress.postCode']}
                onChange={(value) => handleChange('clientAddress', 'postCode', value)}
              />
              <Field
                label="Country"
                value={formState.clientAddress.country}
                error={errors['clientAddress.country']}
                onChange={(value) => handleChange('clientAddress', 'country', value)}
              />
              <Field
                className="field--date"
                label="Invoice Date"
                type="date"
                value={formState.createdAt}
                error={errors.createdAt}
                onChange={(value) => handleRootChange('createdAt', value)}
              />

              <label className="field field--payment-terms">
                <span className="field__label">Payment Terms</span>
                <select
                  className={`field__control ${errors.paymentTerms ? 'has-error' : ''}`}
                  value={formState.paymentTerms}
                  onChange={(event) => handleRootChange('paymentTerms', Number(event.target.value))}
                >
                  {PAYMENT_TERMS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.paymentTerms ? <span className="field__error">{errors.paymentTerms}</span> : null}
              </label>

              <Field
                label="Project Description"
                value={formState.description}
                error={errors.description}
                onChange={(value) => handleRootChange('description', value)}
              />
            </div>
          </fieldset>

          <section className="form-section">
            <div className="items-header">
              <h3>Item List</h3>
            </div>

            <div className="items-editor">
              <div className="item-row-header" aria-hidden="true">
                <span>Item Name</span>
                <span>Qty.</span>
                <span>Price</span>
                <span>Total</span>
                <span />
              </div>
              {formState.items.map((item, index) => (
                <div key={item.id} className="item-row">
                  <label className="item-cell item-cell--name">
                    <span className="item-cell__label">Item Name</span>
                    <input
                      className={`field__control ${errors[`items.${item.id}.name`] ? 'has-error' : ''}`}
                      aria-label={`Item Name ${index + 1}`}
                      value={item.name}
                      onChange={(event) => handleItemChange(item.id, 'name', event.target.value)}
                    />
                    {errors[`items.${item.id}.name`] ? (
                      <span className="field__error">{errors[`items.${item.id}.name`]}</span>
                    ) : null}
                  </label>

                  <label className="item-cell item-cell--qty">
                    <span className="item-cell__label">Qty.</span>
                    <input
                      type="number"
                      min="1"
                      className={`field__control ${errors[`items.${item.id}.quantity`] ? 'has-error' : ''}`}
                      value={item.quantity}
                      onChange={(event) => handleItemChange(item.id, 'quantity', event.target.value)}
                    />
                    {errors[`items.${item.id}.quantity`] ? (
                      <span className="field__error">{errors[`items.${item.id}.quantity`]}</span>
                    ) : null}
                  </label>

                  <label className="item-cell item-cell--price">
                    <span className="item-cell__label">Price</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={`field__control ${errors[`items.${item.id}.price`] ? 'has-error' : ''}`}
                      value={item.price}
                      onChange={(event) => handleItemChange(item.id, 'price', event.target.value)}
                    />
                    {errors[`items.${item.id}.price`] ? (
                      <span className="field__error">{errors[`items.${item.id}.price`]}</span>
                    ) : null}
                  </label>

                  <div className="item-cell item-cell--total">
                    <span className="item-cell__label">Total</span>
                    <div className="item-total">
                      {formatCurrency(Number(item.quantity || 0) * Number(item.price || 0))}
                    </div>
                  </div>

                  <div className="item-cell item-cell--action">
                    <button
                      type="button"
                      className="ghost-icon-button"
                      onClick={() => handleRemoveItem(item.id)}
                      aria-label={`Remove item ${index + 1}`}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {errors.items ? <p className="items-error">{errors.items}</p> : null}

            <button type="button" className="secondary-button secondary-button--full" onClick={handleAddItem}>
              + Add New Item
            </button>
          </section>
        </div>

        <footer className={`drawer-footer drawer-footer--${mode}`}>
          {mode === 'edit' ? (
            <div className="drawer-footer__actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-button primary-button--compact"
                onClick={() => submitForm('pending')}
              >
                Save Changes
              </button>
            </div>
          ) : (
            <>
              <button type="button" className="secondary-button secondary-button--ghost" onClick={onClose}>
                Discard
              </button>
              <div className="drawer-footer__actions">
                <button type="button" className="secondary-button secondary-button--draft" onClick={() => submitForm('draft')}>
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="primary-button primary-button--compact"
                  onClick={() => submitForm('pending')}
                >
                  Save & Send
                </button>
              </div>
            </>
          )}
        </footer>
      </section>
    </div>
  )
}

function Field({ label, error, onChange, className = '', ...props }) {
  return (
    <label className={`field ${className}`.trim()}>
      <span className="field__label">{label}</span>
      <input
        className={`field__control ${error ? 'has-error' : ''}`}
        value={props.value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        {...props}
      />
      {error ? <span className="field__error">{error}</span> : null}
    </label>
  )
}

function ConfirmDeleteModal({ invoiceId, onCancel, onConfirm }) {
  const dialogRef = useDialog({ isOpen: true, onClose: onCancel })

  return (
    <div className="overlay">
      <div className="drawer-backdrop" onClick={onCancel} aria-hidden="true" />
      <section
        ref={dialogRef}
        className="confirm-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
        aria-describedby="confirm-delete-description"
      >
        <h2 id="confirm-delete-title">Confirm Deletion</h2>
        <p id="confirm-delete-description">
          Are you sure you want to delete invoice #{invoiceId}? This action cannot be undone.
        </p>

        <div className="confirm-modal__actions">
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="danger-button" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </section>
    </div>
  )
}

function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {capitalize(status)}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state__content">
        <div className="empty-state__illustration" aria-hidden="true">
          <img src={emptyInvoiceImage} alt="" className="empty-state__illustration-image" />
        </div>
        <h2>There is nothing here</h2>
        <p>Create an invoice by clicking the New Invoice button and get paid faster.</p>
      </div>
    </div>
  )
}

function usePersistentState(key, fallbackValue, normalizeValue = identity) {
  const [value, setValue] = useState(() => {
    const normalizedFallback = normalizeValue(fallbackValue)

    if (typeof window === 'undefined') {
      return normalizedFallback
    }

    try {
      const storedValue = window.localStorage.getItem(key)
      if (!storedValue) {
        return normalizedFallback
      }

      return normalizeValue(JSON.parse(storedValue))
    } catch {
      return normalizedFallback
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage write failures so the UI still works in restricted environments.
    }
  }, [key, value])

  return [value, setValue]
}

function useDialog({ isOpen, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const node = ref.current
    if (!node) {
      return undefined
    }

    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

    const getFocusableElements = () =>
      [...node.querySelectorAll(focusableSelector)].filter((element) => !element.hasAttribute('disabled'))

    const focusableElements = getFocusableElements()
    const firstElement = focusableElements[0] ?? node

    const animationFrame = window.requestAnimationFrame(() => {
      firstElement.focus()
    })

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const currentFocusable = getFocusableElements()
      const first = currentFocusable[0] ?? node
      const last = currentFocusable[currentFocusable.length - 1] ?? node

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return ref
}

function normalizeInvoice(invoice) {
  const createdAt = isValidDateInput(invoice?.createdAt) ? invoice.createdAt : todayString()
  const paymentTerms = normalizePaymentTerms(invoice?.paymentTerms)
  const items = normalizeItems(invoice?.items)

  const total = items.reduce((sum, item) => sum + item.quantity * item.price, 0)
  const paymentDue = addDays(createdAt, paymentTerms)

  return {
    ...invoice,
    id: normalizeInvoiceId(invoice?.id),
    createdAt,
    paymentTerms,
    description: typeof invoice?.description === 'string' ? invoice.description : '',
    clientName: typeof invoice?.clientName === 'string' ? invoice.clientName : '',
    clientEmail: typeof invoice?.clientEmail === 'string' ? invoice.clientEmail : '',
    status: normalizeStatus(invoice?.status),
    senderAddress: normalizeAddress(invoice?.senderAddress),
    clientAddress: normalizeAddress(invoice?.clientAddress),
    items,
    total,
    paymentDue,
  }
}

function createFormState(invoice) {
  if (!invoice) {
    return {
      id: '',
      createdAt: todayString(),
      paymentTerms: 30,
      description: '',
      clientName: '',
      clientEmail: '',
      senderAddress: {
        street: '',
        city: '',
        postCode: '',
        country: '',
      },
      clientAddress: {
        street: '',
        city: '',
        postCode: '',
        country: '',
      },
      items: [createEmptyItem()],
    }
  }

  return {
    ...invoice,
    items: invoice.items.map((item) => ({ ...item })),
  }
}

function validateInvoice(invoice, nextStatus) {
  const errors = {}
  const shouldValidateRequired = nextStatus !== 'draft'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  const requiredChecks = [
    ['senderAddress.street', invoice.senderAddress.street],
    ['senderAddress.city', invoice.senderAddress.city],
    ['senderAddress.postCode', invoice.senderAddress.postCode],
    ['senderAddress.country', invoice.senderAddress.country],
    ['clientAddress.street', invoice.clientAddress.street],
    ['clientAddress.city', invoice.clientAddress.city],
    ['clientAddress.postCode', invoice.clientAddress.postCode],
    ['clientAddress.country', invoice.clientAddress.country],
    ['createdAt', invoice.createdAt],
    ['paymentTerms', invoice.paymentTerms],
    ['description', invoice.description],
    ['clientName', invoice.clientName],
  ]

  if (shouldValidateRequired) {
    requiredChecks.forEach(([key, value]) => {
      if (!String(value ?? '').trim()) {
        errors[key] = 'This field is required'
      }
    })

    if (!invoice.clientEmail.trim()) {
      errors.clientEmail = 'A valid email is required'
    }
  }

  if (invoice.clientEmail.trim() && !emailRegex.test(invoice.clientEmail.trim())) {
    errors.clientEmail = 'Enter a valid email address'
  }

  if (!invoice.items.length) {
    errors.items = 'Please add at least one item'
  }

  invoice.items.forEach((item) => {
    if (shouldValidateRequired && !item.name.trim()) {
      errors[`items.${item.id}.name`] = 'Required'
    }

    if (Number(item.quantity) <= 0) {
      errors[`items.${item.id}.quantity`] = 'Must be greater than 0'
    }

    if (Number(item.price) <= 0 && nextStatus !== 'draft') {
      errors[`items.${item.id}.price`] = 'Must be greater than 0'
    }
  })

  return errors
}

function addDays(dateString, days) {
  const date = createDateFromInput(dateString)
  date.setDate(date.getDate() + Number(days))
  return formatDateInput(date)
}

function generateInvoiceId(invoices) {
  let nextId = ''
  do {
    nextId = `${randomLetters(2)}${String(Math.floor(1000 + Math.random() * 9000))}`
  } while (invoices.some((invoice) => invoice.id === nextId))
  return nextId
}

function randomLetters(length) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  return Array.from({ length }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('')
}

function formatDisplayDate(dateString) {
  const date = createDateFromInput(dateString)
  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(Number(value)) ? Number(value) : 0)
}

function todayString() {
  return formatDateInput(new Date())
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function identity(value) {
  return value
}

function normalizeTheme(value) {
  return value === 'dark' ? 'dark' : 'light'
}

function normalizeInvoices(value) {
  const sourceInvoices = Array.isArray(value) ? value : initialInvoices
  const normalizedInvoices = []

  sourceInvoices.forEach((invoice) => {
    const normalizedInvoice = normalizeInvoice(invoice)
    const invoiceId =
      normalizedInvoice.id && !normalizedInvoices.some((current) => current.id === normalizedInvoice.id)
        ? normalizedInvoice.id
        : generateInvoiceId(normalizedInvoices)

    normalizedInvoices.push({
      ...normalizedInvoice,
      id: invoiceId,
      items: normalizeItems(invoice?.items),
    })
  })

  return normalizedInvoices.map((invoice) => ({
    ...invoice,
    total: invoice.items.reduce((sum, item) => sum + item.quantity * item.price, 0),
    paymentDue: addDays(invoice.createdAt, invoice.paymentTerms),
  }))
}

function normalizeInvoiceId(value) {
  return typeof value === 'string' ? value.trim().toUpperCase() : ''
}

function normalizePaymentTerms(value) {
  const normalizedValue = Number(value)
  return PAYMENT_TERMS.some((term) => term.value === normalizedValue) ? normalizedValue : 30
}

function normalizeFiniteNumber(value) {
  const normalizedValue = Number(value)
  return Number.isFinite(normalizedValue) ? normalizedValue : 0
}

function normalizeStatus(value) {
  return STATUS_OPTIONS.includes(value) ? value : 'draft'
}

function normalizeAddress(value) {
  return {
    street: typeof value?.street === 'string' ? value.street : '',
    city: typeof value?.city === 'string' ? value.city : '',
    postCode: typeof value?.postCode === 'string' ? value.postCode : '',
    country: typeof value?.country === 'string' ? value.country : '',
  }
}

function normalizeItems(items) {
  if (!Array.isArray(items) || !items.length) {
    return [createEmptyItem()]
  }

  const seenIds = new Set()

  return items.map((item) => {
    const candidateId = typeof item?.id === 'string' ? item.id.trim() : ''
    const itemId = candidateId && !seenIds.has(candidateId) ? candidateId : generateUniqueId()
    seenIds.add(itemId)

    return {
      id: itemId,
      name: typeof item?.name === 'string' ? item.name : '',
      quantity: normalizeFiniteNumber(item?.quantity),
      price: normalizeFiniteNumber(item?.price),
    }
  })
}

function createEmptyItem() {
  return { id: generateUniqueId(), name: '', quantity: 1, price: 0 }
}

function generateUniqueId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `id-${Math.random().toString(36).slice(2, 10)}`
}

function isValidDateInput(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) {
    return false
  }

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  return formatDateInput(date) === value
}

function createDateFromInput(dateString) {
  if (!isValidDateInput(dateString)) {
    return new Date(Number.NaN)
  }

  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatDateInput(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 8" aria-hidden="true">
      <path d="m1 1 5 5 5-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 8 12" aria-hidden="true">
      <path d="m1 1 5 5-5 5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5V3m0 18v-2m7-7h2M3 12H1m15.657 6.657 1.414 1.414M4.929 4.929l1.414 1.414m9.314-1.414-1.414 1.414M6.343 17.657l-1.414 1.414M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M20 15.3A8.95 8.95 0 0 1 8.7 4a9 9 0 1 0 11.3 11.3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 7h16m-2 0-1 12H7L6 7m3-3h6l1 3H8l1-3Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

export default App
