/* //import puppeteer from 'puppeteer';
const puppeteer = require('puppeteer');
async function executeCodeSnippet() {
  try {
    // Launch a headless browser
 //   const browser = await puppeteer.launch();
    const browser = await puppeteer.launch({ headless: "new" });


    // Create a new page
    const page = await browser.newPage();

    // Your code snippet to be executed
    const codeSnippet = `
      // Your code goes here
      console.log('\n\n\n pratheesh Hello, world!');
    `;

    // Evaluate the code snippet on the page
    await page.evaluate(codeSnippet);

    // Close the browser
    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
}
executeCodeSnippet(); */

const puppeteer = require('puppeteer');

async function executeCodeSnippet() {
  try {
    // Launch a headless browser
    const browser = await puppeteer.launch({ headless: "new" });

    // Create a new page
    const page = await browser.newPage();

    // Your code snippet to be executed
    const codeSnippet = `
      // Your code goes here
      console.log('\n\n\n pratheesh Hello, world!');
    `;

    // Evaluate the code snippet on the page
    await page.evaluate(codeSnippet);

    // Close the browser
    await browser.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

executeCodeSnippet();
