import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { setViewport } from './viewport';

afterEach(() => {
  cleanup();
  // Every test starts from a desktop viewport unless it opts into mobile.
  setViewport('desktop');
});

setViewport('desktop');
