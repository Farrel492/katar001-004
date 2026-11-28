import { useState } from 'react'
import { Building2, Users } from 'lucide-react'
import { PageHeader, Toast, type ToastType } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'
import OrganizationProfileTab from './profile/OrganizationProfileTab'
import OrganizationMembersTab from './profile/OrganizationMembersTab'

type TabKey = 'profile' | 'members'

export default function AdminProfilePage() {
  useDocumentTitle('Kelola Profil & Struktur', true)

  const [activeTab, setActiveTab] = useState<TabKey>('profile')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type })
    window.setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr))
    }, 4500)
  }

  return (
    <div className="space-y-6">
      <Toast
        message={toast?.message ?? null}
        type={toast?.type}
        onDismiss={() => setToast(null)}
      />

      <PageHeader
        title="Profil & Struktur Organisasi"
        description="Kelola identitas, visi-misi, kontak resmi, logo organisasi, serta susunan dan urutan pengurus."
      />

      {/* Tab Navigasi */}
      <div
        role="tablist"
        aria-label="Bagian Profil dan Struktur"
        className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-[#0C1427] border border-slate-800/80 w-fit"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'profile'}
          onClick={() => setActiveTab('profile')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22D3EE]',
            activeTab === 'profile'
              ? 'bg-[#2F6BFF] text-white shadow-md shadow-blue-950/50'
              : 'text-[#9AA8C4] hover:text-white hover:bg-slate-800/40',
          )}
        >
          <Building2 className="w-4 h-4" aria-hidden="true" />
          Profil Organisasi
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'members'}
          onClick={() => setActiveTab('members')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all min-h-[44px] cursor-pointer focus-visible:outline-2 focus-visible:outline-[#22D3EE]',
            activeTab === 'members'
              ? 'bg-[#2F6BFF] text-white shadow-md shadow-blue-950/50'
              : 'text-[#9AA8C4] hover:text-white hover:bg-slate-800/40',
          )}
        >
          <Users className="w-4 h-4" aria-hidden="true" />
          Struktur Pengurus
        </button>
      </div>

      {/* Konten Tab */}
      {activeTab === 'profile' ? (
        <OrganizationProfileTab
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      ) : (
        <OrganizationMembersTab
          onSuccess={(msg) => showToast(msg, 'success')}
          onError={(msg) => showToast(msg, 'error')}
        />
      )}
    </div>
  )
}
