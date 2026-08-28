import type { ReactNode } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";

export type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

export function DataTable<T extends Record<string, string | number>>({
  title,
  eyebrow,
  rows,
  columns
}: {
  title: string;
  eyebrow?: string;
  rows: T[];
  columns: Array<Column<T>>;
}) {
  return (
    <Card>
      <CardHeader eyebrow={eyebrow} title={title} />
      <CardBody className="p-0">
        <div className="scrollbar-thin overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="sticky top-0 bg-white">
              <tr>
                {columns.map((column) => (
                  <th
                    key={String(column.key)}
                    className="border-b border-line px-4 py-3 font-semibold text-muted"
                    scope="col"
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex} className="odd:bg-canvas/40">
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <td key={String(column.key)} className="whitespace-nowrap px-4 py-3 text-ink">
                        {column.render ? column.render(value, row) : value}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}
