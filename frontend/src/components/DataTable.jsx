import { useMemo } from "react";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import EditableCell from "./EditableCell";
import { 
  Card, 
  EmptyState, 
  Badge, 
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "../ui";

/**
 * Biblio fields with explicit pixel widths.
 * Exported so TableSkeleton can reuse the same column config.
 */
export const BIBLIO_COLUMNS = [
  { key: "item_code", label: "Item Code", w: 200 },
  { key: "title", label: "Title", w: 200 },
  { key: "edition", label: "Edition", w: 200 },
  { key: "publisher_name", label: "Publisher", w: 200 },
  { key: "publish_year", label: "Year", w: 200 },
  { key: "call_number", label: "Call No.", w: 200 },
  { key: "language_name", label: "Language", w: 200 },
  { key: "place_name", label: "Place", w: 200 },
  { key: "classification", label: "Classification", w: 200 },
  { key: "authors", label: "Authors", w: 200 },
  { key: "topics", label: "Topics", w: 200 },
  { key: "volume", label: "Volume", w: 200 },
  { key: "description", label: "Description", w: 200 },
  { key: "extra_info", label: "Extra Info", w: 200 },
];

const ACTIONS_W = 64;

/**
 * DataTable component using TanStack Table v8 and Shadcn UI primitives.
 * 
 * @param {{
 *   items: Array<any>;
 *   onUpdate: (id: number, field: string, value: string) => void;
 *   onDelete: (id: number) => void;
 *   onClearSearch?: () => void;
 * }} props
 */
export default function DataTable({ items, onUpdate, onDelete, onClearSearch }) {
  const columns = useMemo(() => [
    ...BIBLIO_COLUMNS.map(col => ({
      accessorKey: col.key,
      header: col.label,
      size: col.w,
      cell: ({ getValue, row }) => (
        <EditableCell
          value={getValue()}
          onSave={(v) => onUpdate(row.original.id, col.key, v)}
          width={col.w}
        />
      ),
    })),
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      size: ACTIONS_W,
      cell: ({ row }) => (
        <div className="text-center">
          <button
            onClick={() => {
              if (window.confirm("Delete this item?")) onDelete(row.original.id);
            }}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      ),
    }
  ], [onUpdate, onDelete]);

  const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
    defaultColumn: {
      minSize: 50,
      maxSize: 500,
    },
  });

  if (!items || items.length === 0) {
    return (
      <EmptyState
        title="No items found"
        description="Try adjusting your search or add new items through the Scan page."
        action={onClearSearch && (
          <Button variant="outline" size="sm" onClick={onClearSearch}>
            Clear Search
          </Button>
        )}
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <Table className="table-fixed">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    style={{ width: header.column.columnDef.size }}
                    className="whitespace-nowrap border-b border-gray-200"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="divide-y divide-gray-50">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell 
                    key={cell.id} 
                    style={{ width: cell.column.columnDef.size }}
                    className="whitespace-nowrap"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-500">{items.length} item{items.length !== 1 ? "s" : ""}</span>
        <Badge variant="blue">Double-click a cell to edit</Badge>
      </div>
    </Card>
  );
}
