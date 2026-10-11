import * as vscode from "vscode";

import type { FileStat } from "@core/types";
import { getLevelFromCount } from "@core/types";

export class SidebarProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "codegrind.sidebarView";
  private _view?: vscode.WebviewView;
  private _fileLengthCache = new Map<string, number>();

  private static readonly STORAGE_KEY = "codeGrindStats";

  constructor(private readonly _context: vscode.ExtensionContext) {
    vscode.workspace.onDidSaveTextDocument((document) => {
      this._handleDocumentSave(document);
    });

    vscode.window.onDidChangeWindowState((windowState) => {
      if (windowState.focused) {
        this._sendStatsToWebview();
      }
    });
  }

  private _handleDocumentSave(document: vscode.TextDocument) {
    if (document.uri.scheme !== "file") {
      return;
    }

    if (document.fileName.includes("/.git/")) {
      return;
    }

    const fullPath = document.fileName;
    const fileName = fullPath.split("/").pop()!;
    const fileExtensionsArr = fileName.split(".").slice(1);

    if (fileExtensionsArr.length === 0) {
      return;
    }

    const fileExtension = `.${fileExtensionsArr.join(".")}`;
    const currentLength = document.getText().length;
    const previousLength = this._fileLengthCache.get(fullPath);

    // baseline the file on first save, no XP awarded
    if (previousLength === undefined) {
      this._fileLengthCache.set(fullPath, currentLength);
      return;
    }

    const delta = currentLength - previousLength;
    this._fileLengthCache.set(fullPath, currentLength);

    if (delta <= 0) {
      return;
    }

    const stats = this._context.globalState.get<Record<string, FileStat>>(
      SidebarProvider.STORAGE_KEY,
      {}
    );

    if (!stats[fileExtension]) {
      stats[fileExtension] = {
        fileExtension,
        count: 0,
        level: 0,
        xp: 0,
        xpForNextLevel: 100,
      };
    }

    stats[fileExtension].count += delta;

    const levelData = getLevelFromCount(stats[fileExtension].count);
    stats[fileExtension].level = levelData.level;
    stats[fileExtension].xp = levelData.xp;
    stats[fileExtension].xpForNextLevel = levelData.xpForNextLevel;

    this._context.globalState.update(SidebarProvider.STORAGE_KEY, stats);
    this._sendStatsToWebview();
  }

  private _sendStatsToWebview() {
    if (this._view) {
      const stats = this._context.globalState.get<Record<string, FileStat>>(
        SidebarProvider.STORAGE_KEY,
        {}
      );

      this._view.webview.postMessage({
        type: "UPDATE_STATS",
        stats: Object.values(stats),
      });
    }
  }

  // this method automaticly calls by vs code when sidebar revealing
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): Thenable<void> | void {
    this._view = webviewView;

    // confirm js scripts executing and give access only to dist folder;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this._context.extensionUri, "dist")],
    };

    // set HTML-markup for webview
    // webviewView.webview.html = this._get
    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.type === "READY") {
        this._sendStatsToWebview();
      }
    });
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    // Безпечне посилання на зібраний скрипт dist/webview.js
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "dist", "webview.js")
    );

    // Безпечне посилання на зібрані стилі dist/webview.css (esbuild генерує їх з SCSS)
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, "dist", "webview.css")
    );

    // Невеликий випадковий рядок для Content Security Policy (захист від XSS)
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <!-- Політика безпеки: дозволяємо виконувати тільки наш скрипт зі згенерованим nonce -->
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <link href="${styleUri}" rel="stylesheet">
        <title>CodeGrind XP</title>
      </head>
      <body>
        <!-- Сюди твій React монтуватиме додаток -->
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

// Функція для створення унікального токена nonce
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
