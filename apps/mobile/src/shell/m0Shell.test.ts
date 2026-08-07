import { describe, expect, it } from 'vitest';

import { getM0ShellCopy } from './m0Shell';

describe('getM0ShellCopy', () => {
  it('returns the M0 shell copy', () => {
    expect(getM0ShellCopy()).toEqual({
      title: 'M0 Technical Shell',
      subtitle:
        'Bodyweight squat validation foundation ready for camera and pose work.',
    });
  });
});
