import asyncio
from playwright.async_api import async_playwright

async def run_resume_coach_test():
    print("=== Starting E2E Test for AI Resume Coach ===")
    
    async with async_playwright() as p:
        # Launch browser in visible mode
        browser = await p.chromium.launch(headless=False, slow_mo=1000)
        context = await browser.new_context()
        page = await context.new_page()
        
        # Step 1: Navigate to Home Page
        print("\n1. Navigating to AI Resume Coach...")
        await page.goto("https://resume-ai-coach.rasuonline.in/", wait_until="networkidle")
        
        # Verify page title
        title = await page.title()
        print(f"   Page Title: '{title}'")
        assert "AI Resume Coach" in title, "Assertion Failed: Title does not match!"
        print("   ✅ Title Assertion Passed!")
        
        # Verify H1 Heading exists
        h1_text = await page.locator("h1").first.inner_text()
        safe_h1 = h1_text.encode('ascii', 'ignore').decode('ascii').strip().replace("\n", " ")
        print(f"   H1 Heading: '{safe_h1}'")
        assert "Ace Every Interview" in h1_text, "Assertion Failed: Main heading not found!"
        print("   ✅ H1 Heading Assertion Passed!")
        
        # Step 2: Test Navigation to Registration Page
        print("\n2. Testing 'Get Started Free' navigation...")
        # Locate the link by its text 'Get Started Free' and click
        await page.locator("text=Get Started Free").first.click()
        await page.wait_for_load_state("networkidle")
        
        # Assert url ends with /register
        current_url = page.url
        print(f"   Current URL: {current_url}")
        assert "/register" in current_url, "Assertion Failed: Did not navigate to register page!"
        print("   ✅ Registration Navigation Assertion Passed!")
        
        # Take a screenshot of registration page
        await page.screenshot(path="resume_coach_register_page.png")
        print("   Screenshot saved as 'resume_coach_register_page.png'")
        
        # Step 3: Test Login Validation
        print("\n3. Testing Login Page and Invalid Authentication Flow...")
        # Navigate to login directly
        await page.goto("https://resume-ai-coach.rasuonline.in/login", wait_until="networkidle")
        
        # Locate inputs
        email_input = page.locator("input[type='email']")
        password_input = page.locator("input[type='password']")
        
        # Enter credentials
        print("   Filling invalid credentials...")
        await email_input.fill("test_candidate@gmail.com")
        await password_input.fill("WrongPassword123")
        
        # Submit the login form
        # Locate submit button (looking for button with text containing 'Sign In' or 'Login')
        submit_btn = page.locator("button[type='submit']")
        await submit_btn.click()
        await page.wait_for_load_state("networkidle")
        
        # Check validation or error feedback (e.g. showing "Invalid credentials" toast or keeping user on login page)
        print("   Verifying error/redirect state after failed login...")
        post_login_url = page.url
        print(f"   URL after submit: {post_login_url}")
        
        # Since login failed, it should not redirect to the dashboard
        assert "/dashboard" not in post_login_url, "Assertion Failed: Redirected to dashboard on invalid login!"
        print("   ✅ Authentication Guard Assertion Passed!")
        
        # Take final screenshot of error state
        await page.screenshot(path="resume_coach_login_failed.png")
        print("   Login fail screenshot saved as 'resume_coach_login_failed.png'")
        
        # Keep open for 5 seconds to observe
        print("\n⏳ Keeping browser open for 5 seconds...")
        await asyncio.sleep(5)
        
        await browser.close()
        print("\n=== All Website E2E Tests Completed Successfully (All Assertions Passed)! ===")

if __name__ == "__main__":
    asyncio.run(run_resume_coach_test())
