import * as vscode from 'vscode';
import { BufferManager } from './bufferManager';
import { showBufferPicker } from './quickPicker';

let bufferManager: BufferManager | undefined;

/**
 * Extension activation - called when the extension is activated
 */
export function activate(context: vscode.ExtensionContext): void {

  // Initialize the buffer manager
  bufferManager = new BufferManager(context);

  // Register the show buffers command
  const showBuffersCommand = vscode.commands.registerCommand(
    'bufferSwitcher.showBuffers',
    async () => {
      if (bufferManager) {
        await showBufferPicker(bufferManager);
      }
    }
  );

  context.subscriptions.push(showBuffersCommand);
  context.subscriptions.push({
    dispose: () => {
      if (bufferManager) {
        bufferManager.dispose();
        bufferManager = undefined;
      }
    }
  });
}

/**
 * Extension deactivation - called when the extension is deactivated
 */
export function deactivate(): void {
  if (bufferManager) {
    bufferManager.dispose();
    bufferManager = undefined;
  }
}
