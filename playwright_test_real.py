import asyncio
from playwright.async_api import async_playwright

async def run_real_website_test():
    print("=== Starting Real Website E2E Test (TodoMVC) ===")
    
    async with async_playwright() as p:
        # Launch browser in visible mode with slow_mo to observe
        browser = await p.chromium.launch(headless=False, slow_mo=800)
        context = await browser.new_context()
        page = await context.new_page()
        
        # 1. Navigate to the website
        print("1. Opening TodoMVC Application...")
        await page.goto("https://demo.playwright.dev/todomvc/", wait_until="networkidle")
        
        # Assertion: Check that we are on the correct page
        title = await page.title()
        print(f"   Page Title: '{title}'")
        assert "Todo" in title, "Assertion Failed: Title does not match!"
        
        # 2. Add New Tasks (Type and press Enter)
        print("\n2. Adding items to the Todo list...")
        new_todo_input = page.locator(".new-todo")
        
        await new_todo_input.fill("Learn Playwright Basics")
        await new_todo_input.press("Enter")
        
        await new_todo_input.fill("Build an AI Agent Tool")
        await new_todo_input.press("Enter")
        
        await new_todo_input.fill("Prepare for System Design Interview")
        await new_todo_input.press("Enter")
        
        # 3. Assert count of items added
        print("\n3. Verifying the number of items added...")
        todo_items = page.locator(".todo-list li")
        count = await todo_items.count()
        print(f"   Total items in list: {count}")
        assert count == 3, f"Assertion Failed: Expected 3 items, found {count}!"
        print("   ✅ Count Assertion Passed!")
        
        # 4. Check/Complete the first item
        print("\n4. Marking the first item as 'Completed'...")
        # Select the toggle checkbox of the first item
        first_item_checkbox = todo_items.nth(0).locator(".toggle")
        await first_item_checkbox.check()
        
        # 5. Assert that the first item is completed
        # In TodoMVC, completed items get a 'completed' CSS class
        first_item_class = await todo_items.nth(0).get_attribute("class")
        print(f"   First item CSS class: '{first_item_class}'")
        assert "completed" in first_item_class, "Assertion Failed: First item was not marked completed!"
        print("   ✅ Completion state Assertion Passed!")
        
        # 6. Filter items by 'Active'
        print("\n6. Clicking 'Active' filter...")
        await page.locator("text=Active").click()
        active_count = await todo_items.count()
        print(f"   Active items count (should be 2): {active_count}")
        assert active_count == 2, f"Assertion Failed: Expected 2 active items, found {active_count}!"
        print("   ✅ Filter Assertion Passed!")
        
        # 7. Take Screenshot of final state
        print("\n7. Taking screenshot of the completed test state...")
        await page.screenshot(path="todomvc_test_result.png")
        print("   Screenshot saved as 'todomvc_test_result.png'")
        
        # Keep browser open for 5 seconds to let you see the final active state
        print("\n⏳ Browser staying open for 5 seconds before clean shutdown...")
        await asyncio.sleep(5)
        
        await browser.close()
        print("\n=== E2E Test Completed Successfully (All Assertions Passed)! ===")

if __name__ == "__main__":
    asyncio.run(run_real_website_test())
