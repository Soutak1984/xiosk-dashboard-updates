XiOSK Dashboard Updates – Password Protection
=============================================

This repository contains updated files to add **simple password protection** to the original XiOSK kiosk dashboard.

Features added:
• Login screen (default password: admin@123)
• "Change Password" option after successful login
• Password stored securely using bcrypt (in dashboard/password.hash)
• Session remembered in browser localStorage (~24 hours)
• New server endpoints: /login and /password

Files included in this repo
---------------------------
.
├── index.ts                    # Main Deno server with added authentication endpoints
└── dashboard/
    ├── index.html              # Dashboard HTML with login screen + change password modal
    └── script.js               # Client-side JavaScript (login logic + original functions)

Note: password.hash is NOT included in the repo.
      It will be automatically created on first server run with the default password hash.


How to apply these updates on your Raspberry Pi
-----------------------------------------------

1. Navigate to your XiOSK installation folder

   cd /opt/xiosk


2. Make a backup (strongly recommended)

   sudo cp -r dashboard dashboard-backup-$(date +%Y%m%d)
   sudo cp index.ts index.ts.backup-$(date +%Y%m%d)  2>/dev/null || true


3. Download the updated files

   sudo curl -L https://raw.githubusercontent.com/Soutak1984/xiosk-dashboard-updates/main/dashboard/index.html -o /opt/xiosk/dashboard/index.html
   
   sudo curl -L https://raw.githubusercontent.com/Soutak1984/xiosk-dashboard-updates/main/dashboard/script.js -o /opt/xiosk/dashboard/script.js
   
   sudo reboot
   



First login
-----------
Open: http://<raspberry-pi-ip>/
Default password: admin@123

After login you can change the password using the "Change Password" button in the top bar.


Important Security Notes
------------------------
• This is BASIC protection — suitable for local network / trusted environments
• No CSRF protection, no rate limiting, no HTTPS enforcement
• Session is stored in localStorage (clears when browser data is cleared)
• For internet-facing deployment: use proper authentication (e.g. reverse proxy with basic auth, OAuth, etc.)


Original Project
----------------
This is an extension of the excellent XiOSK project by debloper:
https://github.com/debloper/xiosk


License
-------
MIT (same as the original XiOSK project)

Made with ❤️ for the XiOSK community  
— soutak   (March 2025–2026)
