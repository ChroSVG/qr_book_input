import EditableCell from "./EditableCell";

export default function DataTable({ items, onUpdate, onDelete }) {
  if (!items || items.length === 0) return (
    <div className="p-10 text-center bg-white rounded-xl border-2 border-dashed text-gray-400">
      Tidak ada data yang ditampilkan.
    </div>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
      <table className="min-w-full divide-y divide-gray-100">
        {/* // Fokus pada header dan row di DataTable.jsx */}
<thead className="bg-gray-50/80">
  <tr className="text-left text-[11px] font-black text-gray-500 uppercase tracking-[0.15em]">
    <th className="p-5 border-b border-gray-100">Kode QR</th>
    <th className="p-5 border-b border-gray-100">Nama Barang</th>
    <th className="p-5 border-b border-gray-100">Deskripsi</th>
    <th className="p-5 border-b border-gray-100">Informasi</th>
    <th className="p-5 border-b border-gray-100 text-center">Aksi</th>
  </tr>
</thead>
        <tbody className="divide-y divide-gray-50">
          {items.map(it => (
            <tr key={it.id} className="hover:bg-blue-50/20 transition-colors">
              <EditableCell value={it.qr_code} onSave={(v) => onUpdate(it.id, "qr_code", v)} />
              <EditableCell value={it.name} onSave={(v) => onUpdate(it.id, "name", v)} />
              <EditableCell value={it.description} onSave={(v) => onUpdate(it.id, "description", v)} />
              <EditableCell value={it.extra_info} onSave={(v) => onUpdate(it.id, "extra_info", v)} />
              <td className="p-4 text-center">
                <button 
                  onClick={() => { if(confirm('Hapus item ini?')) onDelete(it.id) }} 
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}