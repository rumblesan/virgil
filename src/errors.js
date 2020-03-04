export class PatternDefinitionException extends Error {
  constructor(message) {
    super(message);
  }
}

export class LexerException extends Error {
  constructor(message) {
    super(message);
  }
}

export class UnmatchedCharacterException extends LexerException {
  constructor(visibleUserPartOfString, line, character) {
    const msg = `No viable match in '${visibleUserPartOfString}...'`;
    super(msg);
    this.name = 'UnmatchedCharacterException';
    this.displayable = true;
    this.line = line;
    this.character = character;
  }
}

export class ParserException extends Error {
  constructor(message) {
    super(message);
    this.name = 'ParserException';
  }
}

export class UnexpectedTokenException extends ParserException {
  constructor(expected, token) {
    const msg = `Expected ${expected} but found ${token.type}`;
    super(msg);
    this.name = 'UnexpectedTokenException';
    this.displayable = true;
    this.line = token.line;
    this.character = token.character;
    this.length = `${token.content}`.length;
  }
}
