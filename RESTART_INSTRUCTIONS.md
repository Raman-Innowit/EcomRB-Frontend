# How to Fix Connection Issues on Other Devices

## ✅ Code Fixed
The API service has been updated to automatically use the same hostname/IP as the frontend.

## 🔄 Required: Restart Frontend

**IMPORTANT:** You MUST restart your frontend server for the changes to take effect!

### Steps:

1. **Stop the frontend server:**
   - Go to the terminal where `npm start` is running
   - Press `Ctrl+C` to stop it

2. **Restart the frontend:**
   ```bash
   cd frontend
   npm start
   ```

3. **Verify the change:**
   - Open browser console (F12)
   - Look for: `[DEBUG] API Base URL: http://192.168.1.18:8800/api`
   - This confirms it's using your IP instead of localhost

## 🔥 Firewall Setup (One-time)

If you haven't already, open port 8800 in Windows Firewall:

**Option 1: PowerShell (Run as Administrator)**
```powershell
netsh advfirewall firewall add rule name="Flask Backend Port 8800" dir=in action=allow protocol=TCP localport=8800
```

**Option 2: Windows Firewall GUI**
1. Open Windows Defender Firewall → Advanced settings
2. Inbound Rules → New Rule
3. Port → TCP → Specific local ports: `8800`
4. Allow the connection → Next → Apply to all → Name: "Flask Backend Port 8800"

## 🧪 Test from Another Device

1. Make sure both devices are on the same WiFi network
2. On the other device, open: `http://192.168.1.18:3000`
3. Try the password reset page
4. Check browser console - should show `http://192.168.1.18:8800/api` instead of `localhost:8800`

## ✅ Verification

Test backend accessibility from another device:
```
http://192.168.1.18:8800/api/public/products
```

If this shows product data, everything is working!

