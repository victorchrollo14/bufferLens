import * as vscode from 'vscode';
import { BufferManager } from './bufferManager';
import { BufferEntry } from './types';

/**
 * Quick picker item for buffer selection
 */
interface BufferQuickPickItem extends vscode.QuickPickItem {
  bufferEntry: BufferEntry;
}

/**
 * Shows the buffer switcher quick pick UI
 */
export async function showBufferPicker(bufferManager: BufferManager): Promise<void> {
  const entries = bufferManager.getBufferEntries();

  if (entries.length === 0) {
    vscode.window.showInformationMessage('No recent buffers found');
    return;
  }

  // Create quick pick items
  const items: BufferQuickPickItem[] = entries.map((entry) => {
    // Add indicator for currently open files
    const openIndicator = entry.isOpen ? '$(circle-filled) ' : '$(circle-outline) ';
    
    return {
      label: `${openIndicator}${entry.fileName}`,
      description: entry.relativePath,
      bufferEntry: entry
    };
  });

  // Show the quick pick
  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Search buffers...',
    matchOnDescription: true, // Allow matching on file path too
  });

  if (selected) {
    // Open the selected file
    const uri = vscode.Uri.file(selected.bufferEntry.absolutePath);
    const document = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(document);
  }
}
