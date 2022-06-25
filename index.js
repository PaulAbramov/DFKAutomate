import puppeteer from 'puppeteer'
import dappeteer from '@chainsafe/dappeteer';
import {Profession} from './profession.js';

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// For todays date;
Date.prototype.today = function () { 
    return ((this.getDate() < 10)?"0":"") + this.getDate() +"/"+(((this.getMonth()+1) < 10)?"0":"") + (this.getMonth()+1) +"/"+ this.getFullYear();
}

// For the time now
Date.prototype.timeNow = function () {
     return ((this.getHours() < 10)?"0":"") + this.getHours() +":"+ ((this.getMinutes() < 10)?"0":"") + this.getMinutes() +":"+ ((this.getSeconds() < 10)?"0":"") + this.getSeconds();
}

async function exitApp(browser) {
    await browser.close();
    process.exit(0);
}

async function login(page, metamask) {
    await page.goto('https://beta.defikingdoms.com/#/professions')

    var startGame = await page.waitForXPath('//button[@class="Buttons_new__3FSMs"]');
    await startGame.click();

    await page.waitForXPath('//div[@class="ConnectModal_connectTextContent__3K0PH"]//button[@class="Buttons_new__3FSMs"]', { timeout: 2000 });

    while(true) {
        try {
            var connectWallet = await page.$x('//div[@class="ConnectModal_connectTextContent__3K0PH"]//button[@class="Buttons_new__3FSMs"]');

            console.log(connectWallet);

            if(connectWallet.length > 0) {
                await connectWallet[0].click();
                await metamask.approve();
            } else {
                await sleep(2000);
                await page.bringToFront();
                await sleep(2000);
                break;
            }
        } catch(err) {
        }
            
        await sleep(2000);
        await page.bringToFront();
        await sleep(2000);
    }

    var betapopup = await page.waitForXPath('//button[contains(@class, "Buttons_primary__Dm8vM")]', { timeout: 2000 });
    await betapopup.click();
}

async function doQuest(page, metamask, browser, profession) {
    console.log(new Date().today() + " " + new Date().timeNow() + " " +'click start ' + profession + ' quest');
    var startQuestButton = await page.waitForXPath('//button[@class="Buttons_new__3FSMs"]');
    await startQuestButton.click();

    await sleep(1000);

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'click select hero, ' + profession + ' quest');
    var selectHero = await page.waitForXPath('//img[contains(@src, "heroselect")]/..');
    await selectHero.click();

    if(profession === Profession.Gardening.name) {
        console.log(new Date().today() + " " + new Date().timeNow() + " " +'select the correct pool, ' + profession + ' quest');
        await page.waitForXPath('//div[contains(text(), "JEWEL")]', { timeout: 120000 });
        const pools = await page.$x('//div[contains(@class, "bordered-box-thin")]');

        let counter;
        for (counter = 0; counter < pools.length; counter++) {
            let name = await pools[counter].evaluate(el => el.textContent);
            if(name.startsWith("JEWEL-ONE")) {
                var selectPoolButton = await pools[counter].waitForXPath('.//button[@class="Buttons_primary__Dm8vM"]');
                await selectPoolButton.click();
            }
        }
    }

    await sleep(1000);

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'check hero for 25 stamina ' + profession + ' quest');
    await page.waitForXPath('//h4[contains(text(), "Profession")]/../p');
    const heros = await page.$x('//h4[contains(text(), "Profession")]/../p');

    let heroCounter;
    let selectedHeroCount = 0;
    for(heroCounter = 0; heroCounter < heros.length; heroCounter++) {
        let professionToCheck = await heros[heroCounter].evaluate(el => el.textContent);
        console.log(new Date().today() + " " + new Date().timeNow() + " " +'hero with profession: ' + professionToCheck);
        
        await sleep(1000);

        if(professionToCheck === profession) {
            var staminaHero = await heros[heroCounter].$x('./../..//div[contains(text(),"Stamina")]//div[2]');
            let stamina = await staminaHero[0].evaluate(el => el.textContent);
            console.log(new Date().today() + " " + new Date().timeNow() + " " +'hero has ' + stamina + ' stamina, ' + profession + ' quest');

            var staminaNumber = stamina.split("/")[0];
            if(staminaNumber >= 25) {
                console.log(new Date().today() + " " + new Date().timeNow() + " " +'hero has 25 or more energy, select him, ' + profession + ' quest');
                
                var test = await heros[heroCounter].$x('./../..');
                console.log(await test[0].evaluate(el => el.tagName));
                var test2 = await test[0].$x('.//span[contains(text(),"Select")]/..');

                console.log(await test2[0].evaluate(el => el.tagName));
                
                var selectHero = await heros[heroCounter].$x('./../..//span[contains(text(),"Select")]/..');// page.$x('//div[contains(@class,"buy-heroes-list-box")][1]//button');
                await selectHero[0].click();

                selectedHeroCount++;
            } else {
                console.log(new Date().today() + " " + new Date().timeNow() + " " +'not enough energy: ', staminaNumber);
                continue;
            }

            if(profession === Profession.Gardening.name || selectedHeroCount == 6) {
                break;
            }
        }
    }

    if(selectedHeroCount > 0) {
        if(profession !== Profession.Gardening.name) {
            console.log(new Date().today() + " " + new Date().timeNow() + " " +'heroes selected, continue, ' + profession + ' quest');
            var continueButton = await page.waitForXPath('//div[contains(@class,"continueButtonWrapper")]//button');
            continueButton.click();
        }
        
        console.log(new Date().today() + " " + new Date().timeNow() + " " +'start quest, ' + profession + ' quest');
        var startQuest = await page.waitForXPath('//button[contains(@class,"Buttons_primary__Dm8vM")]');
        await startQuest.click();

        while(true) {
            try {
                console.log(new Date().today() + " " + new Date().timeNow() + " " +'confirm start quest transaction, ' + profession + ' quest');
                await metamask.confirmTransaction();
            }
            catch(err) {
                await sleep(1000);
                await page.bringToFront();
                await sleep(1000);
                await startQuest.click();
                continue;
            }

            await page.bringToFront();
            await sleep(1000);

            await page.keyboard.press('Escape');
            await sleep(1000);
            await page.keyboard.press('Escape');
            await sleep(1000);
            return;
        }
    }

    await page.keyboard.press('Escape');
    await sleep(1000);
    await page.keyboard.press('Escape');
    await sleep(1000);
}

async function doCheckQuest(page, metamask, browser, profession) {
    console.log(new Date().today() + " " + new Date().timeNow() + " " +'open ' + profession + ' context');

    var pathToQuestMaster = "";
    switch(profession) {
        case Profession.Fishing.name:
            pathToQuestMaster = '//button[contains(@class,"fisher-clickbox")]';
            break;
        case Profession.Foraging.name:
            pathToQuestMaster = '//button[contains(@class,"forager-clickbox")]';
            break;
        case Profession.Gardening.name:
            pathToQuestMaster = '//button[contains(@class,"gardener-clickbox")]';
            break;
        case Profession.Mining.name:
            pathToQuestMaster = '//button[contains(@class,"miner-clickbox")]';
            break;
        default:
            console.log('profession not defined');
            return;
    }

    var questMaster = await page.waitForXPath(pathToQuestMaster);
    await questMaster.click();

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'get active ' + profession + ' quest');
    var activeQuestButton;
    try {
        activeQuestButton = await page.waitForXPath('//span[contains(text(),"Active")]');

    } catch(err) {
        await doQuest(page, metamask, browser, profession);
        return;
    }

    await activeQuestButton.click();

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'click complete ' + profession + ' quest');
    await page.waitForXPath('//button[@class="Buttons_primary__Dm8vM"]');
    var completeQuestButton = await page.$x('//button[@class="Buttons_primary__Dm8vM"]');

    var questStillOngoing = "";
    switch(profession) {
        case Profession.Fishing.name:
        case Profession.Foraging.name:
            questStillOngoing = '//p[contains(text(),"Complete Quest")]';
            break;
        case Profession.Gardening.name:
            questStillOngoing = '//p[contains(text(),"Stop Gardening")]';
            break;
        case Profession.Mining.name:
            questStillOngoing = '//p[contains(text(),"Stop Mining")]';
            break;
        default:
            console.log('profession not defined');
            return;
    }

    var stillWorking = await page.waitForXPath(questStillOngoing);
    if(profession == Profession.Fishing || profession == Profession.Foraging) {
        if(stillWorking == null) {
            console.log(new Date().today() + " " + new Date().timeNow() + " " +'still working on ' + profession + ', return');
            return;
        } else {
            await completeQuestButton[1].click();
        }
    } else {
        if(stillWorking != null) {
            console.log(new Date().today() + " " + new Date().timeNow() + " " +'still working on ' + profession + ', return');
            return;
        } else {
            await completeQuestButton[0].click();
        }
    }

    await sleep(3000);

    while(true) {
        try {
            console.log(new Date().today() + " " + new Date().timeNow() + " " +'confirm complete quest transaction, ' + profession + ' quest');
            await metamask.confirmTransaction();
        }
        catch(err) {
            await sleep(1000);
            await page.bringToFront();
            await sleep(1000);

            if(profession == Profession.Fishing ||
                profession == Profession.Foraging) {
                await completeQuestButton[1].click();
            } else {
                await completeQuestButton[0].click();
            }
            continue;
        }
        break;
    }

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'bring page back to front, ' + profession + ' quest');
    await page.bringToFront();
    await sleep(1000);

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'close quest result popup, ' + profession + ' quest');
    var closePopup = await page.waitForXPath('//button[@class="FancyModal_frameClose__3RnBs"]');
    await closePopup.click();

    console.log(new Date().today() + " " + new Date().timeNow() + " " +'go back to the profession overview, ' + profession + ' quest');
    await page.keyboard.press('Escape');
    await sleep(1000);
    await page.keyboard.press('Escape');
    await sleep(1000);
}

async function main() {
    const browser = await dappeteer.launch(puppeteer, { metamaskVersion: 'v10.8.1', defaultViewport: null });
    const metamask = await dappeteer.setupMetamask(browser,{seed: "YOUR METAMASK SEED HERE", password: "YOUR METAMASK PASSWORD HERE"});

    await metamask.addNetwork({networkName: "Harmony Mainnet",rpc: "https://api.harmony.one/",chainId: "1666600000",symbol: "ONE"})
    await metamask.switchNetwork('Harmony Mainnet')

    const page = await browser.newPage();
    
    await login(page, metamask);
    await sleep(4000);

    let professions = Object.keys(Profession);
    for (const profession of professions) {
        await doCheckQuest(page, metamask, browser, profession)
        await sleep(1000);
    }

    await exitApp(browser);
}
main();
