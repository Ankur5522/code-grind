export interface FileStat {
  fileExtension: string;
  count: number;
  level: number;
  xp: number;
  xpForNextLevel: number;
}

// XP required to reach a given level: level^2 * 500
export function getLevelFromCount(count: number): Pick<FileStat, "level" | "xp" | "xpForNextLevel"> {
  const level = Math.floor(Math.sqrt(count / 500));
  const xpForCurrentLevel = level * level * 500;
  const xpForNextLevel = (level + 1) * (level + 1) * 500;

  return {
    level,
    xp: count - xpForCurrentLevel,
    xpForNextLevel: xpForNextLevel - xpForCurrentLevel,
  };
}
