import * as vscode from 'vscode';
import { BufferEntry, BufferState } from './types';

const MAX_RECENT_FILES = 50;
const STATE_KEY = 'bufferSwitcher.state';

/**
 * Manages buffer tracking and history for the workspace
 */
export class BufferManager {
  private context: vscode.ExtensionContext;
  private state: BufferState;
  private disposables: vscode.Disposable[] = [];

  constructor(context: vscode.ExtensionContext) {
    this.context = context;
    this.state = this.loadState();
    this.setupEventListeners();
    
    // Track the current active file on startup
    if (vscode.window.activeTextEditor) {
      this.trackFile(vscode.window.activeTextEditor.document.uri);
    }
  }

  /**
   * Load persisted state from workspace storage
   */
  private loadState(): BufferState {
    const saved = this.context.workspaceState.get<BufferState>(STATE_KEY);
    if (saved) {
      return saved;
    }
    return {
      recentFiles: [],
      accessTimes: {}
    };
  }

  /**
   * Persist state to workspace storage
   */
  private async saveState(): Promise<void> {
    await this.context.workspaceState.update(STATE_KEY, this.state);
  }

  /**
   * Set up VS Code event listeners to track file access
   */
  private setupEventListeners(): void {
    // Track when user switches to a different editor
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.trackFile(editor.document.uri);
        }
      })
    );

    // Track when a document is opened
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((document) => {
        this.trackFile(document.uri);
      })
    );

    // Remove from history when a file is deleted
    this.disposables.push(
      vscode.workspace.onDidDeleteFiles((event) => {
        for (const uri of event.files) {
          this.removeFile(uri);
        }
      })
    );
  }

  /**
   * Track a file access
   */
  private trackFile(uri: vscode.Uri): void {
    // Only track file:// scheme (not untitled, git, etc.)
    if (uri.scheme !== 'file') {
      return;
    }

    const relativePath = this.getRelativePath(uri);
    if (!relativePath) {
      return;
    }

    // Update access time
    this.state.accessTimes[relativePath] = Date.now();

    // Update recent files list (move to front if exists, or add)
    const existingIndex = this.state.recentFiles.indexOf(relativePath);
    if (existingIndex !== -1) {
      this.state.recentFiles.splice(existingIndex, 1);
    }
    this.state.recentFiles.unshift(relativePath);

    // Trim to max size
    if (this.state.recentFiles.length > MAX_RECENT_FILES) {
      const removed = this.state.recentFiles.splice(MAX_RECENT_FILES);
      for (const path of removed) {
        delete this.state.accessTimes[path];
      }
    }

    this.saveState();
  }

  /**
   * Remove a file from tracking
   */
  private removeFile(uri: vscode.Uri): void {
    const relativePath = this.getRelativePath(uri);
    if (!relativePath) {
      return;
    }

    const index = this.state.recentFiles.indexOf(relativePath);
    if (index !== -1) {
      this.state.recentFiles.splice(index, 1);
      delete this.state.accessTimes[relativePath];
      this.saveState();
    }
  }

  /**
   * Get relative path from workspace root
   */
  private getRelativePath(uri: vscode.Uri): string | null {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(uri);
    if (!workspaceFolder) {
      return null;
    }
    return vscode.workspace.asRelativePath(uri, false);
  }

  /**
   * Get all buffer entries for the quick picker
   * Returns entries sorted by most recently used
   */
  public getBufferEntries(): BufferEntry[] {
    const openTabs = this.getOpenTabs();
    const entries: BufferEntry[] = [];

    // First, add all recent files that still exist
    for (const relativePath of this.state.recentFiles) {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        continue;
      }

      const absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, relativePath).fsPath;
      const fileName = relativePath.split('/').pop() || relativePath;
      
      entries.push({
        absolutePath,
        relativePath,
        fileName,
        lastAccessed: this.state.accessTimes[relativePath] || 0,
        isOpen: openTabs.has(relativePath)
      });
    }

    // Add any open tabs that aren't in recent files
    for (const tabPath of openTabs) {
      if (!this.state.recentFiles.includes(tabPath)) {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          continue;
        }

        const absolutePath = vscode.Uri.joinPath(workspaceFolder.uri, tabPath).fsPath;
        const fileName = tabPath.split('/').pop() || tabPath;
        
        entries.unshift({
          absolutePath,
          relativePath: tabPath,
          fileName,
          lastAccessed: Date.now(),
          isOpen: true
        });
      }
    }

    return entries;
  }

  /**
   * Get set of currently open tab relative paths
   */
  private getOpenTabs(): Set<string> {
    const openTabs = new Set<string>();
    
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        if (tab.input instanceof vscode.TabInputText) {
          const relativePath = this.getRelativePath(tab.input.uri);
          if (relativePath) {
            openTabs.add(relativePath);
          }
        }
      }
    }
    
    return openTabs;
  }

  /**
   * Dispose of event listeners
   */
  public dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.disposables = [];
  }
}
