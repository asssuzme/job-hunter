# Cashfree IP Whitelist Configuration Guide

## The Error
You're seeing: "IP address not allowed: 35.232.160.115"

This means Cashfree is blocking requests from your Replit server's IP address.

## Solution Steps

1. **Login to Cashfree Dashboard**
   - Go to https://merchant.cashfree.com/merchant/login
   - Use your Cashfree test account credentials

2. **Navigate to API Settings**
   - Click on "Developers" or "API Keys" section
   - Look for "IP Whitelist" or "Security Settings"

3. **Add Replit's IP Address**
   - Add this IP address: `35.232.160.115`
   - You may also want to add: `0.0.0.0/0` for test mode (allows all IPs)
   - Save the changes

4. **Alternative: Disable IP Restriction**
   - In test mode, you can often disable IP restrictions entirely
   - Look for an option like "Allow all IPs" or "Disable IP whitelist"

## Important Notes
- The IP address might change when Replit restarts your workspace
- For production, you should use specific IP addresses for security
- For testing, allowing all IPs (0.0.0.0/0) is acceptable

## After Whitelisting
Once you've added the IP address or disabled IP restrictions in Cashfree:
1. Wait 2-3 minutes for changes to take effect
2. Try the payment flow again
3. The payment should redirect to Cashfree's checkout page

## Need Help?
If you can't find the IP whitelist settings, contact Cashfree support and ask them to:
- Whitelist IP: 35.232.160.115 for your test account
- Or disable IP restrictions for your test merchant ID