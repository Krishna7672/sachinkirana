# 🛒 Sachin Kirana Invoice Generator & POS

A modern, responsive, and fully offline-capable Point-of-Sale (POS) and invoice generation web application built specifically for Kirana (grocery) stores. 

This project is built completely with **Vanilla JavaScript, HTML5, and CSS3**—no backend, no complex frameworks, and no database required. All data is securely persisted in the browser's LocalStorage.

---

## ✨ Features

- **📱 Mobile-First Modern UI**: Clean design with a smooth Dark/Light mode toggle.
- **📷 Dual Barcode Scanning**: 
  - Supports physical USB/Bluetooth laser barcode scanners.
  - Built-in real camera scanner (uses the back camera on mobile and webcam/DroidCam on PC) via `html5-qrcode`.
- **⚖️ Custom Units & Quantities**: Select or type custom units like `kg`, `g`, `Liter`, `Pack of 12`, etc.
- **💾 Local Storage Persistence**: Automatically saves all generated invoices and tracks pending payments permanently in the browser.
- **⏳ Pending Bills Tracker**: Dedicated dashboard to track "Pay Later" customers, mark bills as paid, and send WhatsApp reminders.
- **💬 WhatsApp API Integration**: Automatically formats bills and sends WhatsApp messages/reminders to customers with automatic +91 country code formatting.
- **📄 Export & Print**: Download receipts as text (`.txt`) files or print them as beautiful PDFs directly from the browser.

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **Icons**: FontAwesome (via CDN).
- **Camera Scanner**: `html5-qrcode` library (via CDN).
- **Storage**: Browser LocalStorage API.

---

## 🚀 Setup & Installation

**⚠️ CRITICAL NOTE FOR CAMERA SCANNER:** Modern browsers block camera access if you open the HTML file directly by double-clicking it (e.g., `file:///C:/...`). To use the camera feature, you **must** serve the files over a local web server or HTTPS.

### Option 1: VS Code (Recommended)
1. Download or clone this repository.
2. Open the folder in **Visual Studio Code**.
3. Install the **Live Server** extension by Ritwick Dey.
4. Right-click `index.html` and select **"Open with Live Server"**.
5. The app will open in your browser at `http://127.0.0.1:5500`.

### Option 2: Python Local Server
If you have Python installed, open your terminal in the project folder and run:
```bash
python -m http.server 8000
