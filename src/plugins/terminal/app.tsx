import { Component, createSignal, onMount, createEffect, For } from 'solid-js';
import './Terminal.css';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'success';
  content: string;
  timestamp: number;
}

const Terminal: Component = () => {
  const [history, setHistory] = createSignal<TerminalLine[]>([]);
  const [currentInput, setCurrentInput] = createSignal('');
  const [currentDirectory, setCurrentDirectory] = createSignal('~');
  const [commandHistory, setCommandHistory] = createSignal<string[]>([]);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  let terminalRef: HTMLDivElement;
  let inputRef: HTMLInputElement;

  // Initialize terminal with welcome message
  onMount(() => {
    const welcomeLines: TerminalLine[] = [
      {
        type: 'success',
        content: 'WebOS Terminal v1.0.0',
        timestamp: Date.now()
      },
      {
        type: 'output',
        content: 'Type "help" for available commands',
        timestamp: Date.now()
      },
      {
        type: 'output',
        content: '',
        timestamp: Date.now()
      }
    ];
    setHistory(welcomeLines);
    inputRef?.focus();
  });

  // Auto-scroll to bottom when history changes
  createEffect(() => {
    if (terminalRef) {
      terminalRef.scrollTop = terminalRef.scrollHeight;
    }
  });

  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    // Add command to history
    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);

    // Add input line to history
    const inputLine: TerminalLine = {
      type: 'input',
      content: `${currentDirectory()} $ ${command}`,
      timestamp: Date.now()
    };

    const outputLines = [inputLine];

    // Parse and execute command
    const [cmd, ...args] = command.trim().toLowerCase().split(' ');

    switch (cmd) {
      case 'help':
        outputLines.push({
          type: 'output',
          content: `Available commands:
  help     - Show this help message
  clear    - Clear terminal screen
  ls       - List directory contents
  cd       - Change directory
  pwd      - Print working directory
  mkdir    - Create directory
  touch    - Create file
  echo     - Display message
  date     - Show current date and time
  whoami   - Display current user
  uname    - Display system information
  cat      - Display file contents
  cal      - Display calendar
  neofetch - Display system information (stylized)`,
          timestamp: Date.now()
        });
        break;

      case 'clear':
        setHistory([]);
        setCurrentInput('');
        inputRef?.focus();
        return;

      case 'pwd':
        outputLines.push({
          type: 'output',
          content: `/home/user/${currentDirectory()}`,
          timestamp: Date.now()
        });
        break;

      case 'ls':
        const mockFiles = ['Documents', 'Downloads', 'Pictures', 'Music', 'Videos', 'readme.txt', 'config.json'];
        outputLines.push({
          type: 'output',
          content: mockFiles.join('  '),
          timestamp: Date.now()
        });
        break;

      case 'cd':
        if (args[0] === '..') {
          setCurrentDirectory('~');
        } else if (args[0] && args[0] !== '/') {
          setCurrentDirectory(args[0]);
        }
        break;

      case 'mkdir':
        if (args[0]) {
          outputLines.push({
            type: 'success',
            content: `Directory '${args[0]}' created successfully`,
            timestamp: Date.now()
          });
        } else {
          outputLines.push({
            type: 'error',
            content: 'mkdir: missing operand',
            timestamp: Date.now()
          });
        }
        break;

      case 'touch':
        if (args[0]) {
          outputLines.push({
            type: 'success',
            content: `File '${args[0]}' created successfully`,
            timestamp: Date.now()
          });
        } else {
          outputLines.push({
            type: 'error',
            content: 'touch: missing file operand',
            timestamp: Date.now()
          });
        }
        break;

      case 'echo':
        const message = args.join(' ');
        outputLines.push({
          type: 'output',
          content: message,
          timestamp: Date.now()
        });
        break;

      case 'date':
        outputLines.push({
          type: 'output',
          content: new Date().toString(),
          timestamp: Date.now()
        });
        break;

      case 'whoami':
        outputLines.push({
          type: 'output',
          content: 'user',
          timestamp: Date.now()
        });
        break;

      case 'uname':
        outputLines.push({
          type: 'output',
          content: 'WebOS 1.0.0',
          timestamp: Date.now()
        });
        break;

      case 'cat':
        if (args[0]) {
          outputLines.push({
            type: 'output',
            content: `Contents of ${args[0]}:\nThis is a sample file content.\nIn a real implementation, this would read the actual file.`,
            timestamp: Date.now()
          });
        } else {
          outputLines.push({
            type: 'error',
            content: 'cat: missing file operand',
            timestamp: Date.now()
          });
        }
        break;

      case 'cal':
        const now = new Date();
        const month = now.toLocaleString('default', { month: 'long' });
        const year = now.getFullYear();
        outputLines.push({
          type: 'output',
          content: `     ${month} ${year}
Su Mo Tu We Th Fr Sa
 1  2  3  4  5  6  7
 8  9 10 11 12 13 14
15 16 17 18 19 20 21
22 23 24 25 26 27 28
29 30 31`,
          timestamp: Date.now()
        });
        break;

      case 'neofetch':
        outputLines.push({
          type: 'output',
          content: `       _____       user@webos
      /     \\      -------
     /  Web  \\     OS: WebOS 1.0.0
    |   OS    |    Kernel: JavaScript
    |  v1.0.0  |    Shell: Terminal
     \\         /    Resolution: 1920x1080
      \\_____/     Theme: System Default
                   Terminal: WebOS Terminal`,
          timestamp: Date.now()
        });
        break;

      default:
        outputLines.push({
          type: 'error',
          content: `Command not found: ${cmd}. Type 'help' for available commands.`,
          timestamp: Date.now()
        });
    }

    setHistory(prev => [...prev, ...outputLines]);
    setCurrentInput('');
    inputRef?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput());
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = commandHistory();
      const index = Math.min(historyIndex() + 1, history.length - 1);
      setHistoryIndex(index);
      setCurrentInput(history[history.length - 1 - index]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const history = commandHistory();
      const index = Math.max(historyIndex() - 1, -1);
      setHistoryIndex(index);
      if (index === -1) {
        setCurrentInput('');
      } else {
        setCurrentInput(history[history.length - 1 - index]);
      }
    }
  };

  const getLineClass = (line: TerminalLine) => {
    const baseClass = 'terminal-line';
    switch (line.type) {
      case 'input':
        return `${baseClass} terminal-input`;
      case 'output':
        return `${baseClass} terminal-output`;
      case 'error':
        return `${baseClass} terminal-error`;
      case 'success':
        return `${baseClass} terminal-success`;
      default:
        return baseClass;
    }
  };

  return (
    <div class="terminal h-full flex flex-col bg-black dark:bg-black" onClick={() => inputRef?.focus()}>
  
      {/* Terminal Content */}
      <div
        ref={terminalRef!}
        class="terminal-content flex-1 p-4 overflow-auto font-mono text-sm"
        tabIndex={0}
      >
        <For each={history()}>
          {(line) => (
            <div class={getLineClass(line)}>
              <pre class="whitespace-pre-wrap">{line.content}</pre>
            </div>
          )}
        </For>

        {/* Input Line */}
        <div class="terminal-input-line flex items-center">
          <span class="terminal-prompt text-green-400 mr-2">
            {currentDirectory()} $
          </span>
          <input
            ref={inputRef!}
            type="text"
            value={currentInput()}
            onInput={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            class="terminal-input flex-1 bg-transparent outline-none text-green-400"
            spellcheck={false}
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
          />
        </div>
      </div>
    </div>
  );
};

export default Terminal;