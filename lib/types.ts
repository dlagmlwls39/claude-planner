export type Profile = {
  id: string;
  nickname: string;
  friend_code: string;
  avatar_color: string;
  avatar_url: string | null;
  created_at: string;
};

export type EventRow = {
  id: string;
  user_id: string;
  title: string;
  date: string;          // YYYY-MM-DD
  start_time: string | null;
  end_time: string | null;
  is_all_day: boolean;
  color: string;
  memo: string | null;
  is_public: boolean;
  created_at: string;
  is_shared?: boolean; // 조회 시 계산: 참여자가 있거나 내가 참여자인 공유 일정
};

export type TodoRow = {
  id: string;
  user_id: string;
  title: string;
  date: string | null;   // null이면 상시 투두
  is_done: boolean;
  created_at: string;
};

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: "pending" | "accepted";
  created_at: string;
};
