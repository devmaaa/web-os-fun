import { Component, createSignal, onMount, createEffect, For } from 'solid-js';

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
          content: `Available commands:\n  help     - Show this help message\n  clear    - Clear terminal screen\n  ls       - List directory contents\n  cd       - Change directory\n  pwd      - Print working directory\n  mkdir    - Create directory\n  touch    - Create file\n  echo     - Display message\n  date     - Show current date and time\n  whoami   - Display current user\n  uname    - Display system information\n  cat      - Display file contents\n  cal      - Display calendar\n  neofetch - Display system information (stylized)`,
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
          content: `     ${month} ${year}\nSu Mo Tu We Th Fr Sa\n 1  2  3  4  5  6  7\n 8  9 10 11 12 13 14\n15 16 17 18 19 20 21\n22 23 24 25 26 27 28\n29 30 31`,
          timestamp: Date.now()
        });
        break;

      case 'neofetch':
        outputLines.push({
          type: 'output',
          content: `       _____       user@webos\n      /     \      -------\n     /  Web  \     OS: WebOS 1.0.0\n    |   OS    |    Kernel: JavaScript\n    |  v1.0.0  |    Shell: Terminal\n     \         /    Resolution: 1920x1080\n      \_____/     Theme: System Default\n                   Terminal: WebOS Terminal`,
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

  const lineClasses = {
    input: 'text-green-400',
    output: 'text-gray-200',
    error: 'text-red-500',
    success: 'text-green-400',
  };

  return (
    <div class="h-full flex flex-col bg-black font-mono selection:bg-gray-700 selection:text-gray-200" onClick={() => inputRef?.focus()}>
  
      {/* Terminal Content */}
      <div
        ref={terminalRef!}
        class="flex-1 p-4 overflow-auto text-sm focus-within:outline-none"
        tabIndex={0}
      >
        <For each={history()}>
          {(line) => (
            <div class={`my-0.5 leading-normal ${lineClasses[line.type]}`}>
              <pre class="whitespace-pre-wrap">{line.content}</pre>
            </div>
          )}
        </For>

        {/* Input Line */}
        <div class="flex items-center">
          <span class="text-green-400 mr-2 select-none">
            {currentDirectory()} $
          </span>
          <input
            ref={inputRef!}
            type="text"
            value={currentInput()}
            onInput={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            class="flex-1 bg-transparent outline-none text-green-400 caret-green-500"
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
