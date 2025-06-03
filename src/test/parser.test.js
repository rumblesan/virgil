import { describe, expect, it } from 'vitest';
import { Parser, UnexpectedTokenException } from '../index.js';

describe('the parser', () => {
  it('should allow initialization from an array', () => {
    const parser = new Parser();
    parser.initialize([]);
    expect(parser.tokens.length).toBe(0);
  });

  it('should not allow initialization from undefined', () => {
    const parser = new Parser();
    expect(() => {
      parser.initialize();
    }).toThrow('No tokens provided to the parser');
  });

  it('should not allow initialization from non-arrays', () => {
    const parser = new Parser();
    expect(() => {
      parser.initialize('hello');
    }).toThrow(
      'A non-array was provided to the parser instead of a token array'
    );
  });

  it('should allow lookahead checks without consuming tokens', () => {
    const parser = new Parser();
    parser.initialize([
      { content: 'token1', type: 'foo', position: 0 },
      { content: 'token2', type: 'bar', position: 0 },
    ]);
    expect(parser.la1('foo')).toBe(true);
    expect(parser.la1('foo')).toBe(true);
  });

  it('should allow peeking without consuming tokens', () => {
    const parser = new Parser();
    parser.initialize([
      { content: 'token1', type: 'foo', position: 0 },
      { content: 'token2', type: 'bar', position: 0 },
    ]);
    expect(parser.peek()).toEqual({
      content: 'token1',
      type: 'foo',
      position: 0,
    });
    expect(parser.peek()).toEqual({
      content: 'token1',
      type: 'foo',
      position: 0,
    });
  });

  it('should allow matching which consumies tokens', () => {
    const parser = new Parser();
    parser.initialize([
      { content: 'token1', type: 'foo', position: 0 },
      { content: 'token2', type: 'bar', position: 0 },
    ]);
    expect(parser.match('foo')).toEqual({
      content: 'token1',
      type: 'foo',
      position: 0,
    });
    expect(parser.match('bar')).toEqual({
      content: 'token2',
      type: 'bar',
      position: 0,
    });
  });

  it('should allow next to consume a token', () => {
    const parser = new Parser();
    parser.initialize([
      { content: 'token1', type: 'foo', position: 0 },
      { content: 'token2', type: 'bar', position: 0 },
    ]);
    expect(parser.next()).toEqual({
      content: 'token1',
      type: 'foo',
      position: 0,
    });
    expect(parser.next()).toEqual({
      content: 'token2',
      type: 'bar',
      position: 0,
    });
  });

  it('should throw when matching the wrong type', () => {
    const parser = new Parser();
    parser.initialize([
      {
        content: 'token1',
        type: 'foo',
        line: 1,
        character: 1,
      },
    ]);
    expect(() => {
      parser.match('bar');
    }).toThrowError(UnexpectedTokenException);
  });

  it('should throw when looking ahead and no tokens are available', () => {
    const parser = new Parser();
    parser.initialize([]);
    expect(() => {
      parser.la1('bar');
    }).toThrow('No tokens available');
  });

  it('should throw when matching and no tokens are available', () => {
    const parser = new Parser();
    parser.initialize([]);
    expect(() => {
      parser.match('bar');
    }).toThrow('Expected bar but found EOF');
  });

  it('should recognise the end of input as eof', () => {
    const parser = new Parser();
    parser.initialize([{ type: 'foo' }]);
    expect(parser.eof()).toBe(false);
    parser.match('foo');
    expect(parser.eof()).toBe(true);
  });

  it('should throw correctly if there are tokens and expectEof() called', () => {
    const parser = new Parser();
    parser.initialize([{ type: 'foo' }]);
    expect(parser.expectEof.bind(parser)).toThrow();
  });

  it('should not throw if there are no tokens and expectEof() called', () => {
    const parser = new Parser();
    parser.initialize([]);
    expect(parser.expectEof.bind(parser)).not.toThrow();
  });
});

/*
 */
