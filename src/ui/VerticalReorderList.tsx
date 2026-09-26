import { Reorder, useDragControls } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { DragHandleProps } from "./DragHandle";

export type VerticalReorderRenderContext = {
  dragHandleProps: DragHandleProps | null;
  index: number;
};

type VerticalReorderListProps<T> = {
  items: T[];
  getKey: (item: T) => string;
  disabled?: boolean;
  onOrderCommit: (items: T[]) => void;
  renderItem: (item: T, context: VerticalReorderRenderContext) => ReactNode;
  className?: string;
  itemClassName?: string;
};

export function VerticalReorderList<T>({
  items,
  getKey,
  disabled = false,
  onOrderCommit,
  renderItem,
  className,
  itemClassName,
}: VerticalReorderListProps<T>) {
  const [order, setOrder] = useState(items);
  const serverKeys = useMemo(() => items.map(getKey).join("|"), [items, getKey]);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const pendingKeysRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingKeysRef.current) {
      if (serverKeys === pendingKeysRef.current) {
        pendingKeysRef.current = null;
        setOrder(itemsRef.current);
      }
      return;
    }
    setOrder(itemsRef.current);
  }, [serverKeys]);

  function commitOrder(next: T[]) {
    const nextKeys = next.map(getKey).join("|");
    if (nextKeys === serverKeys) return;
    pendingKeysRef.current = nextKeys;
    onOrderCommit(next);
  }

  if (disabled) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={getKey(item)} className={itemClassName}>
            {renderItem(item, { dragHandleProps: null, index })}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={order}
      onReorder={setOrder}
      className={className}
    >
      {order.map((item, index) => (
        <ReorderableRow
          key={getKey(item)}
          item={item}
          index={index}
          className={itemClassName}
          order={order}
          getKey={getKey}
          serverKeys={serverKeys}
          onCommit={commitOrder}
          renderItem={renderItem}
        />
      ))}
    </Reorder.Group>
  );
}

function ReorderableRow<T>({
  item,
  index,
  className,
  order,
  getKey,
  serverKeys,
  onCommit,
  renderItem,
}: {
  item: T;
  index: number;
  className?: string;
  order: T[];
  getKey: (item: T) => string;
  serverKeys: string;
  onCommit: (order: T[]) => void;
  renderItem: (item: T, context: VerticalReorderRenderContext) => ReactNode;
}) {
  const controls = useDragControls();
  const orderRef = useRef(order);
  orderRef.current = order;

  return (
    <Reorder.Item
      value={item}
      dragListener={false}
      dragControls={controls}
      className={className}
      onDragEnd={() => {
        const nextKeys = orderRef.current.map(getKey).join("|");
        if (nextKeys === serverKeys) return;
        onCommit(orderRef.current);
      }}
    >
      {renderItem(item, {
        index,
        dragHandleProps: {
          onPointerDown: (event) => {
            event.preventDefault();
            controls.start(event);
          },
        },
      })}
    </Reorder.Item>
  );
}
