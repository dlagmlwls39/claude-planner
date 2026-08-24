"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, FriendsIcon, CheckIcon, UserIcon } from "./icons";

const TABS = [
  { href: "/calendar", label: "캘린더", Icon: CalendarIcon },
  { href: "/friends", label: "친구", Icon: FriendsIcon },
  { href: "/todos", label: "할 일", Icon: CheckIcon },
  { href: "/profile", label: "내정보", Icon: UserIcon },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed bottom-0 inset-x-0 mx-auto w-full max-w-[480px] flex rounded-t-3xl border-t border-line bg-white/85 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      style={{ boxShadow: "0 -6px 20px rgba(58,138,208,0.08)" }}
    >
      {TABS.map(({ href, label, Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center gap-1 pt-2.5 pb-2 text-[11px] transition-colors ${
              active ? "text-brand-dark font-semibold" : "text-ink/40"
            }`}
          >
            <span
              className={`flex h-8 w-12 items-center justify-center rounded-full transition-colors ${
                active ? "bg-brand-soft" : "bg-transparent"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
