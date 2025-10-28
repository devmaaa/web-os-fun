import { Component, createSignal, createMemo, Show } from 'solid-js';
import './Calculator.css';

type CalculatorMode = 'basic' | 'scientific';
type Operator = '+' | '-' | '*' | '/' | '=' | 'C' | 'CE' | '±' | '%' | '.' | '√' | 'x²' | 'x³' | 'x^y' | 'sin' | 'cos' | 'tan' | 'log' | 'ln' | 'π' | 'e' | '(' | ')';

const Calculator: Component = () => {
  const [display, setDisplay] = createSignal('0');
  const [previousValue, setPreviousValue] = createSignal<number | null>(null);
  const [operation, setOperation] = createSignal<Operator | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = createSignal(false);
  const [mode, setMode] = createSignal<CalculatorMode>('basic');
  const [memory, setMemory] = createSignal(0);

  const currentDisplay = createMemo(() => display());

  const inputNumber = (num: string) => {
    if (waitingForNewValue()) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display() === '0' ? num : display() + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForNewValue()) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display().indexOf('.') === -1) {
      setDisplay(display() + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForNewValue(false);
  };

  const clearEntry = () => {
    setDisplay('0');
    setWaitingForNewValue(false);
  };

  const toggleSign = () => {
    const currentValue = parseFloat(display());
    setDisplay(String(currentValue * -1));
  };

  const percentage = () => {
    const currentValue = parseFloat(display());
    setDisplay(String(currentValue / 100));
  };

  const performOperation = (nextOperation: Operator) => {
    const inputValue = parseFloat(display());

    if (previousValue() === null) {
      setPreviousValue(inputValue);
    } else if (operation()) {
      const currentValue = previousValue() || 0;
      const newValue = calculate(currentValue, inputValue, operation()!);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForNewValue(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: Operator): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '*':
        return firstValue * secondValue;
      case '/':
        return secondValue !== 0 ? firstValue / secondValue : 0;
      default:
        return secondValue;
    }
  };

  const scientificOperation = (op: string) => {
    const currentValue = parseFloat(display());
    let result = 0;

    switch (op) {
      case '√':
        result = Math.sqrt(currentValue);
        break;
      case 'x²':
        result = currentValue * currentValue;
        break;
      case 'x³':
        result = currentValue * currentValue * currentValue;
        break;
      case 'sin':
        result = Math.sin(currentValue * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(currentValue * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(currentValue * Math.PI / 180);
        break;
      case 'log':
        result = Math.log10(currentValue);
        break;
      case 'ln':
        result = Math.log(currentValue);
        break;
      case 'π':
        setDisplay(String(Math.PI));
        return;
      case 'e':
        setDisplay(String(Math.E));
        return;
      case '(':
      case ')':
        // Parentheses would require more complex parsing
        return;
      default:
        return;
    }

    setDisplay(String(result));
    setWaitingForNewValue(true);
  };

  const memoryOperation = (op: 'MC' | 'MR' | 'M+' | 'M-') => {
    const currentValue = parseFloat(display());

    switch (op) {
      case 'MC':
        setMemory(0);
        break;
      case 'MR':
        setDisplay(String(memory()));
        setWaitingForNewValue(true);
        break;
      case 'M+':
        setMemory(memory() + currentValue);
        setWaitingForNewValue(true);
        break;
      case 'M-':
        setMemory(memory() - currentValue);
        setWaitingForNewValue(true);
        break;
    }
  };

  const basicButtons = [
    ['C', 'CE', '±', '%'],
    ['7', '8', '9', '/'],
    ['4', '5', '6', '*'],
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];

  const scientificButtons = [
    ['MC', 'MR', 'M+', 'M-', 'C', 'CE'],
    ['sin', 'cos', 'tan', 'log', 'ln', '√'],
    ['x²', 'x³', 'x^y', '(', ')', 'π'],
    ['7', '8', '9', '/', 'e', '↶'],
    ['4', '5', '6', '*', '%', '↷'],
    ['1', '2', '3', '-', '±', '.'],
    ['0', '.', '=', '+', '⌫', '⏎']
  ];

  const handleButtonClick = (value: string) => {
    // Basic operations
    if (!isNaN(Number(value)) && value !== '.') {
      inputNumber(value);
    } else if (value === '.') {
      inputDecimal();
    } else if (value === 'C') {
      clear();
    } else if (value === 'CE') {
      clearEntry();
    } else if (value === '±') {
      toggleSign();
    } else if (value === '%') {
      percentage();
    } else if (['+', '-', '*', '/'].includes(value)) {
      performOperation(value as Operator);
    } else if (value === '=') {
      performOperation('=');
    }
    // Scientific operations
    else if (['√', 'x²', 'x³', 'sin', 'cos', 'tan', 'log', 'ln', 'π', 'e'].includes(value)) {
      scientificOperation(value);
    }
    // Memory operations
    else if (['MC', 'MR', 'M+', 'M-'].includes(value)) {
      memoryOperation(value as any);
    }
  };

  return (
    <div class="calculator h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Mode Selector */}
      <div class="calculator-header p-3 border-b border-gray-300 dark:border-gray-700">
        <div class="flex justify-between items-center">
          <span class="text-lg font-semibold text-gray-700 dark:text-gray-300">Calculator</span>
          <div class="flex gap-1">
            <button
              onClick={() => setMode('basic')}
              class={`px-3 py-1 text-sm rounded ${
                mode() === 'basic'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Basic
            </button>
            <button
              onClick={() => setMode('scientific')}
              class={`px-3 py-1 text-sm rounded ${
                mode() === 'scientific'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Scientific
            </button>
          </div>
        </div>
      </div>

      {/* Display */}
      <div class="calculator-display p-4 bg-white dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <div class="text-right">
          <div class="text-sm text-gray-500 dark:text-gray-400 min-h-[1rem]">
            {memory() !== 0 && `M: ${memory()}`}
          </div>
          <div class="text-3xl font-mono text-gray-900 dark:text-gray-100 break-all">
            {currentDisplay()}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div class="calculator-buttons flex-1 p-4">
        <Show when={mode() === 'basic'}>
          <div class="grid grid-cols-4 gap-2 h-full">
            <For each={basicButtons.flat()}>
              {(button) => (
                <button
                  onClick={() => handleButtonClick(button)}
                  class={`calculator-button rounded font-semibold transition-all transform active:scale-95 ${
                    button === '='
                      ? 'bg-blue-500 text-white hover:bg-blue-600 col-span-2'
                      : ['C', 'CE'].includes(button)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : ['+', '-', '*', '/', '%', '±'].includes(button)
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {button}
                </button>
              )}
            </For>
          </div>
        </Show>

        <Show when={mode() === 'scientific'}>
          <div class="grid grid-cols-6 gap-1 h-full">
            <For each={scientificButtons.flat()}>
              {(button) => (
                <button
                  onClick={() => handleButtonClick(button)}
                  class={`calculator-button rounded text-sm font-semibold transition-all transform active:scale-95 ${
                    button === '='
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : ['C', 'CE'].includes(button)
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : ['+', '-', '*', '/', '%', '±'].includes(button)
                      ? 'bg-orange-500 text-white hover:bg-orange-600'
                      : ['MC', 'MR', 'M+', 'M-'].includes(button)
                      ? 'bg-purple-500 text-white hover:bg-purple-600'
                      : ['sin', 'cos', 'tan', 'log', 'ln', '√', 'x²', 'x³', 'x^y', 'π', 'e'].includes(button)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  {button}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>
    </div>
  );
};

export default Calculator;