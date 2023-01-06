#!/usr/bin/env node

import { spawn } from 'child_process';
import { blue, green, red } from 'kleur';
import ora from 'ora';
import process from 'process';

import { config } from '../config';
import { commandMessages, generationOptions, podInstall, replaceDirs } from '../utils';

const { template } = config;
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

(async () => {
  const { name, storeType, language } = await generationOptions();

  if (name && storeType && language) {
    const templateWithLanguageAndStoreType = template[language as keyof typeof template];
    try {
      const command = spawn(npx, [
        'react-native',
        'init',
        `${name}`,
        '--template',
        templateWithLanguageAndStoreType,
        '--skip-install',
      ]);

      command.stdout.on('data', data => {
        console.log(blue(`${data}`));
      });

      let spinner: any = null;
      spinner = commandMessages(command, spinner);

      command.on('close', async () => {
        try {
          await replaceDirs(name, storeType);

          const child = spawn(`cd ./${name} && yarn install`, { shell: true });

          child.stdout.on('data', data => {
            spinner?.stop()?.clear();
            spinner = ora({
              text: `Installing dependencies`,
              spinner: 'dots',
            }).start();

            if (`${data}`.match('Done in')) {
              spinner.succeed(green(`${data}`));
              spawn(`cd ./${name} && yarn lint:fix`, { shell: true });
              spinner = podInstall(name, spinner);
            }
          });
        } catch (error) {
          /* empty */
        }
      });
    } catch (error) {
      console.log(red(error as unknown as string));
    }
  } else {
    console.log(
      red(`You canceled the ${name || 'unnamed'} project creation!`),
      green('\n\n\nThanks for trying!'),
      '❤️',
    );
  }
})();
