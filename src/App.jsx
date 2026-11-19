import { useEffect, useMemo, useState } from 'react'
import { dataAwal } from './todos'

const opsiStatus = ['to-do', 'in progress', 'done']
const opsiPrioritas = ['low', 'medium', 'high']
const labelStatus = { 'to-do': 'To Do', 'in progress': 'In Progress', done: 'Done' }
const labelPrioritas = { low: 'Low', medium: 'Medium', high: 'High' }

function formatTanggal(iso) {
  if (!iso) return '-'
  return new Date(`${iso}T00:00:00`).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function cekTerlambat(tugas) {
  if (tugas.status === 'done' || !tugas.deadline) return false
  const hariIni = new Date(new Date().toDateString())
  return new Date(`${tugas.deadline}T00:00:00`) < hariIni
}

function Modal({ judul, subjudul, onTutup, children }) {
  useEffect(() => {
    const tekanEscape = (e) => e.key === 'Escape' && onTutup()
    document.addEventListener('keydown', tekanEscape)
    return () => document.removeEventListener('keydown', tekanEscape)
  }, [onTutup])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onTutup()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <div>
            <h2>{judul}</h2>
            {subjudul && <p>{subjudul}</p>}
          </div>
          <button className="tutup" onClick={onTutup} aria-label="Tutup">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

function FormTugas({ tugas, onTutup, onSimpan }) {
  const [form, setForm] = useState(
    tugas || { title: '', description: '', status: 'to-do', priority: 'medium', deadline: '' },
  )
  const [error, setError] = useState({})

  function ubah(kunci, nilai) {
    setForm({ ...form, [kunci]: nilai })
    setError({ ...error, [kunci]: '' })
  }

  function kirim(e) {
    e.preventDefault()
    const salah = {}
    if (!form.title.trim()) salah.title = 'Judul tugas wajib diisi.'
    if (!form.description.trim()) salah.description = 'Deskripsi tugas wajib diisi.'
    if (!form.deadline) salah.deadline = 'Deadline wajib ditentukan.'
    setError(salah)
    if (Object.keys(salah).length > 0) return
    onSimpan({
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      deadline: form.deadline,
    })
  }

  return (
    <Modal
      judul={tugas ? 'Update Todo' : 'Tambah Todo'}
      subjudul={tugas ? 'Ubah informasi tugas.' : 'Isi data tugas baru.'}
      onTutup={onTutup}
    >
      <form className="form" onSubmit={kirim} noValidate>
        <label>
          Judul
          <input value={form.title} onChange={(e) => ubah('title', e.target.value)} autoFocus />
          {error.title && <span className="error">{error.title}</span>}
        </label>
        <label>
          Deskripsi
          <textarea
            rows="3"
            value={form.description}
            onChange={(e) => ubah('description', e.target.value)}
          />
          {error.description && <span className="error">{error.description}</span>}
        </label>
        <div className="baris">
          <label>
            Status
            <select value={form.status} onChange={(e) => ubah('status', e.target.value)}>
              {opsiStatus.map((s) => (
                <option key={s} value={s}>{labelStatus[s]}</option>
              ))}
            </select>
          </label>
          <label>
            Prioritas
            <select value={form.priority} onChange={(e) => ubah('priority', e.target.value)}>
              {opsiPrioritas.map((p) => (
                <option key={p} value={p}>{labelPrioritas[p]}</option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Deadline
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => ubah('deadline', e.target.value)}
          />
          {error.deadline && <span className="error">{error.deadline}</span>}
        </label>
        <div className="aksi">
          <button type="button" className="btn merah" onClick={onTutup}>Batal</button>
          <button type="submit" className="btn biru">{tugas ? 'Update' : 'Tambah'}</button>
        </div>
      </form>
    </Modal>
  )
}

export default function App() {
  const [todos, setTodos] = useState(dataAwal)
  const [cari, setCari] = useState('')
  const [filter, setFilter] = useState('all')
  const [formBuka, setFormBuka] = useState(false)
  const [diedit, setDiedit] = useState(null)
  const [dihapus, setDihapus] = useState(null)
  const [detailId, setDetailId] = useState(null)
  const [toast, setToast] = useState(null)

  const detail = todos.find((t) => t.id === detailId)

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(timer)
  }, [toast])

  const hasil = useMemo(() => {
    const kata = cari.toLowerCase()
    return todos.filter(
      (t) =>
        (filter === 'all' || t.status === filter) &&
        (t.title.toLowerCase().includes(kata) || t.description.toLowerCase().includes(kata)),
    )
  }, [todos, cari, filter])

  function bukaForm(tugas = null) {
    setDiedit(tugas)
    setFormBuka(true)
  }

  function tutupForm() {
    setFormBuka(false)
    setDiedit(null)
  }

  function simpan(data) {
    if (diedit) {
      setTodos(todos.map((t) => (t.id === diedit.id ? { ...t, ...data } : t)))
      setToast({ teks: `Tugas "${data.title}" berhasil diperbarui.`, jenis: 'ok' })
    } else {
      const id = Math.max(0, ...todos.map((t) => t.id)) + 1
      setTodos([{ ...data, id }, ...todos])
      setToast({ teks: `Tugas "${data.title}" berhasil ditambahkan.`, jenis: 'ok' })
    }
    tutupForm()
  }

  function hapus() {
    setTodos(todos.filter((t) => t.id !== dihapus.id))
    setToast({ teks: `Tugas "${dihapus.title}" berhasil dihapus.`, jenis: 'hapus' })
    setDihapus(null)
    setDetailId(null)
  }

  return (
    <div className="halaman">
      <div className="header">
        <div>
          <h1>Todo List</h1>
          <p>Kelola daftar tugas harianmu dalam satu tempat.</p>
        </div>
        {!detail && (
          <button className="btn biru" onClick={() => bukaForm()}>
            + Tambah Todo
          </button>
        )}
      </div>

      {detail ? (
        <div className="card detail">
          <button className="kembali" onClick={() => setDetailId(null)}>← Kembali</button>
          <span className="kode">TUGAS #{detail.id}</span>
          <h2>{detail.title}</h2>
          <div className="detail-isi">
            <div>
              <h3>Deskripsi</h3>
              <p>{detail.description}</p>
            </div>
            <div className="detail-meta">
              <div>
                <span>Status</span>
                <strong className={`badge ${detail.status.replace(' ', '-')}`}>
                  {labelStatus[detail.status]}
                </strong>
              </div>
              <div>
                <span>Prioritas</span>
                <strong className={`badge ${detail.priority}`}>
                  {labelPrioritas[detail.priority]}
                </strong>
              </div>
              <div>
                <span>Deadline</span>
                <strong className={cekTerlambat(detail) ? 'tanggal lewat' : 'tanggal'}>
                  {formatTanggal(detail.deadline)}
                </strong>
              </div>
            </div>
          </div>
          <div className="aksi">
            <button className="btn merah" onClick={() => setDetailId(null)}>Kembali</button>
            <button className="btn biru" onClick={() => bukaForm(detail)}>Update</button>
          </div>
        </div>
      ) : (
        <>
          <div className="statistik">
            <div className="card"><span>Total Tugas</span><strong>{todos.length}</strong></div>
            <div className="card">
              <span>To Do</span>
              <strong>{todos.filter((t) => t.status === 'to-do').length}</strong>
            </div>
            <div className="card">
              <span>In Progress</span>
              <strong>{todos.filter((t) => t.status === 'in progress').length}</strong>
            </div>
            <div className="card">
              <span>Selesai</span>
              <strong>{todos.filter((t) => t.status === 'done').length}</strong>
            </div>
          </div>

          <div className="card">
            <div className="toolbar">
              <input
                type="search"
                placeholder="Cari tugas..."
                value={cari}
                onChange={(e) => setCari(e.target.value)}
              />
              <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                <option value="all">Semua Status</option>
                {opsiStatus.map((s) => (
                  <option key={s} value={s}>{labelStatus[s]}</option>
                ))}
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Judul</th>
                  <th>Status</th>
                  <th>Prioritas</th>
                  <th>Deadline</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {hasil.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <b>{t.title}</b>
                      <small>{t.description}</small>
                    </td>
                    <td>
                      <span className={`badge ${t.status.replace(' ', '-')}`}>
                        {labelStatus[t.status]}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority}`}>{labelPrioritas[t.priority]}</span>
                    </td>
                    <td className={cekTerlambat(t) ? 'tanggal lewat' : 'tanggal'}>
                      {formatTanggal(t.deadline)}
                    </td>
                    <td>
                      <button className="ikon biru" onClick={() => setDetailId(t.id)}>
                        Detail
                      </button>
                      <button className="ikon merah" onClick={() => setDihapus(t)}>
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {hasil.length === 0 && <p className="kosong">Belum ada tugas yang cocok.</p>}
            <p className="footer">
              Menampilkan {hasil.length} dari {todos.length} tugas
            </p>
          </div>
        </>
      )}

      {formBuka && (
        <FormTugas tugas={diedit} onTutup={tutupForm} onSimpan={simpan} />
      )}

      {dihapus && (
        <Modal
          judul="Hapus Tugas"
          subjudul="Tindakan ini tidak dapat dibatalkan."
          onTutup={() => setDihapus(null)}
        >
          <p className="konfirmasi">
            Yakin ingin menghapus tugas <b>{dihapus.title}</b>?
          </p>
          <div className="aksi">
            <button className="btn merah" onClick={() => setDihapus(null)}>Batal</button>
            <button className="btn biru" onClick={hapus}>Ya, Hapus</button>
          </div>
        </Modal>
      )}

      {toast && (
        <div className={`toast ${toast.jenis}`}>
          {toast.teks}
          <button onClick={() => setToast(null)}>×</button>
        </div>
      )}
    </div>
  )
}
