import { useState } from 'react'
import { Lock, User, AlertTriangle } from 'lucide-react'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Container, Input } from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

export default function AdminLoginPage() {
  // Menambahkan tag meta robots noindex, nofollow
  useDocumentTitle('Masuk Admin', true)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showNotice, setShowNotice] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setShowNotice(true)
  }

  return (
    <div className="min-h-screen bg-[#060B18] text-[#E6ECF8] flex items-center justify-center p-4">
      <Container size="narrow">
        <div className="max-w-md mx-auto">
          {/* Brand header */}
          <div className="text-center mb-8 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#2F6BFF] to-[#8B7CF6] flex items-center justify-center text-white font-bold text-xl mx-auto shadow-lg shadow-blue-950/50">
              KT
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Portal Administrasi Pengurus
            </h1>
            <p className="text-sm text-[#9AA8C4]">
              Karang Taruna RT 001 RW 004 &bull; Akses Khusus Internal
            </p>
          </div>

          <Card className="border-slate-800 shadow-2xl">
            <CardHeader>
              <CardTitle>Masuk ke Akun Admin</CardTitle>
              <CardDescription>
                Gunakan kredensial pengurus yang telah terdaftar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {showNotice && (
                <div
                  className="mb-6 p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5"
                  role="alert"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Pemberitahuan:</strong> Form ini saat ini adalah placeholder tampilan antarmuka. Integrasi login sesungguhnya (Sanctum SPA cookie, CSRF, dan validasi kredensial) akan dihubungkan pada modul Autentikasi.
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email / Username"
                  type="text"
                  placeholder="admin@karangtaruna.local"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />

                <Input
                  label="Kata Sandi"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                <div className="pt-2">
                  <Button type="submit" className="w-full">
                    <Lock className="w-4 h-4 mr-2" />
                    Masuk ke Dashboard
                  </Button>
                </div>
              </form>

              <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
                <p className="text-xs text-[#7182A4] flex items-center justify-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  URL khusus internal, tidak tertaut dari navigasi publik.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  )
}
