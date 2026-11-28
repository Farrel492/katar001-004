import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, AlertTriangle, Loader2 } from 'lucide-react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Container,
  Input,
} from '@/components/ui'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { loginAdmin } from '@/lib/api'

export default function AdminLoginPage() {
  useDocumentTitle('Masuk Admin', true)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    try {
      await loginAdmin({ username: username.trim(), password })
      navigate('/admin')
    } catch (err: unknown) {
      if (err instanceof Error && err.message) {
        setErrorMsg(err.message)
      } else {
        setErrorMsg('Kredensial tidak valid atau gagal masuk. Silakan coba lagi.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
            <main className="min-h-screen bg-[var(--bg-base)] text-[var(--text-main)] flex items-center justify-center p-4">
              <Container size="narrow">
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-8 space-y-2">
                    <div
                      aria-hidden="true"
                      className="w-12 h-12 rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center text-[var(--text-main)] font-bold text-lg mx-auto"
                    >
                      KT
                    </div>
                    <h1 className="text-2xl font-extrabold text-[var(--text-main)] tracking-tight">
                      Portal Administrasi Pengurus
                    </h1>
                    <p className="text-sm text-[var(--text-muted)]">
                      Karang Taruna RT 001 RW 004 &bull; Akses Khusus Internal
                    </p>
                  </div>

                      <Card>
                        <CardHeader>
                          <CardTitle>Masuk ke Akun Admin</CardTitle>
                          <CardDescription>
                            Gunakan akun pengurus yang telah terdaftar.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {errorMsg && (
                            <div
                              className="mb-6 p-4 rounded-[var(--radius-sm)] bg-red-950/40 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5"
                              role="alert"
                            >
                              <AlertTriangle className="w-4 h-4 text-[var(--danger-text)] shrink-0 mt-0.5" aria-hidden="true" />
                              <div>{errorMsg}</div>
                            </div>
                          )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                              <Input
                                label="Username atau Email"
                                type="text"
                                placeholder="Masukkan username atau email"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                autoComplete="username"
                                required
                              />

                              <Input
                                label="Kata Sandi"
                                type="password"
                                placeholder="Masukkan kata sandi"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                                required
                              />

                              <div className="pt-2">
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                  {isLoading ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                                      Memverifikasi...
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-4 h-4 mr-2" aria-hidden="true" />
                                      Masuk ke Dashboard
                                    </>
                                  )}
                                </Button>
                              </div>
                  </form>
                </CardContent>
              </Card>
          </div>
      </Container>
    </main>
  )
}
