export type Profile = {
  id: string;
  nickname: string;
  friend_code: string;
  avatar_color: string;
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
