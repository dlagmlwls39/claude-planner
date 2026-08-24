const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 헷갈리는 0,O,1,I 제외

export function generateFriendCode(): string {
  let code = "";
  const bytes = crypto.getRandomValues(new Uint32Array(6));
  for (let i = 0; i < 6; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}
