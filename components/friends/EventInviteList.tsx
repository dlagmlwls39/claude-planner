"use client";
import { useCallback, useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/client";
import {
  listIncomingEventInvites,
  acceptEventInvite,
  declineEventInvite,
  type IncomingEventInvite,
} from "@/lib/supabase/event-invites";
import { Avatar } from "@/components/ui/Avatar";

export function EventInviteList() {
  const supabase = createBrowserSupabase();
  const [invites, setInvites] = useState<IncomingEventInvite[]>([]);

  const reload = useCallback(() => {
    listIncomingEventInvites(supabase).then(setInvites).catch(console.error);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(reload, [reload]);

  if (invites.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-ink/70">받은 일정 초대</h2>
      {invites.map(({ inviteId, event, inviter }) => (
        <div key={inviteId} className="card flex items-center gap-3 p-3.5">
          <Avatar url={inviter.avatar_url} color={inviter.avatar_color} nickname={inviter.nickname} />
          <div className="flex-1">
            <p className="text-sm text-ink">
              <b>{inviter.nickname}</b> 님의 초대
            </p>
            <p className="text-sm font-medium text-ink">{event.title}</p>
            <p className="text-xs text-ink/45">
              {event.date}
              {!event.is_all_day && event.start_time ? ` ${event.start_time}` : ""}
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={async () => { await acceptEventInvite(supabase, inviteId); reload(); }}
              className="btn btn-primary px-3 py-1 text-sm"
            >
              수락
            </button>
            <button
              onClick={async () => { await declineEventInvite(supabase, inviteId); reload(); }}
              className="btn btn-ghost px-3 py-1 text-sm"
            >
              거절
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
