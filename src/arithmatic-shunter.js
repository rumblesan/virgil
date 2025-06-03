import { ParserException, UnexpectedTokenException } from './errors.js';

export class ArithmaticShunter {
  constructor(precedences, options = {}) {
    this.operatorStack = [];
    this.output = [];
    this.precedences = precedences;
    this.astConstructor = options.astConstructor || this.defaultAstConstructor;
  }
  defaultAstConstructor(op, value1, value2) {
    return { op, value1, value2 };
  }
  shuntValue(value) {
    this.output.push(value);
  }
  collapseOp(operator) {
    const v2 = this.output.pop();
    const v1 = this.output.pop();
    const expr = this.astConstructor(operator, v1, v2);
    this.output.push(expr);
  }
  shuntOp(newOp) {
    const opSymbol = newOp.content;
    if (!this.precedences[opSymbol]) {
      throw new UnexpectedTokenException(
        `${opSymbol} is not a valid operator`,
        newOp
      );
    }
    if (this.operatorStack.length < 1) {
      this.operatorStack.push(newOp);
      return;
    }
    const peekOp = this.operatorStack[this.operatorStack.length - 1];
    if (this.precedences[opSymbol] <= this.precedences[peekOp.content]) {
      const topOp = this.operatorStack.pop();
      this.collapseOp(topOp);
    }
    this.operatorStack.push(newOp);
  }
  getOutput() {
    while (this.operatorStack.length > 0) {
      this.collapseOp(this.operatorStack.pop());
    }
    if (this.output.length !== 1) {
      throw new ParserException(
        'Should only be a single expression in shunter output'
      );
    }
    return this.output.pop();
  }
}
