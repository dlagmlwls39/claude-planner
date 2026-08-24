"use client";
export function BottomSheet({
  open, onClose, children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 mx-auto max-w-[480px]">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-white p-5 max-h-[80vh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
