export interface FileStat {
  fileExtension: string;
  count: number;
  level: number;
  xp: number;
  xpForNextLevel: number;
}

// XP required to reach a given level: each level costs 10% more than the previous
// level 1 = 100, level 2 = 110, level 3 = 121, ...
export function getLevelFromCount(count: number): Pick<FileStat, "level" | "xp" | "xpForNextLevel"> {
  let nextLevelXp = 100;
  let remaining = count;
  let level = 0;

  while (remaining >= nextLevelXp) {
    remaining -= nextLevelXp;
    nextLevelXp = Number((nextLevelXp + nextLevelXp / 10).toFixed(0));
    level++;
  }

  return {
    level,
    xp: remaining,
    xpForNextLevel: nextLevelXp,
  };
}
