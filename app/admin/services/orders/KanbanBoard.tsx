//app/admin/services/orders/KanbanBoard.tsx
"use client";

import { useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/applicationSchema/utils";
import { updateOrderKanbanStatusAction } from "@/actions/admin/order-actions";

type Order = {
  id: string;
  status: string;
  updated_at?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
  services?: { name?: string | null } | null;
};

type ColumnId =
  | "draft"
  | "verification"
  | "payment"
  | "processing"
  | "final_review"
  | "completed";

const KANBAN_COLUMNS: Array<{ id: ColumnId; label: string }> = [
  { id: "draft", label: "Incoming / Draft" },
  { id: "verification", label: "Verifikasi Berkas" },
  { id: "payment", label: "Menunggu Pembayaran" },
  { id: "processing", label: "Proses Instansi" },
  { id: "final_review", label: "Final Review" },
  { id: "completed", label: "Selesai" },
];

function toColumnId(status: string): ColumnId {
  if (KANBAN_COLUMNS.some((col) => col.id === status)) return status as ColumnId;
  if (status === "pending") return "draft";
  if (status === "quoted") return "payment"; // Legacy mapping
  if (status === "paid") return "processing"; // Legacy mapping
  if (status === "process") return "processing"; // Legacy mapping
  if (status === "review") return "final_review"; // Legacy mapping
  return "draft";
}

function initBoard(orders: Order[]): Record<ColumnId, Order[]> {
  const board: Record<ColumnId, Order[]> = {
    draft: [],
    verification: [],
    payment: [],
    processing: [],
    final_review: [],
    completed: [],
  };
  for (const order of orders) {
    board[toColumnId(order.status)].push(order);
  }
  return board;
}

export function KanbanBoard({ initialOrders }: { initialOrders: Order[] }) {
  const [board, setBoard] = useState<Record<ColumnId, Order[]>>(() => initBoard(initialOrders));
  const [updatingCardId, setUpdatingCardId] = useState<string | null>(null);

  const totalCards = useMemo(
    () => Object.values(board).reduce((acc, list) => acc + list.length, 0),
    [board]
  );

  const onDragEnd = async (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    const sourceCol = source.droppableId as ColumnId;
    const destinationCol = destination.droppableId as ColumnId;

    const previous = board;
    const next: Record<ColumnId, Order[]> = {
      ...board,
      [sourceCol]: [...board[sourceCol]],
      [destinationCol]: [...board[destinationCol]],
    };

    const [moved] = next[sourceCol].splice(source.index, 1);
    if (!moved) return;
    next[destinationCol].splice(destination.index, 0, moved);
    setBoard(next);

    if (sourceCol !== destinationCol) {
      setUpdatingCardId(moved.id);
      const resultUpdate = await updateOrderKanbanStatusAction(moved.id, destinationCol);
      setUpdatingCardId(null);

      if (resultUpdate?.error) {
        setBoard(previous);
        toast.error(`Gagal update status: ${resultUpdate.error}`);
      } else {
        toast.success("Status order berhasil diperbarui.");
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-black text-slate-800">Kanban Order Management</h2>
        <Badge variant="outline" className="font-bold">
          {totalCards} orders
        </Badge>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {KANBAN_COLUMNS.map((column) => (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided, snapshot) => (
                <Card
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "border-slate-200 min-h-[240px] transition-colors",
                    snapshot.isDraggingOver && "bg-blue-50/40 border-blue-300"
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span>{column.label}</span>
                      <Badge variant="secondary">{board[column.id].length}</Badge>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {board[column.id].map((order, index) => (
                      <Draggable draggableId={order.id} index={index} key={order.id}>
                        {(dragProvided, dragSnapshot) => (
                          <Link href={`/admin/services/orders/${order.id}`}>
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                "rounded-xl border border-slate-200 bg-white p-3 shadow-sm cursor-grab active:cursor-grabbing",
                                dragSnapshot.isDragging && "ring-2 ring-blue-400 shadow-md"
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-bold text-slate-800 truncate">
                                  {order.profiles?.full_name || "Klien"}
                                </p>
                                {updatingCardId === order.id && (
                                  <Loader2 className="h-4 w-4 animate-spin text-blue-600 shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-slate-500 mt-1 truncate">
                                {order.services?.name || "Layanan"}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-2">
                                Update:{" "}
                                {new Date(order.updated_at || order.created_at).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </p>
                            </div>
                          </Link>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </CardContent>
                </Card>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}

