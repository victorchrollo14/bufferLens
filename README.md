# Buffer Switcher

A LazyVim-style buffer switcher for VS Code. Quickly switch between recently opened files in your workspace using `Ctrl+7`.

## Features

- **Fast Buffer Switching**: Press `Ctrl+7` (or `Cmd+7` on Mac) to open the buffer picker
- **MRU Ordering**: Files are sorted by most recently used
- **Fuzzy Search**: Search by file name or path
- **Open Tab Indicators**: See which files are currently open in tabs
- **Workspace-Specific History**: Each workspace maintains its own buffer history

## Usage

- Press `Ctrl+7` (or `Cmd+7` on Mac)
- Start typing to filter buffers
- Use arrow keys to navigate
- Press `Enter` to open the selected file

## Keybinding

The default keybinding is `Ctrl+7`. You can customize it in your `keybindings.json`:

```json
{
  "key": "ctrl+7",
  "command": "bufferSwitcher.showBuffers"
}
```

## Development

```bash
# Install dependencies
npm install

# Compile
npm run compile

# Watch mode
npm run watch
```

## License

MIT
