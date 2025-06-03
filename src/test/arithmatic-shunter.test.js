import { describe, beforeEach, expect, it } from 'vitest';
import { ArithmaticShunter } from '../index.js';

const operatorPrecedences = {
  '^': 15,
  '*': 14,
  '/': 14,
  '%': 14,
  '+': 13,
  '-': 13,
  '<': 11,
  '<=': 11,
  '>': 11,
  '>=': 11,
  '==': 10,
  '!=': 10,
  '&&': 6,
  '||': 5,
};

const opGen = (op, left, right) => ({
  op,
  left,
  right,
});
const tokGen = (op) => ({
  content: op,
});

describe('ArithmaticShunter', () => {
  let shunter;
  beforeEach(() => {
    shunter = new ArithmaticShunter(operatorPrecedences, {
      astConstructor: opGen,
    });
  });

  it('should correctly arrange operators 1 + 2 * 3 - 4', () => {
    shunter.shuntValue(1);
    shunter.shuntOp(tokGen('+'));
    shunter.shuntValue(2);
    shunter.shuntOp(tokGen('*'));
    shunter.shuntValue(3);
    shunter.shuntOp(tokGen('-'));
    shunter.shuntValue(4);

    const output = shunter.getOutput();
    const expected = opGen(
      tokGen('+'),
      1,
      opGen(tokGen('-'), opGen(tokGen('*'), 2, 3), 4)
    );

    expect(output).toEqual(expected);
  });
});
