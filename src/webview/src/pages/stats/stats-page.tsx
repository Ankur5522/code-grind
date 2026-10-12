import { useState, useEffect } from "react";

import type { FileStat } from "@core/types";

import { getLevelFromCount } from "./lib/get-level-from-count";

import * as s from "./stats-page.module.scss";

declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
};

const vscode =
  typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

export const StatsPage = () => {
  const [stats, setStats] = useState<FileStat[]>([]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "UPDATE_STATS") {
        setStats(message.stats);
      }
    };

    window.addEventListener("message", handleMessage);

    vscode?.postMessage({ type: "READY" });

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <div className={s.container}>
      <h1 className={s.title}>Code Grind Stats</h1>

      {stats.length === 0 ? (
        <p className={s.empty}>Start typing in some file...</p>
      ) : (
        <div className={s.statList}>
          {stats.map(statItem => {
            const {
              currentLevel,
              xpForNextLevel,
              xpOnCurrentLevel,
              progressPercent,
            } = getLevelFromCount(statItem.xp);

            return (
              <div
                className={s.statCard}
                key={statItem.fileExtension}
              >
                <div className={s.statCard__header}>
                  <span className={s.statCard__extension}>
                    {statItem.fileExtension}
                  </span>
                  <span className={s.statCard__level}>
                    LVL {currentLevel}
                  </span>
                </div>

                <div className={s.statCard__barTrack}>
                  <div
                    className={s.statCard__barFill}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                <div className={s.statCard__footer}>
                  <span>{statItem.characters} chars</span>

                  <span>
                    {xpOnCurrentLevel} / {xpForNextLevel} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
