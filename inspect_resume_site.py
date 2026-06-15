import asyncio
from playwright.async_api import async_playwright

async def inspect_website():
    print("=== Inspecting resume-ai-coach.rasuonline.in ===")
    
    async with async_playwright() as p:
        # Launch browser in headless mode to inspect quickly
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Navigate to the page
        print("Navigating to the site...")
        await page.goto("https://resume-ai-coach.rasuonline.in/", wait_until="networkidle")
        
        # 1. Print Page Title
        title = await page.title()
        print(f"Page Title: '{title}'")
        
        # 2. Capture a screenshot so we can see what it looks like
        await page.screenshot(path="resume_coach_main.png")
        print("Screenshot saved to 'resume_coach_main.png'")
        
        # 3. Locate and list headings (h1, h2)
        print("\n--- Main Headings found ---")
        h1s = await page.locator("h1").all_inner_texts()
        for idx, h1 in enumerate(h1s, 1):
            print(f"H1 [{idx}]: {h1.strip()}")
            
        h2s = await page.locator("h2").all_inner_texts()
        for idx, h2 in enumerate(h2s, 1):
            print(f"H2 [{idx}]: {h2.strip()}")
            
        # 4. Locate and list buttons/links
        print("\n--- Buttons found ---")
        buttons = await page.locator("button").all()
        for idx, btn in enumerate(buttons, 1):
            txt = await btn.inner_text()
            btn_class = await btn.get_attribute("class")
            print(f"Button [{idx}]: text='{txt.strip()}', class='{btn_class}'")
            
        print("\n--- Anchors (Links) found ---")
        links = await page.locator("a").all()
        for idx, lnk in enumerate(links[:10], 1):
            txt = await lnk.inner_text()
            href = await lnk.get_attribute("href")
            print(f"Link [{idx}]: text='{txt.strip()}', href='{href}'")
            
        await browser.close()
        print("\n=== Inspection Completed! ===")

if __name__ == "__main__":
    asyncio.run(inspect_website())
