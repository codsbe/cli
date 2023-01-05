#!/usr/bin/env node

const prompts = require('prompts')
const {green, blue, red} = require('kleur')
const {spawn} = require('child_process');
const ora = require('ora');
const {promises, statSync, readdirSync} = require('fs');
const {rename} = promises;
const rimraf = require("rimraf");
const path = require("path");
const replace = require('replace-in-file');
const {folderReplacements, nestedInViewFolder, pathReplacements, template} = require('../config');


(async () => {
    const response = await prompts([{
        type: 'text',
        name: 'name',
        message: `What's your project name?`,
        validate: value => value.match(/^[a-z\d]+$/i) ? true : 'Project name must be alphanumeric'
    }, {
        type: 'select',
        name: 'language',
        message: 'Please choose a language',
        choices: [{title: 'TypeScript', value: 'ts'}, {title: 'JavaScript', value: 'js'},],
    }, {
        type: 'select',
        name: 'storeType',
        message: 'Store type',
        choices: [
            // {title: 'Redux Toolkit', value: 'reduxToolkit'},
            {title: 'Redux Saga',value: 'reduxSaga'},
            {title: 'Redux Query', value: 'reduxQuery'},
            // {title: 'Mobix', value: 'mobix'}
        ],
    }]);


    const {name, storeType, language} = response;


    if (name && storeType && language) {
        const templateWithLanguageAndStoreType = template[language]
        try {
            const command = spawn(`npx`, ['react-native', 'init', `${name}`, '--template', templateWithLanguageAndStoreType, '--skip-install']);

            command.stdout.on('data', (data) => {
                console.log(blue(`${data}`));

            });

            let spinner = null

            command.stderr.on('data', (data) => {
                spinner?.stop()?.clear()
                spinner = ora({
                    text: `${data}`, spinner: 'dots',

                }).start();
                if (`${data}`.includes('error')) {
                    spinner.fail(red(`${data}`.replace('error', '')))
                }
                if (`${data}`.includes('✔')) {
                    spinner.succeed(green(`${data}`.replace('✔', '')))
                }
                if (`${data}`.includes('ℹ')) {
                    spinner.info(blue(`${data}`.replace('ℹ', '')))
                }

            });
            command.on('close', async (code) => {

                try {

                    const files = await promises.readdir(`./${name}/src/${folderReplacements[storeType]}`);
                    await Promise.all(files.map(async (item) => {

                        const oldPath = `./${name}/src/${folderReplacements[storeType]}/${item}`;
                        const newPath = `./${name}/src/${item}`;

                        try {
                            if (nestedInViewFolder.includes(item)) {
                                const path = `./${name}/src/view/${item}`
                                rimraf.sync(path);
                            }
                            rename(oldPath, newPath, function (err) {
                                if (err) throw err
                            })

                        } catch (error) {
                            return Promise.reject(new Error('Sorry, an error occurred during the onDirectoryFound function, contact the developer of the plugin'));
                        }
                    }),);
                    rimraf.sync(`./${name}/src/store_types`);
                    const result = getAllFiles(`./${name}/src`)
                    for (const item of result) {
                        for (const key of Object.keys(pathReplacements[storeType])) {
                            const options = {
                                files: item, from: key, to: pathReplacements[storeType][key],
                            };
                            try {
                                await replace(options)
                            } catch (error) {
                                console.error('Error occurred:', error);
                            }
                        }
                    }


                    const child = spawn(`cd ./${name} && yarn install`, {shell: true});


                    child.stdout.on('data', function (data) {
                        spinner?.stop()?.clear()
                        spinner = ora({
                            text: `Installing dependencies`, spinner: 'dots',

                        }).start();
                        if (`${data}`.match('Done in')) {
                            spinner.succeed(green(`${data}`))
                            spawn(`cd ./${name} && yarn lint:fix`, {shell: true});
                            const podInstall = spawn(`cd ./${name}/ios && pod install`, {shell: true});
                            podInstall.stdout.on('data', function (data) {
                                spinner?.stop()?.clear()
                                spinner = ora({
                                    text: `Installing Pod dependencies`, spinner: 'aesthetic',

                                }).start();
                                if (`${data}`.match('Pod installation complete')) {
                                    spinner.succeed(green(`${data}`))
                                    console.log('\n\n\n\n',blue(`Happy coding!`));
                                }
                            })
                        }
                    });


                } catch (error) {}
            })

        } catch (error) {
            console.log(red(error));
        }

    } else {
        console.log(red(`You canceled the ${name || 'unnamed'} project creation!`), green('\n\n\nThanks for trying!'), '❤️');
    }

})();


const getAllFiles = function (dirPath, arrayOfFiles) {
    files = readdirSync(dirPath)

    arrayOfFiles = arrayOfFiles || []

    files.forEach(function (file) {
        if (statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
        }
    })

    return arrayOfFiles
}


