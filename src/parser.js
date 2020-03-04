import { ParserException, UnexpectedTokenException } from './errors';

export class Parser {
  initialize(tokens, options = {}) {
    if (!tokens) {
      throw new ParserException('No tokens provided to the parser');
    }

    if (!(tokens instanceof Array)) {
      throw new ParserException(
        'A non-array was provided to the parser instead of a token array'
      );
    }

    this.debug = options.debug || false;
    this.testing = options.testing || false;
    this.tokens = tokens;
  }

  la1(tokenType) {
    if (this.eof()) {
      throw new ParserException('No tokens available');
    }

    return this.tokens[0].type == tokenType;
  }

  peek() {
    if (this.eof()) {
      throw new ParserException('No tokens available');
    }

    return this.tokens[0];
  }

  match(tokenType) {
    if (this.eof()) {
      throw new ParserException(`Expected ${tokenType} but found EOF`);
    }

    if (!this.la1(tokenType)) {
      throw new UnexpectedTokenException(tokenType, this.tokens[0]);
    }

    return this.tokens.shift();
  }

  next() {
    if (this.eof()) {
      throw new ParserException('Expected token but found EOF');
    }

    return this.tokens.shift();
  }

  eof() {
    return this.tokens.length === 0;
  }

  expectEof() {
    if (!this.eof()) {
      throw new UnexpectedTokenException('EOF', this.tokens[0]);
    }
  }

  resetStream(tokenType) {
    while (!this.eof() && !this.la1(tokenType)) {
      this.tokens.shift();
    }
    if (!this.eof() && this.la1(tokenType)) this.tokens.shift();
  }

  position() {
    if (this.testing) return {};

    return { line: this.tokens[0].line, character: this.tokens[0].character };
  }

  tokenPosition(token) {
    if (this.testing) return {};

    return { line: token.line, character: token.character };
  }

  debugLog(msg) {
    if (this.debug) console.log(msg);
  }
}
