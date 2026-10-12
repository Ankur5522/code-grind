export const getLevelFromCount = (totalXp?: number | null) => {
  if (!totalXp || totalXp <= 0) {
    return {
      currentLevel: 0,
      xpOnCurrentLevel: 0,
      xpForNextLevel: 100,
      neededXpForNextLevel: 100,
      progressPercent: "0.00",
      needPercentageToNextLevel: "100.00",
    };
  }

  // 1 lvl = 0-100
  // 2 lvl = 101-110
  // 3 lvl = 111-121
  // for 4 lvl need 133

  let xpForNextLevel = 100;

  let currentLevel = 0;
  let totalUserXp = totalXp;

  for (let i = 0; xpForNextLevel <= totalUserXp; i++) {
    totalUserXp = totalUserXp - xpForNextLevel;

    xpForNextLevel = Number(
      (xpForNextLevel + xpForNextLevel / 10).toFixed(0),
    );

    currentLevel = i + 1;
  }

  const xpOnCurrentLevel = totalUserXp;

  const neededXpForNextLevel = xpForNextLevel - xpOnCurrentLevel;

  const progressPercent = (
    (xpOnCurrentLevel * 100) /
    xpForNextLevel
  ).toFixed(2);

  const needPercentageToNextLevel = (
    100 - Number(progressPercent)
  ).toFixed(2);

  return {
    currentLevel,
    xpOnCurrentLevel,
    xpForNextLevel,
    neededXpForNextLevel,
    progressPercent,
    needPercentageToNextLevel,
  };
};
