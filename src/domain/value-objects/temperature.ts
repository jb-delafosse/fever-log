/**
 * Temperature value object with unit conversion and threshold logic.
 * Stores internally in Celsius for consistency.
 */
export class Temperature {
  private readonly celsius: number;

  constructor(value: number, unit: 'C' | 'F') {
    if (unit === 'F') {
      this.celsius = (value - 32) * (5 / 9);
    } else {
      this.celsius = value;
    }
  }

  toCelsius(): number {
    return Math.round(this.celsius * 10) / 10;
  }

  toFahrenheit(): number {
    return Math.round((this.celsius * (9 / 5) + 32) * 10) / 10;
  }

  isAbnormal(threshold: number = 38): boolean {
    return this.celsius >= threshold;
  }

  getValue(unit: 'C' | 'F'): number {
    return unit === 'F' ? this.toFahrenheit() : this.toCelsius();
  }

  static fromCelsius(value: number): Temperature {
    return new Temperature(value, 'C');
  }

  static fromFahrenheit(value: number): Temperature {
    return new Temperature(value, 'F');
  }
}
