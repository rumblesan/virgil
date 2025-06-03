import { describe, beforeEach, expect, it } from 'vitest';
import {
  Lexer,
  StandardTokenTypes,
  UnmatchedCharacterException,
} from '../index.js';

describe('When adding token types to the lexer,', () => {
  let lexer;
  let tokenType;

  beforeEach(() => {
    lexer = new Lexer();
    tokenType = {
      name: 'name',
      regexp: / \t/,
    };
  });

  it('requires token types to have names', () => {
    expect(() => {
      delete tokenType.name;
      lexer.addTokenType(tokenType);
    }).toThrow("Token types must have a 'name' property");
  });

  it('requires token types to have regexps', () => {
    expect(() => {
      delete tokenType.regexp;
      lexer.addTokenType(tokenType);
    }).toThrow(
      "Token types must have a 'regexp' property or a 'consume' function"
    );
  });

  it('does not require a regexp if a consume function is available', () => {
    expect(() => {
      delete tokenType.regexp;
      tokenType.consume = function () {};
      lexer.addTokenType(tokenType);
    }).not.toThrow();
  });

  it('requires the regexp property to be a regexp', () => {
    expect(() => {
      tokenType.regexp = 'not a regexp';
      lexer.addTokenType(tokenType);
    }).toThrow("Token types 'regexp' property must be an instance of RegExp");
  });

  it('allows the consume property to be a function', () => {
    expect(() => {
      delete tokenType.regexp;
      tokenType.consume = function () {};
      lexer.addTokenType(tokenType);
    }).not.toThrow();
  });

  it('requires the consume property to be a function', () => {
    expect(() => {
      delete tokenType.regexp;
      tokenType.consume = 'not a function';
      lexer.addTokenType(tokenType);
    }).toThrow("Token types 'consume' property must be a function");
  });

  it('allows an interpret property to be a function', () => {
    expect(() => {
      tokenType.interpret = function () {
        return 0;
      };
      lexer.addTokenType(tokenType);
    }).not.toThrow();
  });

  it('requires the interpret property to be a function', () => {
    expect(() => {
      tokenType.interpret = 'not a function';
      lexer.addTokenType(tokenType);
    }).toThrow("Token types 'interpret' property must be a function");
  });
});

describe('When lexing tokens', () => {
  let lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  it('requires content to be passed', () => {
    expect(() => {
      lexer.tokenize(undefined);
    }).toThrow('No content provided');
  });

  it('requires at least one token type', () => {
    expect(() => {
      // we've not added any token types
      lexer.tokenize('something to tokenise');
    }).toThrow('No token types defined');
  });

  it('can tokenize a simple example', () => {
    lexer.addTokenType({
      name: 'A',
      regexp: /a+/,
    });

    lexer.addTokenType({
      name: 'B',
      regexp: /b+/,
    });

    const { tokens } = lexer.tokenize('aaabbbaaa');
    expect(tokens).toEqual([
      {
        content: 'aaa',
        type: 'A',
        character: 1,
        line: 1,
      },
      {
        content: 'bbb',
        type: 'B',
        character: 4,
        line: 1,
      },
      {
        content: 'aaa',
        type: 'A',
        character: 7,
        line: 1,
      },
    ]);
  });

  it('allows the use of an ignore flag in token types', () => {
    lexer.addTokenType({
      name: 'whitespace',
      regexp: /[ \t]+/,
      ignore: true,
    });

    lexer.addTokenType({
      name: 'word',
      regexp: /[a-z]+/,
      ignore: false,
    });

    const { tokens } = lexer.tokenize('aa bb cc');
    expect(tokens).toEqual([
      {
        content: 'aa',
        type: 'word',
        line: 1,
        character: 1,
      },
      {
        content: 'bb',
        type: 'word',
        line: 1,
        character: 4,
      },
      {
        content: 'cc',
        type: 'word',
        line: 1,
        character: 7,
      },
    ]);
  });

  it('reports when there is no matching pattern', () => {
    lexer.addTokenType({
      name: 'lettersOnly',
      regexp: /[a-z]+/,
    });
    expect(lexer.tokenize('123').errors[0]).toBeInstanceOf(
      UnmatchedCharacterException
    );
  });

  it('allows the use of custom consumers', () => {
    lexer.addTokenType({
      name: 'custom',
      consume: function anyThreeCharacters(remaining) {
        return {
          success: true,
          consumed: remaining.substring(0, 3),
        };
      },
    });

    const { tokens } = lexer.tokenize('abcdefg');
    expect(tokens).toEqual([
      {
        content: 'abc',
        type: 'custom',
        line: 1,
        character: 1,
      },
      {
        content: 'def',
        type: 'custom',
        line: 1,
        character: 4,
      },
      {
        content: 'g',
        type: 'custom',
        line: 1,
        character: 7,
      },
    ]);
  });

  it('protects against badly-consuming consume functions', () => {
    lexer.addTokenType({
      name: 'custom',
      consume: function broken() {
        return {
          success: true,
          consumed: 'xxx', // not the start of the string
        };
      },
    });

    expect(() => {
      lexer.tokenize('abcdefg');
    }).toThrow(
      'The consume function for custom failed to return the start of the remaining content at 1.1 and instead returned xxx'
    );
  });

  it('allows the use of custom interpreters', () => {
    lexer.addTokenType({
      name: 'integer',
      regexp: /\d+/,
      interpret(content) {
        return parseInt(content);
      },
    });

    const { tokens } = lexer.tokenize('123');
    expect(tokens).toEqual([
      {
        content: 123,
        type: 'integer',
        line: 1,
        character: 1,
      },
    ]);
  });

  it('ensures that custom interpeters track position correctly', () => {
    lexer.addTokenType({
      name: 'threeAs',
      regexp: /aaa/,
      interpret() {
        return 'A';
      },
    });

    lexer.addTokenType({
      name: 'threeBs',
      regexp: /bbb/,
      interpret() {
        return 'B';
      },
    });

    const { tokens } = lexer.tokenize('aaabbb');
    expect(tokens).toEqual([
      {
        content: 'A',
        type: 'threeAs',
        line: 1,
        character: 1,
      },
      {
        content: 'B',
        type: 'threeBs',
        line: 1,
        character: 4,
      },
    ]);
  });
});

describe('the lexer standard integer type', () => {
  const lexer = new Lexer();
  lexer.addTokenType(StandardTokenTypes.integer());

  it('should parse integers', () => {
    const { tokens } = lexer.tokenize('123');
    expect(tokens).toEqual([
      {
        content: 123,
        type: 'integer',
        line: 1,
        character: 1,
      },
    ]);
  });

  it('should parse negative integers', () => {
    const { tokens } = lexer.tokenize('-123');
    expect(tokens).toEqual([
      {
        content: -123,
        type: 'integer',
        line: 1,
        character: 1,
      },
    ]);
  });
});

describe('the lexer standard floating point type', () => {
  const lexer = new Lexer();
  lexer.addTokenType(StandardTokenTypes.floatingPoint());

  it('should parse floating points', () => {
    const { tokens } = lexer.tokenize('123.45');
    expect(tokens).toEqual([
      {
        content: 123.45,
        type: 'floating point',
        line: 1,
        character: 1,
      },
    ]);
  });

  it('should parse floating points without leading number', () => {
    const { tokens } = lexer.tokenize('.5');
    expect(tokens).toEqual([
      {
        content: 0.5,
        type: 'floating point',
        line: 1,
        character: 1,
      },
    ]);
  });

  it('should parse negative floating points', () => {
    const { tokens } = lexer.tokenize('-123.45');
    expect(tokens).toEqual([
      {
        content: -123.45,
        type: 'floating point',
        line: 1,
        character: 1,
      },
    ]);
  });
});

describe('the lexer standard JSON string type', () => {
  const lexer = new Lexer();
  lexer.addTokenType(StandardTokenTypes.JsonString());

  it('should parse an empty string', () => {
    const { tokens } = lexer.tokenize('""');
    expect(tokens).toHaveTokenContent(['']);
  });

  it('should parse a straightforward string', () => {
    const { tokens } = lexer.tokenize('"abc"');
    expect(tokens).toHaveTokenContent(['abc']);
  });

  it('should parse a \\t escape character', () => {
    const { tokens } = lexer.tokenize('"a\\tc"');
    expect(tokens).toHaveTokenContent(['a\tc']);
  });

  it('should parse a \\r escape character', () => {
    const { tokens } = lexer.tokenize('"a\\rc"');
    expect(tokens).toHaveTokenContent(['a\rc']);
  });

  it('should parse a \\n escape character', () => {
    const { tokens } = lexer.tokenize('"a\\nc"');
    expect(tokens).toHaveTokenContent(['a\nc']);
  });

  it('should parse unicode \\u0000 escape characters', () => {
    const { tokens } = lexer.tokenize('"\\u0065"'); // unicode 'A'
    expect(tokens).toHaveTokenContent(['A']);
  });

  it('should ignore not-really-unicode like \\u00 foo ', () => {
    const { tokens } = lexer.tokenize('"\\u00 foo"');
    expect(tokens).toHaveTokenContent(['\\u00 foo']);
  });

  // FIXME Both of these tests hang. Why?!
  it.skip('should fail to recognise \\ at the end of a string', () => {
    expect(() => {
      lexer.tokenize('"\\"');
    }).toThrow('No viable alternative at 1.1: \'"\\"...\'');
  });

  it.skip('should not recognise unknown escaped character, like \\q', () => {
    expect(() => {
      lexer.tokenize('"\\q"');
    }).toThrow('No viable alternative at 1.1: \'"\\q"...\'');
  });
});

describe('the lexer standard whitespace type', () => {
  let lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  it('should default to skipping whitespace tokens', () => {
    lexer.addTokenType(StandardTokenTypes.whitespace());
    lexer.addTokenType({ name: 'letters', regexp: /^[a-z]+/ });
    const { tokens } = lexer.tokenize('  \t  abc \t  ');
    expect(tokens).toEqual([
      {
        content: 'abc',
        type: 'letters',
        line: 1,
        character: 6,
      },
    ]);
  });

  it('will produce whitespace tokens spanning more than one character', () => {
    const nonIgnoredWhitespace = StandardTokenTypes.whitespace();
    nonIgnoredWhitespace.ignore = false;

    lexer.addTokenType(nonIgnoredWhitespace);
    lexer.addTokenType({ name: 'letters', regexp: /^[a-z]+/ });
    const { tokens } = lexer.tokenize(' \t abc \t ');
    expect(tokens).toEqual([
      {
        content: ' \t ',
        type: 'whitespace',
        line: 1,
        character: 1,
      },
      {
        content: 'abc',
        type: 'letters',
        line: 1,
        character: 4,
      },
      {
        content: ' \t ',
        type: 'whitespace',
        line: 1,
        character: 7,
      },
    ]);
  });

  it('does not recognise newlines as part of the token', () => {
    lexer.addTokenType(StandardTokenTypes.whitespace());
    expect(lexer.tokenize('\r').errors[0]).toBeInstanceOf(
      UnmatchedCharacterException
    );

    expect(lexer.tokenize('\n').errors[0]).toBeInstanceOf(
      UnmatchedCharacterException
    );
  });
});

describe('the lexer standard whitespace and newline type', () => {
  let lexer;

  beforeEach(() => {
    lexer = new Lexer();
  });

  it('should default to skipping whitespace tokens', () => {
    lexer.addTokenType(StandardTokenTypes.whitespaceWithNewlines());
    lexer.addTokenType({ name: 'letters', regexp: /^[a-z]+/ });
    const { tokens } = lexer.tokenize('  \r\n\t  abc \r\n\t  ');
    expect(tokens).toEqual([
      {
        content: 'abc',
        type: 'letters',
        line: 2,
        character: 4,
      },
    ]);
  });

  it('will produce whitespace tokens spanning more than one character', () => {
    const nonIgnoredWhitespace = StandardTokenTypes.whitespaceWithNewlines();
    nonIgnoredWhitespace.ignore = false;

    lexer.addTokenType(nonIgnoredWhitespace);
    lexer.addTokenType({ name: 'letters', regexp: /^[a-z]+/ });
    const { tokens } = lexer.tokenize(' \t abc \t ');
    expect(tokens).toEqual([
      {
        content: ' \t ',
        type: 'whitespace',
        line: 1,
        character: 1,
      },
      {
        content: 'abc',
        type: 'letters',
        line: 1,
        character: 4,
      },
      {
        content: ' \t ',
        type: 'whitespace',
        line: 1,
        character: 7,
      },
    ]);
  });

  it('should recognise newlines as part of the token', () => {
    lexer.addTokenType(StandardTokenTypes.whitespaceWithNewlines());
    expect(() => lexer.tokenize('\r')).not.toThrow();

    expect(() => lexer.tokenize('\n')).not.toThrow();
  });
});

describe('the lexer standard types', () => {
  let lexer;
  beforeEach(() => {
    lexer = new Lexer();
  });

  it('should recognise commas', () => {
    lexer.addTokenType(StandardTokenTypes.comma());
    expect(lexer.tokenize(',').tokens).toHaveTokenTypes(['comma']);
  });

  it('should recognise periods', () => {
    lexer.addTokenType(StandardTokenTypes.period());
    expect(lexer.tokenize('.').tokens).toHaveTokenTypes(['period']);
  });

  it('should recognise colons', () => {
    lexer.addTokenType(StandardTokenTypes.colon());
    expect(lexer.tokenize(':').tokens).toHaveTokenTypes(['colon']);
  });

  it('should recognise star', () => {
    lexer.addTokenType(StandardTokenTypes.star());
    expect(lexer.tokenize('*').tokens).toHaveTokenTypes(['star']);
  });

  it('should recognise real numbers', () => {});

  it('should recognise several brackets and parens', () => {
    lexer.addTokenType(StandardTokenTypes.openBracket());
    lexer.addTokenType(StandardTokenTypes.closeBracket());
    lexer.addTokenType(StandardTokenTypes.openSquareBracket());
    lexer.addTokenType(StandardTokenTypes.closeSquareBracket());
    lexer.addTokenType(StandardTokenTypes.openParen());
    lexer.addTokenType(StandardTokenTypes.closeParen());
    expect(lexer.tokenize('{}[]()').tokens).toHaveTokenTypes([
      'open bracket',
      'close bracket',
      'open square bracket',
      'close square bracket',
      'open paren',
      'close paren',
    ]);
  });
});
