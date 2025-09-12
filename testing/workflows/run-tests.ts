
#!/usr/bin/env node

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

const testTypes = {
  unit: 'vitest run testing/unit',
  integration: 'vitest run testing/integration',
  e2e: 'playwright test testing/e2e',
  all: 'npm run test:all'
};

const runCommand = (command: string): Promise<number> => {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      resolve(code || 0);
    });
  });
};

const main = async () => {
  const testType = process.argv[2] || 'all';
  
  if (!testTypes[testType as keyof typeof testTypes]) {
    console.error(`Unknown test type: ${testType}`);
    console.error(`Available types: ${Object.keys(testTypes).join(', ')}`);
    process.exit(1);
  }

  console.log(`Running ${testType} tests...`);
  
  const command = testTypes[testType as keyof typeof testTypes];
  const exitCode = await runCommand(command);
  
  if (exitCode === 0) {
    console.log(`✅ ${testType} tests passed!`);
  } else {
    console.error(`❌ ${testType} tests failed!`);
  }
  
  process.exit(exitCode);
};

main().catch(console.error);
