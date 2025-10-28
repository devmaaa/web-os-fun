export interface CalculationResult {
  result: number;
  error?: string;
}

export class CalculatorEngine {
  private current: number = 0;
  private previous: number | null = null;
  private operation: string | null = null;
  private waitingForNewValue: boolean = false;

  inputNumber(num: string): void {
    if (this.waitingForNewValue) {
      this.current = parseFloat(num);
      this.waitingForNewValue = false;
    } else {
      const currentStr = this.current.toString();
      if (currentStr === '0') {
        this.current = parseFloat(num);
      } else {
        this.current = parseFloat(currentStr + num);
      }
    }
  }

  inputDecimal(): void {
    if (this.waitingForNewValue) {
      this.current = 0;
      this.waitingForNewValue = false;
    }

    const currentStr = this.current.toString();
    if (!currentStr.includes('.')) {
      this.current = parseFloat(currentStr + '.');
    }
  }

  setOperation(op: string): CalculationResult {
    const inputValue = this.current;

    if (this.previous === null) {
      this.previous = inputValue;
    } else if (this.operation && !this.waitingForNewValue) {
      const result = this.calculate(this.previous, inputValue, this.operation);
      this.current = result;
      this.previous = result;
    }

    this.waitingForNewValue = true;
    this.operation = op;

    return { result: this.current };
  }

  calculate(): CalculationResult {
    if (this.previous === null || this.operation === null) {
      return { result: this.current };
    }

    const result = this.calculate(this.previous, this.current, this.operation);
    this.current = result;
    this.previous = null;
    this.operation = null;
    this.waitingForNewValue = true;

    return { result: this.current };
  }

  clear(): void {
    this.current = 0;
    this.previous = null;
    this.operation = null;
    this.waitingForNewValue = false;
  }

  clearEntry(): void {
    this.current = 0;
    this.waitingForNewValue = false;
  }

  toggleSign(): void {
    this.current = -this.current;
  }

  percentage(): void {
    this.current = this.current / 100;
  }

  scientificOperation(op: string): CalculationResult {
    const value = this.current;
    let result: number;

    switch (op) {
      case 'sqrt':
        result = Math.sqrt(value);
        break;
      case 'square':
        result = value * value;
        break;
      case 'cube':
        result = value * value * value;
        break;
      case 'sin':
        result = Math.sin(value * Math.PI / 180);
        break;
      case 'cos':
        result = Math.cos(value * Math.PI / 180);
        break;
      case 'tan':
        result = Math.tan(value * Math.PI / 180);
        break;
      case 'log':
        result = Math.log10(value);
        break;
      case 'ln':
        result = Math.log(value);
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
      default:
        return { result: value, error: 'Unknown operation' };
    }

    this.current = result;
    this.waitingForNewValue = true;

    return { result };
  }

  getCurrentValue(): number {
    return this.current;
  }

  private calculate(first: number, second: number, operation: string): number {
    switch (operation) {
      case '+':
        return first + second;
      case '-':
        return first - second;
      case '*':
        return first * second;
      case '/':
        return second !== 0 ? first / second : 0;
      default:
        return second;
    }
  }
}