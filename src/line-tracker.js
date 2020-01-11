export class LineTracker {
  constructor() {
    this.line = 1;
    this.character = 1;
    this.justSeenSlashR = false;
  }

  consume(content) {
    for (let i = 0, len = content.length; i < len; i++) {
      if (content[i] == '\r') {
        this.line += 1;
        this.character = 1;
        this.justSeenSlashR = true;
      } else if (content[i] == '\n') {
        if (!this.justSeenSlashR) {
          this.line += 1;
        }
        this.character = 1;
        this.justSeenSlashR = false;
      } else {
        this.character += 1;
        this.justSeenSlashR = false;
      }
    }
  }
}
