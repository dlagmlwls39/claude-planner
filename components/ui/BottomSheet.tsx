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
      <div className="absolute inset-0 bg-ink/25 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 rounded-t-3xl bg-white px-5 pb-6 pt-3 max-h-[80vh] overflow-y-auto shadow-[0_-8px_30px_rgba(58,138,208,0.15)]">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        {children}
      </div>
    </div>
  );
}
