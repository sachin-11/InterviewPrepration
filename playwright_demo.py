import asyncio
import json
from playwright.async_api import async_playwright

async def run_practical_demo():
    print("=== Playwright Practical Starting ===")
    
    # 1. Start Playwright and launch Chromium Browser
    async with async_playwright() as p:
        # headless=False means you can actually see the browser window pop up!
        # slow_mo=500 slows down actions by 500ms so you can easily observe them.
        print("Launching browser...")
        browser = await p.chromium.launch(headless=False, slow_mo=500)
        
        # Create a new isolated browser context (like a new incognito window)
        context = await browser.new_context()
        page = await context.new_page()
        
        # 2. Go to Hacker News
        print("Navigating to HN...")
        await page.goto("https://news.ycombinator.com", wait_until="networkidle")
        
        # 3. Take a screenshot
        print("Taking screenshot of the page...")
        await page.screenshot(path="hacker_news_screenshot.png")
        print("Screenshot saved as 'hacker_news_screenshot.png'")
        
        # 4. Extract data using selectors
        print("Extracting top 10 articles...")
        articles_data = []
        
        # Locator for the title lines
        title_elements = await page.locator(".titleline").all()
        
        for idx, title_el in enumerate(title_elements[:10], 1):
            # Find the anchor tag inside titleline
            link_el = title_el.locator("a").first
            title_text = await link_el.inner_text()
            href = await link_el.get_attribute("href")
            
            # Clean non-ASCII characters from title if any for safe console logging
            safe_title = title_text.encode('ascii', 'ignore').decode('ascii')
            print(f"   {idx}. {safe_title}")
            
            articles_data.append({
                "rank": idx,
                "title": title_text,
                "url": href
            })
            
        # 5. Save the data to a JSON file
        with open("hacker_news_top10.json", "w", encoding="utf-8") as f:
            json.dump(articles_data, f, indent=4)
        print("Extracted data saved to 'hacker_news_top10.json'")
        
        # Keep the browser open for 10 seconds before closing
        print("\n⏳ Browser staying open for 10 seconds so you can view it...")
        for i in range(10, 0, -1):
            print(f"Closing in {i} seconds...")
            await asyncio.sleep(1)
            
        # 6. Close the browser
        print("Closing browser...")
        await browser.close()
        print("=== Practical demo completed successfully! ===")

if __name__ == "__main__":
    asyncio.run(run_practical_demo())
