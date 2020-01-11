function escapeRegExp(string) {
  return string.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1');
}

export class StandardTokenTypes {
  static constant(literal, name, role) {
    role = role || ['keyword'];
    return {
      name,
      regexp: new RegExp(`^${escapeRegExp(literal)}`),
      role,
    };
  }

  static floatingPoint() {
    return {
      name: 'floating point',
      regexp: /(^-?\d*\.\d+)/,
      role: ['constant', 'numeric'],
      interpret(content) {
        return parseFloat(content);
      },
    };
  }

  static integer() {
    return {
      name: 'integer',
      regexp: /^-?\d+/,
      role: ['constant', 'numeric'],
      interpret(content) {
        return parseInt(content);
      },
    };
  }

  static whitespace() {
    return {
      name: 'whitespace',
      ignore: true,
      regexp: /^[ \t]+/,
    };
  }

  static whitespaceWithNewlines() {
    return {
      name: 'whitespace',
      ignore: true,
      regexp: /^[ \t\r\n]+/,
    };
  }

  static real() {
    return {
      name: 'real number',
      regexp: /^X/,
      role: ['constant', 'numeric'],
    };
  }

  static comma() {
    return this.constant(',', 'comma', ['punctuation']);
  }

  static period() {
    return this.constant('.', 'period', ['punctuation']);
  }

  static star() {
    return this.constant('*', 'star', ['punctuation']);
  }

  static colon() {
    return this.constant(':', 'colon', ['punctuation']);
  }

  static openParen() {
    return this.constant('(', 'open paren', ['punctuation']);
  }

  static closeParen() {
    return this.constant(')', 'close paren', ['punctuation']);
  }

  static openBracket() {
    return this.constant('{', 'open bracket', ['punctuation']);
  }

  static closeBracket() {
    return this.constant('}', 'close bracket', ['punctuation']);
  }

  static openSquareBracket() {
    return this.constant('[', 'open square bracket', ['punctuation']);
  }

  static closeSquareBracket() {
    return this.constant(']', 'close square bracket', ['punctuation']);
  }

  static JsonString() {
    return {
      name: 'string',
      regexp: /"(?:[^"\\]|\\.)*"/,
      consume(remaining) {
        const fail = { success: false };
        if (remaining.indexOf('"') !== 0) {
          return fail;
        }

        let content = '';
        let pos = 1;
        let ch;
        let finished = false;
        do {
          ch = remaining[pos];
          pos += 1;

          let ch2;
          let unicodeDigits;
          switch (ch) {
            case '"':
              finished = true;
              break;
            case '\\':
              ch2 = remaining[pos];
              pos += 1;
              switch (ch2) {
                case '"':
                  return fail;
                case 't':
                  content += '\t';
                  break;
                case 'r':
                  content += '\r';
                  break;
                case 'n':
                  content += '\n';
                  break;
                case 'u':
                  unicodeDigits = remaining.substr(pos, 4);
                  if (
                    unicodeDigits.length != 4 ||
                    !/\d{4}/.test(unicodeDigits)
                  ) {
                    content += '\\u';
                  } else {
                    pos += 4;
                    const codePoint = parseInt(unicodeDigits, 10);
                    const codePointString = String.fromCharCode(codePoint);
                    content += codePointString;
                  }
                  break;
                default:
                  // something like \q, which doesn't mean anything
                  return fail;
              }
              break;
            default:
              content += ch;
              break;
          }
        } while (!finished);

        const consumed = remaining.substring(0, pos);

        const successResult = {
          success: true,
          consumed,
          content,
        };
        return successResult;
      },
    };
  }
}
