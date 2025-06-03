import { beforeEach, describe, expect, it } from 'vitest';
import { LineTracker } from '../index.js';

describe('LineTracker', () => {
  let tracker;
  beforeEach(() => {
    tracker = new LineTracker();
  });

  it('should initialize to 1,1', () => {
    expect(tracker).toBeAt(1, 1);
  });

  it('should track characters in the first line', () => {
    tracker.consume('1234567890');
    expect(tracker).toBeAt(1, 11);
  });

  it('should track \\r', () => {
    tracker.consume('foo\rbar');
    expect(tracker).toBeAt(2, 4);
  });

  it('should track \\n', () => {
    tracker.consume('foo\nbar');
    expect(tracker).toBeAt(2, 4);
  });

  it('should track \\r\\n', () => {
    tracker.consume('foo\r\nbar');
    expect(tracker).toBeAt(2, 4);
  });

  it('should track \\r, \\n, and both together in complex situations', () => {
    tracker.consume('\r');
    expect(tracker).toBeAt(2, 1);

    tracker.consume('\n');
    expect(tracker).toBeAt(2, 1); // don't advance the line because of previous \r

    tracker.consume('foo');
    expect(tracker).toBeAt(2, 4);
  });
});
