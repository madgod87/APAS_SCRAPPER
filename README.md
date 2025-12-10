# APAS Scraper

This is a Node.js project designed to scrape data from `https://apas.nadiaonline.in/`. It uses [Puppeteer](https://pptr.dev/) for browser automation to navigate pages, handle login, and extract table data into a CSV file.

## Features

- **Automated Login Handling**: Navigates to the login page and pauses for manual user authentication.
- **Pagination Support**: Automatically iterates through a user-specified number of pages to collect data.
- **Data Extraction**: robustly extracts table data, including headers and rows.
- **CSV Export**: Saves the collected data into `automated_scrape_results.csv`.

## Prerequisites

- [Node.js](https://nodejs.org/) (installed and configured).
- Valid credentials for `https://apas.nadiaonline.in/`.

## Installation

1.  Clone this repository or download the source code.
2.  Open a terminal in the project directory.
3.  Install the dependencies:

    ```bash
    npm install
    ```

## Usage

1.  Run the scraper script:

    ```bash
    node scrape.js
    ```

2.  **Follow the on-screen prompts**:
    - Enter the number of pages you wish to scrape when prompted in the terminal.
    - A browser window will open and navigate to the login page.
    - **Log in manually** in the browser window.
    - Return to the terminal and press **Enter** to start the automated scraping process.

3.  **View Results**:
    - Once finished, the data will be saved to `automated_scrape_results.csv` in the project folder.

## Project Structure

- `scrape.js`: The main script containing the scraping logic.
- `package.json`: Project configuration and dependencies.
- `automated_scrape_results.csv`: The output file containing the scraped data (generated after running the script).

## Disclaimer

This tool is for educational purposes or authorized use only. Please ensure you have permission to scrape the target website and adhere to its terms of service.
