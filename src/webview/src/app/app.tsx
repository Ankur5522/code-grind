import { useState, useEffect } from "react";

import type { FileStat } from "@core/types";
import "./app.module.scss";

declare function acquireVsCodeApi(): {
  postMessage: (message: any) => void;
};

const vscode = typeof acquireVsCodeApi === "function" ? acquireVsCodeApi() : null;

export const App = () => {
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
    <div className="container">
      <h1 className="title">Code Grind Stats</h1>

      {stats.length === 0 ? (
        <p className="empty">Start typing in some file...</p>
      ) : (
        <div className="stat-list">
          {stats.map((statItem) => {
            const progress = (statItem.xp / statItem.xpForNextLevel) * 100;

            return (
              <div className="stat-card" key={statItem.fileExtension}>
                <div className="stat-card__header">
                  <span className="stat-card__extension">{statItem.fileExtension}</span>
                  <span className="stat-card__level">LVL {statItem.level}</span>
                </div>
                <div className="stat-card__bar-track">
                  <div className="stat-card__bar-fill" style={{ width: `${progress}%` }} />
                </div>
                <div className="stat-card__footer">
                  <span>{statItem.xp} / {statItem.xpForNextLevel} XP</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
