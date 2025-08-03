# Google OAuth Verification Fix Guide

## Current Issues

Based on the Google OAuth verification screenshot, there are two issues that need to be fixed in the Google Cloud Console:

1. **Homepage requirements** - "Your home page does not include a link to your privacy policy"
2. **Privacy policy requirements** - "Your privacy policy URL is the same as your home page URL"

## Solution

### Step 1: Update OAuth 2.0 Consent Screen Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** > **OAuth consent screen**
3. Click **Edit App**

### Step 2: Update Application Homepage

In the **App information** section:
- **Application home page**: `https://gigfloww.com`

### Step 3: Update Privacy Policy URL

In the **App information** section:
- **Privacy policy link**: `https://gigfloww.com/privacy-policy`

**Important**: Make sure the privacy policy URL is different from the homepage URL.

### Step 4: Update Terms of Service URL

In the **App information** section:
- **Terms of service link**: `https://gigfloww.com/terms-of-service`

### Step 5: Save Changes

1. Click **Save and Continue**
2. Review all sections
3. Submit for verification if prompted

## What We've Already Done

1. ✅ Added Privacy Policy link in the navigation header of the landing page
2. ✅ Added Privacy Policy link in the footer (already existed)
3. ✅ Created a dedicated Privacy Policy page at `/privacy-policy`
4. ✅ Created a dedicated Terms of Service page at `/terms-of-service`
5. ✅ Ensured Privacy Policy URL is different from homepage URL

## Verification

After updating the Google Cloud Console settings:

1. The homepage (https://gigfloww.com) now has visible Privacy Policy links in:
   - Navigation header
   - Footer

2. The Privacy Policy page is accessible at: https://gigfloww.com/privacy-policy

3. The Terms of Service page is accessible at: https://gigfloww.com/terms-of-service

The verification should pass once Google's system re-crawls your site with the updated configuration.