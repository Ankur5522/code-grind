import { useState, useEffect } from "react";

import type { FileStat } from "@core/types";

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
            const progress =
              (statItem.xp / statItem.xpForNextLevel) * 100;

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
                    LVL {statItem.level}
                  </span>
                </div>
                <div className={s.statCard__barTrack}>
                  <div
                    className={s.statCard__barFill}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className={s.statCard__footer}>
                  <span>
                    {statItem.xp} / {statItem.xpForNextLevel} XP
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
