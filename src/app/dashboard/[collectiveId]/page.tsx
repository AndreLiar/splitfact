'use client'

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface CollectiveDetail {
  id: string;
  name: string;
  members: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }[];
}

interface Client {
  id: string;
  name: string;
  email: string | null;
  siret: string | null;
}

interface InvoiceShareInput {
  userId: string;
  shareType: "percent" | "fixed";
  shareValue: number;
}

interface Invoice {
  id: string;
  totalAmount: number;
  dueDate: string;
  client: {
    name: string;
  };
  shares: {
    userId: string;
    calculatedAmount: number;
  }[];
}

export default function CollectiveDetailPage() {
  const { collectiveId } = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [collective, setCollective] = useState<CollectiveDetail | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [newClientName, setNewClientName] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientSiret, setNewClientSiret] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Invoice creation state
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [invoiceTotalAmount, setInvoiceTotalAmount] = useState<number>(0)
  const [invoiceDueDate, setInvoiceDueDate] = useState<string>("")
  const [invoiceShares, setInvoiceShares] = useState<InvoiceShareInput[]>([])
  const [invoiceCreationError, setInvoiceCreationError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin")
    } else if (status === "authenticated" && collectiveId) {
      fetchCollectiveDetails()
      fetchClients()
      fetchInvoices()
    }
  }, [status, router, collectiveId])

  useEffect(() => {
    if (collective && collective.members.length > 0) {
      // Initialize invoice shares for all members
      setInvoiceShares(collective.members.map(member => ({
        userId: member.user.id,
        shareType: "percent", // Default to percent
        shareValue: 0,
      })))
    }
  }, [collective])

  const fetchCollectiveDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/collectives/${collectiveId}`)
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const data = await response.json()
      setCollective(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/collectives/${collectiveId}/clients`)
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const data = await response.json()
      setClients(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const fetchInvoices = async () => {
    try {
      const response = await fetch(`/api/collectives/${collectiveId}/invoices`)
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }
      const data = await response.json()
      setInvoices(data)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await fetch(`/api/collectives/${collectiveId}/clients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newClientName,
          email: newClientEmail || null,
          siret: newClientSiret || null,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`)
      }

      const newClient = await response.json()
      setClients([...clients, newClient])
      setNewClientName("")
      setNewClientEmail("")
      setNewClientSiret("")
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleShareChange = (userId: string, field: keyof InvoiceShareInput, value: any) => {
    setInvoiceShares(prevShares =>
      prevShares.map(share =>
        share.userId === userId ? { ...share, [field]: value } : share
      )
    )
  }

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault()
    setInvoiceCreationError(null)

    if (!selectedClient || invoiceTotalAmount <= 0 || !invoiceDueDate) {
      setInvoiceCreationError("Please fill all required invoice fields.")
      return
    }

    try {
      const response = await fetch(`/api/collectives/${collectiveId}/invoices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: selectedClient,
          totalAmount: invoiceTotalAmount,
          dueDate: invoiceDueDate,
          shares: invoiceShares.filter(share => share.shareValue > 0),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `Error: ${response.statusText}`)
      }

      alert("Invoice created successfully!")
      fetchInvoices() // Refresh invoices list
      // Optionally, clear form or redirect
      setSelectedClient("")
      setInvoiceTotalAmount(0)
      setInvoiceDueDate("")
      setInvoiceShares(collective!.members.map(member => ({
        userId: member.user.id,
        shareType: "percent",
        shareValue: 0,
      })))
    } catch (err: any) {
      setInvoiceCreationError(err.message)
    }
  }

  const handleDownloadPdf = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  const handleGenerateSubInvoices = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/generate-subinvoice`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      alert("Sub-invoices generated successfully!");
      // Optionally refresh invoices or show a success message
    } catch (err: any) {
      alert(`Failed to generate sub-invoices: ${err.message}`);
    }
  };

  if (status === "loading" || loading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">Loading...</div>
  }

  if (error) {
    return <div className="alert alert-danger">Error: {error}</div>
  }

  if (!collective) {
    return <div className="alert alert-warning">Collective not found.</div>
  }

  const isCollectiveOwner = collective.members.some(
    (member) => member.user.id === session?.user?.id && member.role === "owner"
  );

  return (
    <div className="container mt-5">
      <h1 className="mb-4 text-primary">Collective: {collective.name}</h1>
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card shadow-subtle rounded-xl p-4">
            <h2 className="h4 mb-3 text-darkGray">Members:</h2>
            <ul className="list-group list-group-flush">
              {collective.members.map((member) => (
                <li key={member.id} className="list-group-item d-flex justify-content-between align-items-center">
                  {member.user.name || member.user.email} <span className="badge bg-lightGray text-darkGray rounded-pill">{member.role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-md-6 mb-4">
          <div className="card shadow-subtle rounded-xl p-4">
            <h2 className="h4 mb-3 text-darkGray">Clients:</h2>
            {
              clients.length === 0 ? (
                <p className="text-muted">No clients added yet. Add one below!</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {clients.map((client) => (
                    <li key={client.id} className="list-group-item">
                      {client.name} {client.email && `(${client.email})`} {client.siret && `(SIRET: ${client.siret})`}
                    </li>
                  ))}
                </ul>
              )
            }

            <h3 className="h5 mt-4 mb-3 text-darkGray">Add New Client</h3>
            <form onSubmit={handleCreateClient}>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control rounded-input"
                  placeholder="Client Name"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <input
                  type="email"
                  className="form-control rounded-input"
                  placeholder="Client Email (optional)"
                  value={newClientEmail}
                  onChange={(e) => setNewClientEmail(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <input
                  type="text"
                  className="form-control rounded-input"
                  placeholder="Client SIRET (optional)"
                  value={newClientSiret}
                  onChange={(e) => setNewClientSiret(e.target.value)}
                />
              </div>
              <button type="submit" className="btn btn-primary rounded-pill">Add Client</button>
            </form>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-subtle rounded-xl p-4">
            <h2 className="h4 mb-3 text-darkGray">Create New Invoice</h2>
            {invoiceCreationError && <div className="alert alert-danger">{invoiceCreationError}</div>}
            <form onSubmit={handleCreateInvoice}>
              <div className="mb-3">
                <label htmlFor="client-select" className="form-label">Select Client:</label>
                <select
                  id="client-select"
                  className="form-select rounded-input"
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">-- Select a Client --</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="total-amount" className="form-label">Total Amount:</label>
                <input
                  type="number"
                  id="total-amount"
                  className="form-control rounded-input"
                  value={invoiceTotalAmount}
                  onChange={(e) => setInvoiceTotalAmount(parseFloat(e.target.value))}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="mb-3">
                <label htmlFor="due-date" className="form-label">Due Date:</label>
                <input
                  type="date"
                  id="due-date"
                  className="form-control rounded-input"
                  value={invoiceDueDate}
                  onChange={(e) => setInvoiceDueDate(e.target.value)}
                  required
                />
              </div>

              <h3 className="h5 mt-4 mb-3 text-darkGray">Allocate Shares:</h3>
              {
                collective.members.map((member) => {
                  const share = invoiceShares.find(s => s.userId === member.user.id);
                  return (
                    <div key={member.id} className="row mb-2 align-items-center">
                      <div className="col-md-4">
                        <label className="form-label mb-0">{member.user.name || member.user.email}:</label>
                      </div>
                      <div className="col-md-4">
                        <select
                          className="form-select rounded-input"
                          value={share?.shareType || "percent"}
                          onChange={(e) => handleShareChange(member.user.id, "shareType", e.target.value as "percent" | "fixed")}
                        >
                          <option value="percent">Percentage</option>
                          <option value="fixed">Fixed Amount</option>
                        </select>
                      </div>
                      <div className="col-md-4 d-flex align-items-center">
                        <input
                          type="number"
                          className="form-control rounded-input me-2"
                          value={share?.shareValue || 0}
                          onChange={(e) => handleShareChange(member.user.id, "shareValue", parseFloat(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                        <span className="text-darkGray">{share?.shareType === "percent" ? "%" : "€"}</span>
                      </div>
                    </div>
                  );
                })
              }
              <button type="submit" className="btn btn-primary rounded-pill mt-3">Create Invoice</button>
            </form>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <div className="card shadow-subtle rounded-xl p-4">
            <h2 className="h4 mb-3 text-darkGray">Invoices:</h2>
            {
              invoices.length === 0 ? (
                <p className="text-muted">No invoices created yet.</p>
              ) : (
                <ul className="list-group list-group-flush">
                  {invoices.map((invoice) => (
                    <li key={invoice.id} className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        Invoice to <span className="fw-bold">{invoice.client.name}</span> for <span className="fw-bold">{invoice.totalAmount}€</span> (Due: {new Date(invoice.dueDate).toLocaleDateString()})
                        {session?.user?.id && invoice.shares.some(s => s.userId === session.user.id) && (
                          <span className="ms-2 badge bg-primary">Your share: {invoice.shares.find(s => s.userId === session.user.id)?.calculatedAmount}€</span>
                        )}
                      </div>
                      <div>
                        <button onClick={() => handleDownloadPdf(invoice.id)} className="btn btn-sm btn-outline-primary rounded-pill me-2">Download PDF</button>
                        {isCollectiveOwner && (
                          <button onClick={() => handleGenerateSubInvoices(invoice.id)} className="btn btn-sm btn-success rounded-pill">Generate Sub-Invoices</button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )
            }
          </div>
        </div>
      </div>
    </div>
  )
}
