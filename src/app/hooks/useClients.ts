'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { fetcher } from '@/lib/fetcher';
import { revalidateClients } from './useApi';
import useSWR from 'swr';
import type { Client } from '@/types/domain';

export const clientSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  siret: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  tvaNumber: z.string().optional().or(z.literal('')),
  legalStatus: z.string().optional().or(z.literal('')),
  shareCapital: z.string().optional().or(z.literal('')),
  contactName: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
});

export type ClientFormData = z.infer<typeof clientSchema>;

const EMPTY_FORM: ClientFormData = {
  name: '', email: '', siret: '', address: '',
  tvaNumber: '', legalStatus: '', shareCapital: '', contactName: '', phone: '',
};

export function useClients() {
  // SWR handles caching, deduplication, and revalidation
  const { data: clients = [], error: swrError, isLoading: loading } = useSWR<Client[]>(
    '/api/clients',
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 5000 },
  );

  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [error, setError] = useState<string | null>(swrError?.message ?? null);

  const [showModal, setShowModal] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClientFormData, string>>>({});
  const [siretLookup, setSiretLookup] = useState<{ loading: boolean; result: { valid: boolean; active?: boolean; companyName?: string | null; address?: string | null; error?: string } | null }>({ loading: false, result: null });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  useEffect(() => {
    let filtered = clients.filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.email ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.siret ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.contactName ?? '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || (() => {
        switch (statusFilter) {
          case 'with-email': return !!client.email;
          case 'with-siret': return !!client.siret;
          case 'complete': return !!(client.email && client.siret && client.address);
          default: return true;
        }
      })();

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'email': return (a.email ?? '').localeCompare(b.email ?? '');
        case 'created': return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        default: return 0;
      }
    });

    setFilteredClients(filtered);
    setCurrentPage(1);
  }, [clients, searchTerm, statusFilter, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddClient = () => {
    setCurrentClient(null);
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setSiretLookup({ loading: false, result: null });
    setShowModal(true);
  };

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setFormData({
      name: client.name ?? '',
      email: client.email ?? '',
      siret: client.siret ?? '',
      address: client.address ?? '',
      tvaNumber: client.tvaNumber ?? '',
      legalStatus: client.legalStatus ?? '',
      shareCapital: client.shareCapital ?? '',
      contactName: client.contactName ?? '',
      phone: client.phone ?? '',
    });
    setFormErrors({});
    setSiretLookup({
      loading: false,
      result: client.siretValidated ? { valid: true, active: true, companyName: client.name } : null,
    });
    setShowModal(true);
  };

  const handleVerifySiret = async () => {
    const siret = formData.siret?.replace(/\s/g, '');
    if (!siret || siret.length < 14) return;
    setSiretLookup({ loading: true, result: null });
    try {
      const res = await fetch(`/api/siret?siret=${siret}`);
      const data = await res.json();
      setSiretLookup({ loading: false, result: data });
      if (data.valid && data.companyName && !formData.name) {
        setFormData(prev => ({ ...prev, name: data.companyName }));
      }
      if (data.valid && data.address && !formData.address) {
        setFormData(prev => ({ ...prev, address: data.address }));
      }
    } catch {
      setSiretLookup({ loading: false, result: { valid: false, error: 'Erreur de connexion à SIRENE' } });
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ?')) return;
    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      await revalidateClients();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = clientSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ClientFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const key = err.path[0] as keyof ClientFormData;
        fieldErrors[key] = err.message;
      });
      setFormErrors(fieldErrors);
      return;
    }

    try {
      const method = currentClient ? 'PUT' : 'POST';
      const url = currentClient ? `/api/clients/${currentClient.id}` : '/api/clients';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      });
      if (!response.ok) throw new Error(`Error: ${response.statusText}`);
      setShowModal(false);
      await revalidateClients();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files?.[0]) {
      setSelectedFile(event.target.files[0]);
      setImportError(null);
      setImportSuccess(null);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setImportError('Veuillez sélectionner un fichier CSV.');
      return;
    }
    setUploading(true);
    setImportError(null);
    setImportSuccess(null);

    const fd = new FormData();
    fd.append('file', selectedFile);

    try {
      const response = await fetch('/api/clients/import', { method: 'POST', body: fd });
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        let msg = "Échec de l'importation des clients.";
        if (contentType?.includes('application/json')) {
          const d = await response.json();
          msg = d.error || msg;
        } else {
          msg = await response.text();
        }
        throw new Error(msg);
      }
      const result = await response.json();
      setImportSuccess(`Importation réussie: ${result.importedCount} clients importés, ${result.skippedCount} ignorés.`);
      setSelectedFile(null);
      await revalidateClients();
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setUploading(false);
    }
  };

  const getClientCompleteness = (client: Client) => {
    const fields: (keyof Client)[] = ['name', 'email', 'siret', 'address', 'contactName', 'phone'];
    const filled = fields.filter(f => {
      const v = client[f];
      return typeof v === 'string' && v.trim().length > 0;
    });
    return Math.round((filled.length / fields.length) * 100);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentClients = filteredClients.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  return {
    clients,
    filteredClients,
    currentClients,
    totalPages,
    indexOfFirstItem,
    indexOfLastItem,
    loading,
    error,
    showModal, setShowModal,
    currentClient,
    formData,
    formErrors,
    siretLookup, setSiretLookup,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    sortBy, setSortBy,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    selectedFile,
    uploading,
    importError,
    importSuccess,
    handleInputChange,
    handleAddClient,
    handleEditClient,
    handleVerifySiret,
    handleDeleteClient,
    handleSubmit,
    handleFileChange,
    handleUpload,
    getClientCompleteness,
  };
}
