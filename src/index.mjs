import * as fs from 'fs';

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import { createObjectCsvWriter } from 'csv-writer';

import { getCmdLineVars } from './utils.mjs';

const OUTPUT_DIRECTORY ='output';

(async () => {
    const browser = await puppeteer
        .use(StealthPlugin())
        .launch({
            protocolTimeout: 300000,
            defaultViewport: null,
            headless: true
        });
    const page = await browser.newPage();
    let payload = [];
    try {
        let { urls } = getCmdLineVars(); // get urls
        urls = urls.split(',');
        for (let url of urls) { // loop urls
            console.log(`Loading ${url}...`);
            await page.goto(url); // goto page
            const results = await page.evaluate(async () => { // get page aprameters

                const sleep = ms => new Promise(res => setTimeout(res, ms));
                await sleep((1000 * 60) * .25); // wait for page to load

                if (!window._pbjsGlobals) return null; // return null if no PBJS found

                const result = window._pbjsGlobals.map((pbjs) => {
                    const { version, installedModules } = window[pbjs];
                    return {
                        instance: pbjs, // instance name
                        url: location.href, // url
                        version, // version
                        installedModules // list of installed modules
                    }
                })
                return result;
            });
            payload = payload.concat(results);
        }
        console.log(`Outputing file...`)
        if (!fs.existsSync(OUTPUT_DIRECTORY)) fs.mkdirSync(OUTPUT_DIRECTORY);
        const csvWriter = createObjectCsvWriter({
            path: `${OUTPUT_DIRECTORY}/${Date.now()}-output.csv`,
            header: [
                {id: 'url', title: 'URL'},
                {id: 'instance', title: 'PBJS Instance'},
                {id: 'version', title: 'PBJS Version'},
                {id: 'installedModules', title: 'PBJS Installed Modules'},
            ]
        });
        await csvWriter.writeRecords(payload);
    } catch (e) {
        console.error(e);
    } finally {
        await page.close();
        await browser.close();
        console.log('Finished!')
    }
})()