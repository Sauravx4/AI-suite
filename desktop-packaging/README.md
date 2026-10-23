# INDOSATI Office Management Suite — Windows Desktop Packaging Guide

This directory contains the files and configuration needed to generate a standalone Windows installer (`.exe` / `.msi`) for **INDOSATI Office Management Suite**.

## Method 1: Instant PWA Desktop Installation (Recommended)
You do not need to compile any code to install INDOSATI on Windows:
1. Open the application in **Microsoft Edge** or **Google Chrome**.
2. Click the **Install** icon in the address bar (or click "Install App" in the top bar).
3. The app is installed locally to Windows, pins to your Start Menu, Taskbar, and desktop, running in an isolated window without browser chrome.

---

## Method 2: Compile Standalone Native Windows Installer (.exe) with Electron

### 1. Build the Web Application
```bash
npm run build
```

### 2. Install Electron & Builder
```bash
npm install --save-dev electron electron-builder
```

### 3. Add Build Script to package.json
```json
{
  "main": "desktop-packaging/electron-main.js",
  "scripts": {
    "dist:win": "electron-builder --win --x64"
  },
  "build": {
    "appId": "com.indosati.officemanagement",
    "productName": "INDOSATI Office Management Suite",
    "directories": {
      "output": "release"
    },
    "win": {
      "target": ["nsis"],
      "icon": "public/pwa-512x512.png"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  }
}
```

### 4. Generate the Windows Installer
```bash
npm run dist:win
```
The resulting `INDOSATI Office Management Suite Setup.exe` will be located in the `release/` folder.
