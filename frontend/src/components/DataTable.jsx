import EditableCell from "./EditableCell";
import { Card, EmptyState, Badge } from "../ui";

/**
 * @param {{
 *   items: Array<import('../lib/api').Item>;
 *   onUpdate: (id: number, field: string, value: string) => void;
 *   onDelete: (id: number) => void;
 *   loading?: boolean;
 * }} props
 */
export default function DataTable({ items, onUpdate, onDelete, loading = false }) {
  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No items found"
        description="Try adjusting your search or add new items through the Scan page."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50/80">
            <tr className="text-left text-[11px] font-black text-gray-500 uppercase tracking-wider">
              <th className="px-5 py-4">QR Code</th>
              <th className="px-5 py-4">Name</th>
              <th className="px-5 py-4">Description</th>
              <th className="px-5 py-4">Extra Info</th>
              <th className="px-5 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                <EditableCell value={item.qr_code} onSave={(v) => onUpdate(item.id, "qr_code", v)} />
                <EditableCell value={item.name} onSave={(v) => onUpdate(item.id, "name", v)} />
                <EditableCell value={item.description} onSave={(v) => onUpdate(item.id, "description", v)} />
                <EditableCell value={item.extra_info} onSave={(v) => onUpdate(item.id, "extra_info", v)} />
                <td className="px-5 py-4 text-center">
                  <button
                    onClick={() => {
                      if (window.confirm("Delete this item?")) onDelete(item.id);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        <Badge variant="blue">Double-click a cell to edit</Badge>
      </div>
    </Card>
  );
}
