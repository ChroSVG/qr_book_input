import { Card } from "../ui";
import { BIBLIO_COLUMNS } from "./DataTable";

/**
 * Table skeleton with shimmer animation.
 * Replaces spinner during loading to prevent layout shift.
 * Uses the same column widths as the real DataTable.
 * @param {{ rows?: number }} props
 */
export default function TableSkeleton({ rows = 5 }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto max-h-[70vh]">
        <table className="min-w-full divide-y divide-gray-100 table-fixed">
          <colgroup>
            {BIBLIO_COLUMNS.map((col) => (
              <col key={col.key} style={{ width: col.w }} />
            ))}
            <col style={{ width: 64 }} />
          </colgroup>

          <thead className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur-sm">
            <tr>
              {BIBLIO_COLUMNS.map((col) => (
                <th key={col.key} className="px-2 py-3 whitespace-nowrap border-b border-gray-200">
                  <div className="h-3 bg-gray-200 rounded animate-pulse" style={{ width: col.w * 0.4 }} />
                </th>
              ))}
              <th className="px-2 py-3 whitespace-nowrap border-b border-gray-200">
                <div className="h-3 bg-gray-200 rounded animate-pulse mx-auto" style={{ width: 32 }} />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {Array.from({ length: rows }).map((_, ri) => (
              <tr key={ri}>
                {BIBLIO_COLUMNS.map((col, ci) => (
                  <td key={ci} className="px-2 py-3 whitespace-nowrap">
                    <div
                      className="h-4 bg-gray-200 rounded animate-pulse"
                      style={{
                        width: `${30 + ((ri * 7 + ci * 13) % 60)}%`,
                        animationDelay: `${(ri * BIBLIO_COLUMNS.length + ci) * 50}ms`,
                      }}
                    />
                  </td>
                ))}
                <td className="px-2 py-3 whitespace-nowrap">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto" style={{ width: 24 }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
