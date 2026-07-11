"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  horizontalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type Column,
} from "@tanstack/react-table";
import {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  sort?: string;
  sortDir?: "asc" | "desc";
  loading?: boolean;
  searchPlaceholder?: string;
  searchValue?: string;
  emptyMessage?: string;
  pageSizeOptions?: number[];
  toolbarRight?: ReactNode;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onSearchChange: (query: string) => void;
  onSortChange: (field: string | undefined, dir: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
}

function SortableHeader<T>({
  column,
  children,
  className,
  style,
  onClick,
  ...props
}: {
  column: Column<T>;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: (event: React.MouseEvent) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id });

  return (
    <th
      ref={setNodeRef}
      className={cn(
        "group px-4 py-3 text-left text-sm font-semibold text-muted-foreground tracking-wider",
        className,
      )}
      style={{
        ...style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...props}
    >
      <div className="flex items-center gap-1.5">
        <span
          {...listeners}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground"
        >
          <GripVertical size={16} />
        </span>
        <div className="flex items-center gap-1 select-none" onClick={onClick}>
          {children}
        </div>
      </div>
    </th>
  );
}

export function DataTable<T>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  sort: externalSort,
  sortDir: externalSortDir,
  loading,
  searchPlaceholder = "Search...",
  searchValue: externalSearchValue = "",
  emptyMessage = "No results found",
  pageSizeOptions = [10, 25, 50, 100],
  toolbarRight,
  onPageChange,
  onPageSizeChange,
  onSearchChange,
  onSortChange,
  onRowClick,
}: DataTableProps<T>) {
  const [searchInput, setSearchInput] = useState(externalSearchValue);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    setSearchInput(externalSearchValue);
  }, [externalSearchValue]);

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchInput(value);
      clearTimeout(searchTimeout.current);
      searchTimeout.current = setTimeout(() => onSearchChange(value), 300);
    },
    [onSearchChange],
  );

  const defaultOrder = useMemo(
    () => columns.map((c) => (c as unknown as { accessorKey?: string; id?: string }).accessorKey || (c as unknown as { accessorKey?: string; id?: string }).id || ""),
    [columns],
  );
  const [columnOrder, setColumnOrder] = useState<string[]>(defaultOrder);
  const [sorting, setSorting] = useState<SortingState>(
    externalSort
      ? [{ id: externalSort, desc: externalSortDir === "desc" }]
      : [],
  );

  useEffect(() => {
    setSorting(
      externalSort
        ? [{ id: externalSort, desc: externalSortDir === "desc" }]
        : [],
    );
  }, [externalSort, externalSortDir]);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const newState =
        typeof updater === "function" ? updater(sorting) : updater;
      setSorting(newState);
      if (newState.length > 0) {
        onSortChange(newState[0].id, newState[0].desc ? "desc" : "asc");
      } else {
        onSortChange(undefined, "asc");
      }
    },
    [sorting, onSortChange],
  );

  const table = useReactTable({
    columns,
    data,
    state: { sorting, columnOrder },
    onSortingChange: handleSortingChange,
    onColumnOrderChange: setColumnOrder,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = columnOrder.indexOf(active.id as string);
    const newIndex = columnOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    setColumnOrder(arrayMove(columnOrder, oldIndex, newIndex));
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const headerGroups = table.getHeaderGroups();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder={searchPlaceholder}
            value={searchInput}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        {toolbarRight}
      </div>

      <div className="rounded-xl border bg-card overflow-x-auto scrollbar-thin">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <table className="w-full" style={{ tableLayout: "fixed" }}>
            <thead>
              {headerGroups.map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b">
                  <SortableContext
                    items={columnOrder}
                    strategy={horizontalListSortingStrategy}
                  >
                    {headerGroup.headers.map((header) => {
                      if (header.isPlaceholder) return null;
                      const col = header.column;
                      const canSort = col.getCanSort();
                      const sorted = col.getIsSorted();
                      return (
                        <SortableHeader
                          key={header.id}
                          column={col}
                           className={cn(
                             (col.columnDef.meta as Record<string, string>)?.headerClassName,
                             (col.columnDef.meta as Record<string, string>)?.className,
                           )}
                          onClick={
                            canSort
                              ? (col.getToggleSortingHandler() as (
                                  e: React.MouseEvent,
                                ) => void)
                              : undefined
                          }
                          style={canSort ? { cursor: "pointer" } : undefined}
                        >
                          {flexRender(
                            col.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort && (
                            <span className="inline-flex flex-col leading-none -space-y-0.5 ml-1">
                              <ArrowUp
                                size={10}
                                className={cn(
                                  "text-muted-foreground/30",
                                  sorted === "asc" && "text-foreground",
                                )}
                              />
                              <ArrowDown
                                size={10}
                                className={cn(
                                  "text-muted-foreground/30",
                                  sorted === "desc" && "text-foreground",
                                )}
                              />
                            </span>
                          )}
                        </SortableHeader>
                      );
                    })}
                  </SortableContext>
                </tr>
              ))}
            </thead>
            <tbody className="divide-y">
              {loading ? (
                Array.from({ length: Math.min(pageSize, 10) }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                        <td
                          key={(col as unknown as { accessorKey?: string; id?: string }).accessorKey || (col as unknown as { accessorKey?: string; id?: string }).id || ""}
                          className="px-4 py-3"
                       >
                        <div
                          className="h-4 bg-muted rounded animate-pulse"
                          style={{ width: `${40 + Math.random() * 40}%` }}
                        />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-sm text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row.original)}
                    className={cn(
                      onRowClick &&
                        "cursor-pointer hover:bg-accent/50 transition-colors",
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const col = cell.column;
                      return (
                         <td
                         key={(col as unknown as { accessorKey?: string; id?: string }).accessorKey || (col as unknown as { accessorKey?: string; id?: string }).id || ""}
                           className={cn(
                             "px-4 py-3 text-sm",
                             (col.columnDef.meta as Record<string, string>)?.className,
                           )}
                         >
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-4 flex-shrink-0" />
                            {flexRender(col.columnDef.cell, cell.getContext())}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </DndContext>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-xs">Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="bg-transparent border rounded px-2 py-1 text-sm"
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm">
            {totalCount === 0
              ? "0 results"
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, totalCount)} of ${totalCount}`}
          </span>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              disabled={page >= pageCount}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
