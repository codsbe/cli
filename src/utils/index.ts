import { spawn } from 'child_process';
import { promises, readdirSync, statSync } from 'fs';
import { blue, green, red } from 'kleur';
import ora from 'ora';
import path from 'path';
import process from 'process';
import prompts from 'prompts';
import replace from 'replace-in-file';
import rimraf from 'rimraf';

import { config } from '../config';

const { folderReplacements, nestedInViewFolder, pathReplacements } = config;
const { rename } = promises;

export async function generationOptions(): Promise<any> {
  return prompts([
    {
      type: 'text',
      name: 'name',
      message: `What's your project name?`,
      validate: value => (value.match(/^[a-z\d]+$/i) ? true : 'Project name must be alphanumeric'),
    },
    {
      type: 'select',
      name: 'language',
      message: 'Please choose a language',
      choices: [
        { title: 'TypeScript', value: 'ts' },
        { title: 'JavaScript', value: 'js' },
      ],
    },
    {
      type: 'select',
      name: 'storeType',
      message: 'Store type',
      choices: [
        // {title: 'Redux Toolkit', value: 'reduxToolkit'},
        { title: 'Redux Saga', value: 'reduxSaga' },
        { title: 'Redux Query', value: 'reduxQuery' },
        // {title: 'Mobix', value: 'mobix'}
      ],
    },
  ]);
}

export function commandMessages(command: any, spinner: any): any {
  command.stderr.on('data', (data: any) => {
    spinner?.stop()?.clear();
    let text = `${data}`;
    if (text.match('Dependencies installation skipped')) {
      text = '';
    }
    spinner = ora({
      text,
      spinner: 'dots',
    }).start();
    if (`${data}`.includes('error')) {
      spinner.fail(red(`${data}`.replace('error', '')));
    }
    if (`${data}`.includes('✔')) {
      spinner.succeed(green(`${data}`.replace('✔', '')));
    }
    if (`${data}`.includes('ℹ')) {
      spinner.info(blue(`${data}`.replace('ℹ', '')));
    }
  });
  return spinner;
}

export async function replaceDirs(
  name: string,
  storeType: keyof typeof folderReplacements,
): Promise<void> {
  try {
    const files = await promises.readdir(`./${name}/src/${folderReplacements[storeType]}`);

    await Promise.all(
      files.map(async (item: any): Promise<void> => {
        const oldPath = `./${name}/src/${folderReplacements[storeType]}/${item}`;
        const newPath = `./${name}/src/${item}`;

        try {
          if (nestedInViewFolder.includes(item)) {
            const path = `./${name}/src/view/${item}`;
            rimraf.sync(path);
          }
          // @ts-ignore
          return await rename(oldPath, newPath, err => {
            if (err) throw err;
          });
        } catch (error) {
          return Promise.reject(
            new Error(
              'Sorry, an error occurred during the onDirectoryFound function, contact the developer of the plugin',
            ),
          );
        }
      }),
    );

    rimraf.sync(`./${name}/src/store_types`);
    const result = getAllFiles(`./${name}/src`);

    for (const item of result) {
      for (const key of keys(pathReplacements[storeType])) {
        const options = {
          files: item,
          from: key,
          to: pathReplacements[storeType][key],
        };
        try {
          // @ts-ignore
          // eslint-disable-next-line no-await-in-loop
          await replace(options);
        } catch (error) {
          console.error('Error occurred:', error);
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
}

export function podInstall(name: string, spinner: any): any {
  const podInstall = spawn(`cd ./${name}/ios && pod install`, { shell: true });
  podInstall.stdout.on('data', data => {
    spinner?.stop()?.clear();
    spinner = ora({
      text: `Installing Pod dependencies`,
      spinner: 'aesthetic',
    }).start();
    if (`${data}`.match('Pod installation complete')) {
      spinner.succeed(green(`${data}`));
      console.log('\n\n', blue(`Happy coding!`));
    }
  });
  return spinner;
}

export function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(file => {
    if (statSync(`${dirPath}/${file}`).isDirectory()) {
      arrayOfFiles = getAllFiles(`${dirPath}/${file}`, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(process.env.PWD as string, dirPath, '/', file));
    }
  });

  return arrayOfFiles;
}
export function keys<T>(obj: T): (keyof T)[] {
  // @ts-ignore
  return Object.keys(obj);
}
