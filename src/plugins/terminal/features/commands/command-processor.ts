export interface CommandResult {
  output: string;
  error?: string;
  exitCode: number;
}

export interface Command {
  name: string;
  description: string;
  execute: (args: string[]) => Promise<CommandResult>;
}

export class CommandProcessor {
  private commands: Map<string, Command> = new Map();

  constructor() {
    this.registerDefaultCommands();
  }

  registerCommand(command: Command) {
    this.commands.set(command.name, command);
  }

  async executeCommand(input: string): Promise<CommandResult> {
    const [commandName, ...args] = input.trim().split(' ');

    if (!commandName) {
      return { output: '', exitCode: 0 };
    }

    const command = this.commands.get(commandName.toLowerCase());

    if (!command) {
      return {
        output: '',
        error: `Command not found: ${commandName}. Type 'help' for available commands.`,
        exitCode: 1
      };
    }

    try {
      return await command.execute(args);
    } catch (error) {
      return {
        output: '',
        error: `Error executing command: ${error instanceof Error ? error.message : 'Unknown error'}`,
        exitCode: 1
      };
    }
  }

  getAvailableCommands(): Command[] {
    return Array.from(this.commands.values());
  }

  private registerDefaultCommands() {
    this.registerCommand({
      name: 'help',
      description: 'Show available commands',
      execute: async () => ({
        output: `Available commands:
  help     - Show this help message
  clear    - Clear terminal screen
  ls       - List directory contents
  pwd      - Print working directory
  date     - Show current date and time
  whoami   - Display current user
  uname    - Display system information
  echo     - Display message
  mkdir    - Create directory
  touch    - Create file`,
        exitCode: 0
      })
    });

    this.registerCommand({
      name: 'clear',
      description: 'Clear terminal screen',
      execute: async () => ({ output: 'CLEAR_SCREEN', exitCode: 0 })
    });

    this.registerCommand({
      name: 'ls',
      description: 'List directory contents',
      execute: async () => ({
        output: 'Documents  Downloads  Pictures  Music  Videos  readme.txt  config.json',
        exitCode: 0
      })
    });

    this.registerCommand({
      name: 'pwd',
      description: 'Print working directory',
      execute: async () => ({ output: '/home/user', exitCode: 0 })
    });

    this.registerCommand({
      name: 'date',
      description: 'Show current date and time',
      execute: async () => ({ output: new Date().toString(), exitCode: 0 })
    });

    this.registerCommand({
      name: 'whoami',
      description: 'Display current user',
      execute: async () => ({ output: 'user', exitCode: 0 })
    });

    this.registerCommand({
      name: 'uname',
      description: 'Display system information',
      execute: async () => ({ output: 'WebOS 1.0.0', exitCode: 0 })
    });

    this.registerCommand({
      name: 'echo',
      description: 'Display message',
      execute: async (args) => ({ output: args.join(' '), exitCode: 0 })
    });

    this.registerCommand({
      name: 'mkdir',
      description: 'Create directory',
      execute: async (args) => {
        if (args.length === 0) {
          return { output: '', error: 'mkdir: missing operand', exitCode: 1 };
        }
        return { output: `Directory '${args[0]}' created`, exitCode: 0 };
      }
    });

    this.registerCommand({
      name: 'touch',
      description: 'Create file',
      execute: async (args) => {
        if (args.length === 0) {
          return { output: '', error: 'touch: missing file operand', exitCode: 1 };
        }
        return { output: `File '${args[0]}' created`, exitCode: 0 };
      }
    });
  }
}