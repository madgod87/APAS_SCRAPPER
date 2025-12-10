const puppeteer = require('puppeteer'); // Import Puppeteer for browser automation
const fs = require('fs'); // Import File System module for file operations
const path = require('path'); // Import Path module for handling file paths
const readline = require('readline'); // Import Readline module for handling user input from console

// --- Configuration Variables (Verified URLs) ---
// The URL for the login page
const LOGIN_URL = 'https://apas.nadiaonline.in/';
// The URL for the first page of the report
const FIRST_PAGE_URL = 'https://apas.nadiaonline.in/manage_apas_report_list.php';
// The base URL for pagination, to be appended with page number
const PAGINATION_BASE = 'https://apas.nadiaonline.in/manage_apas_report_list.php?key=&block=';
// CSS selector for the table containing the data
const TABLE_SELECTOR = '#example4';
// ---------------------------------

// Reliable Pause Function
// This function pauses execution and waits for user input (Enter key)
const pause = () => {
    return new Promise(resolve => {
        const stdin = process.stdin;
        const listener = (data) => {
            stdin.pause();
            stdin.removeListener('data', listener);
            resolve(data.toString().trim());
        };
        stdin.resume();
        stdin.once('data', listener);
    });
};

async function runScraper() {
    // Prompt the user for the number of pages to scrape
    console.log("How many pages do you want to scrape? Enter a number and press Enter:");
    const totalPagesInput = await pause();
    const totalPages = parseInt(totalPagesInput, 10); // Parse input to integer

    // Validate the input
    if (isNaN(totalPages) || totalPages <= 0) {
        console.error("Invalid number of pages entered. Exiting.");
        return;
    }

    // Launch a new browser instance with a visible window (headless: false)
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage(); // Open a new tab/page

    // 1. Navigate to the login page and wait for manual interaction
    console.log(`Navigating to login page: ${LOGIN_URL}`);
    await page.goto(LOGIN_URL, { waitUntil: 'networkidle0' }); // Wait until network is idle

    // Instruct user to log in manually
    console.log('*** ACTION REQUIRED: Please log in manually in the browser window. ***');
    console.log(`*** Once you are successfully logged in, return to this terminal and press Enter to start scraping ${totalPages} pages. ***`);

    await pause(); // Wait for user to press Enter
    console.log('Continuing script...');

    // 2. Automated Scraping Loop using URL iteration
    let allData = []; // Array to store all scraped data

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        let targetUrl;

        // Determine the URL for the current page
        if (pageNumber === 1) {
            targetUrl = FIRST_PAGE_URL;
        } else {
            targetUrl = `${PAGINATION_BASE}&p=${pageNumber}`;
        }

        console.log(`--- Navigating to Page ${pageNumber}/${totalPages}: ${targetUrl} ---`);
        await page.goto(targetUrl, { waitUntil: 'networkidle0' });

        // Add a small delay to ensure page elements are fully loaded
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check if the data table exists on the page
        const tableExists = await page.$(TABLE_SELECTOR);
        if (!tableExists) {
            console.error(`Error: Table not found on page ${pageNumber}. Stopping early.`);
            break;
        }

        // 3. Extract the data using the page.evaluate function
        // page.evaluate runs code within the browser context
        const currentPageData = await page.evaluate((tableSel) => {
            const table = document.querySelector(tableSel);
            const rows = Array.from(table.querySelectorAll('tr'));

            // We select the second row (index 1) for the headers, specific to this site's structure
            const headerRowElement = rows[1];

            if (!headerRowElement) {
                console.error("Could not find the header row element at index 1.");
                return [];
            }

            // Extract headers from the specific row element, skipping the last column (often Actions or empty)
            const rawHeaders = Array.from(headerRowElement.querySelectorAll('th, td'));
            const headers = rawHeaders.slice(0, -1).map(cell => cell.innerText.trim());

            const data = [];
            // Start iterating from index 2 (the third row, which is the first data row)
            for (let i = 2; i < rows.length; i++) {
                const cells = Array.from(rows[i].querySelectorAll('td, th'));
                const rowObject = {};
                for (let j = 0; j < cells.length - 1; j++) {
                    // Map cell values to corresponding headers
                    const headerName = headers[j];
                    let cellValue = cells[j].innerText.trim();
                    // Clean up '..more' text from links if present
                    if (cells[j].querySelector('a')) {
                        cellValue = cellValue.replace('..more', '').trim();
                    }
                    rowObject[headerName] = cellValue;
                }
                data.push(rowObject);
            }
            return data;
        }, TABLE_SELECTOR);

        // Add data from current page to the main array
        allData.push(...currentPageData);
        console.log(`Extracted ${currentPageData.length} records from page ${pageNumber}. Total collected: ${allData.length}`);
    }

    await browser.close(); // Close the browser
    console.log('Scraping finished.');

    console.log('--- Final Collected Data Array: ---');
    console.log(allData);
    console.log('-----------------------------------');

    console.log('Generating CSV.');
    generateCSV(allData); // Save data to CSV
}

// Function to convert array of objects to CSV format and save to disk
function generateCSV(data) {
    if (!data || data.length === 0) {
        console.error('No data found to save to CSV.');
        return;
    }

    // Use the keys of the first object for headers
    const headers = Object.keys(data[0]);
    const csvRows = [];
    csvRows.push(headers.join(',')); // Add the header row

    // Iterate over all data objects
    for (const rowObject of data) {
        const values = headers.map(header => {
            const value = rowObject[header] === null || rowObject[header] === undefined ? '' : String(rowObject[header]);
            // Basic CSV escaping: wrap in quotes and escape internal quotes for CSV validity
            return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(','));
    }

    const csvContent = csvRows.join('\n');
    const filePath = path.join(__dirname, 'automated_scrape_results.csv');

    try {
        fs.writeFileSync(filePath, csvContent, 'utf8');
        console.log(`Successfully saved combined data to ${filePath}`);
    } catch (error) {
        console.error(`Failed to write CSV file to disk: ${error.message}`);
        console.log(`Check if you have permission to write to this folder: ${__dirname}`);
    }
}

runScraper().catch(console.error); // Start the scraper and catch any errors
