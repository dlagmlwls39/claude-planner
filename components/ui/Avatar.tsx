type AvatarProps = {
  url?: string | null;
  color: string;
  nickname?: string;
  className?: string;
};

// 사진(avatar_url)이 있으면 이미지, 없으면 색상 원 + 이니셜.
export function Avatar({ url, color, nickname, className = "w-9 h-9" }: AvatarProps) {
  const initial = nickname?.trim()?.[0] ?? "";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={nickname ?? "프로필 사진"}
        className={`${className} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <span
      className={`${className} flex items-center justify-center rounded-full font-semibold text-white/90 ring-2 ring-white shadow-sm`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </span>
  );
}
