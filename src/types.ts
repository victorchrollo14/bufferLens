/**
 * Represents a buffer (file) entry in the switcher
 */
export interface BufferEntry {
  /** Absolute file path */
  absolutePath: string;
  
  /** Relative path from workspace root */
  relativePath: string;
  
  /** File name only */
  fileName: string;
  
  /** Last access timestamp */
  lastAccessed: number;
  
  /** Whether the file is currently open in a tab */
  isOpen: boolean;
}

/**
 * State structure for persisting buffer history
 */
export interface BufferState {
  /** List of recently accessed files (relative paths) */
  recentFiles: string[];
  
  /** Map of relative path to last access timestamp */
  accessTimes: Record<string, number>;
}
