import { Component, createSignal, createMemo, For } from 'solid-js';

type Operator = '+' | '-' | '*' | '/';

const Calculator: Component = () => {
  const [display, setDisplay] = createSignal('0');
  const [previousValue, setPreviousValue] = createSignal<number | null>(null);
  const [operation, setOperation] = createSignal<Operator | null>(null);
  const [waitingForNewValue, setWaitingForNewValue] = createSignal(false);
  const [activeOperator, setActiveOperator] = createSignal<Operator | null>(null);
  const [isAllClear, setIsAllClear] = createSignal(true);

  const currentDisplay = createMemo(() => {
    const num = parseFloat(display());
    if (display().endsWith('.') || (display().includes('.') && display().split('.')[1] === '')) {
        return display();
    }
    if (isNaN(num)) return 'Error';
    if (Math.abs(num) > 999999999 || (Math.abs(num) < 1e-9 && num !== 0)) {
        return num.toExponential(2);
    }
    return num.toLocaleString('en-US', {maximumFractionDigits: 9});
  });

  const fontSize = createMemo(() => {
    const len = currentDisplay().length;
    if (len > 15) return '2rem';
    if (len > 10) return '3rem';
    return '4rem';
  });

  const inputNumber = (num: string) => {
    if (waitingForNewValue()) {
      setDisplay(num);
      setWaitingForNewValue(false);
    } else {
      setDisplay(display() === '0' ? num : display() + num);
    }
    setIsAllClear(false);
    setActiveOperator(null);
  };

  const inputDecimal = () => {
    if (waitingForNewValue()) {
      setDisplay('0.');
      setWaitingForNewValue(false);
    } else if (display().indexOf('.') === -1) {
      setDisplay(display() + '.');
    }
    setIsAllClear(false);
  };

  const clear = () => {
    if (isAllClear()) {
        setPreviousValue(null);
        setOperation(null);
        setActiveOperator(null);
    }
    setDisplay('0');
    setWaitingForNewValue(false);
    setIsAllClear(true);
  };

  const toggleSign = () => {
    const currentValue = parseFloat(display());
    setDisplay(String(currentValue * -1));
  };

  const percentage = () => {
    const currentValue = parseFloat(display());
    setDisplay(String(currentValue / 100));
  };

  const performOperation = (nextOperation: Operator | '=') => {
    const inputValue = parseFloat(display());

    if (Number.isNaN(inputValue)) return;

    if (nextOperation === '=') {
        if (operation() && previousValue() !== null) {
            const currentValue = previousValue() || 0;
            const newValue = calculate(currentValue, inputValue, operation()!);
            setDisplay(String(newValue));
            setPreviousValue(null);
            setOperation(null);
            setActiveOperator(null);
            setWaitingForNewValue(true);
        }
    } else {
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
        setActiveOperator(nextOperation);
    }
  };

  const calculate = (firstValue: number, secondValue: number, op: Operator): number => {
    switch (op) {
      case '+': return firstValue + secondValue;
      case '-': return firstValue - secondValue;
      case '*': return firstValue * secondValue;
      case '/': return secondValue !== 0 ? firstValue / secondValue : Infinity;
      default: return secondValue;
    }
  };

  const buttons = [
    [isAllClear() ? 'AC' : 'C', '±', '%', '/'],
    ['7', '8', '9', '*'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '=']
  ];

  const handleButtonClick = (value: string) => {
    if (!isNaN(Number(value))) {
      inputNumber(value);
    } else if (value === '.') {
      inputDecimal();
    } else if (value === 'C' || value === 'AC') {
      clear();
    } else if (value === '±') {
      toggleSign();
    } else if (value === '%') {
      percentage();
    } else if (['+', '-', '*', '/'].includes(value)) {
      performOperation(value as Operator);
    } else if (value === '=') {
      performOperation('=');
    }
  };

  const getButtonClass = (button: string) => {
    const isOperation = ['/', '*', '-', '+', '='].includes(button);
    const isMisc = ['AC', 'C', '±', '%'].includes(button);
    const isNumber = !isNaN(Number(button)) && button !== '.';

    let classes = 'calculator-button text-2xl flex justify-center items-center select-none cursor-pointer ';

    if (isOperation) {
        classes += `operation text-4xl font-normal ${activeOperator() === button ? 'active' : ''}`;
    } else if (isMisc) {
        classes += 'function text-2xl font-medium';
    } else if (isNumber) {
        classes += 'number';
    } else {
        // Decimal point
        classes += 'number';
    }

    if (button === '0') {
        classes += ' col-span-2 justify-start pl-8';
    }

    return classes;
  };

  return (
    <div class="calculator rounded-lg overflow-hidden h-full flex flex-col">
      <div class="calculator-display font-thin p-5 text-right w-full box-border flex-1 flex items-end justify-end" style={{ "font-size": fontSize() }}>
        {currentDisplay()}
      </div>
      <div class="calculator-buttons grid grid-cols-4 grid-rows-5 h-[70%]">
        <For each={buttons.flat()}>
          {(button) => (
            <button
              onClick={() => handleButtonClick(button)}
              class={getButtonClass(button)}
            >
              {button === '*' ? '×' : button === '/' ? '÷' : button}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default Calculator;