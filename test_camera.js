const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

    await page.goto('file:///' + 'v:/2025/VIbe-code/museum/index.html', { waitUntil: 'networkidle0' });

    await browser.close();
})();
