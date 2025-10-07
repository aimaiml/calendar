# 🚀 Quick Deployment Guide

## Testing Locally

### Option 1: Using Python (if installed)
```bash
# Navigate to project folder
cd f:\dep\Calender

# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Then open: http://localhost:8000
```

### Option 2: Using Node.js (if installed)
```bash
# Install global server
npm install -g http-server

# Navigate to project folder
cd f:\dep\Calender

# Start server
http-server

# Then open: http://localhost:8080
```

### Option 3: Using VS Code Live Server Extension
1. Install "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"

## 📱 Mobile Testing Checklist

### Before Deployment
- [ ] Calendar loads correctly on desktop
- [ ] Calendar loads correctly on mobile (test with browser dev tools)
- [ ] Events display with correct colors
- [ ] Event popups work on both desktop and mobile
- [ ] Admin panel loads and functions correctly
- [ ] JSON generation and copy functionality works
- [ ] All buttons are touch-friendly (minimum 40x40px)
- [ ] Text is readable on small screens (minimum 14px)
- [ ] Navigation works smoothly

### Testing URLs
- **Public Calendar**: `index.html`
- **Admin Panel**: `admin.html` (password: `admin123`)

## 🌐 GitHub Pages Deployment

### Step-by-Step Instructions

1. **Create GitHub Repository**
   ```bash
   # If using Git command line
   git init
   git add .
   git commit -m "Initial commit: Department Calendar"
   git branch -M main
   git remote add origin https://github.com/yourusername/department-calendar.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Scroll to "Pages" section
   - Source: "Deploy from a branch"
   - Branch: "main"
   - Folder: "/ (root)"
   - Click "Save"

3. **Access Your Calendar**
   - Public: `https://yourusername.github.io/department-calendar/`
   - Admin: `https://yourusername.github.io/department-calendar/admin.html`

### Post-Deployment

1. **Test All Functionality**
   - Open public calendar on mobile and desktop
   - Test admin panel functionality
   - Verify event loading and display

2. **Share with Users**
   - Share public URL with students and faculty
   - Share admin URL only with authorized personnel
   - Provide admin password securely

3. **Update Events**
   - Use admin panel to manage events
   - Generate JSON and update repository
   - Changes will be live within 5-10 minutes

## 📋 Pre-Launch Checklist

### Content
- [ ] Update department name in header
- [ ] Set correct academic year
- [ ] Add initial events to events.json
- [ ] Change default admin password
- [ ] Update contact information in footer

### Technical
- [ ] Verify all file paths are correct
- [ ] Test cross-browser compatibility
- [ ] Check mobile responsiveness
- [ ] Validate HTML and CSS
- [ ] Test JavaScript functionality

### Security
- [ ] Change default admin password
- [ ] Ensure admin.html is not linked from public pages
- [ ] Test password protection
- [ ] Verify no sensitive information in public files

## 🔧 Customization Quick Reference

### Colors (style.css)
```css
/* Academic events */
.legend-color.academic { background-color: #3b82f6; }

/* Co-curricular events */
.legend-color.co-curricular { background-color: #16a34a; }
```

### Admin Password (admin.js)
```javascript
const ADMIN_PASSWORD = 'your-secure-password';
```

### Department Info (index.html & admin.html)
```html
<h1 class="department-title">Your Department Name</h1>
<p class="academic-year">Academic Year 2024-25</p>
```

## 🆘 Emergency Fixes

### If Calendar Doesn't Load
1. Check browser console for errors
2. Verify events.json has valid JSON syntax
3. Ensure all files are in same directory
4. Check internet connection (FullCalendar loads from CDN)

### If Admin Panel Doesn't Work
1. Verify password in admin.js
2. Check JavaScript is enabled in browser
3. Clear browser cache and cookies
4. Test in incognito/private browsing mode

### If Mobile View is Broken
1. Check viewport meta tag in HTML
2. Verify CSS media queries
3. Test on actual mobile device
4. Check for JavaScript errors

## 📞 Quick Support Commands

```bash
# Check if files exist
ls -la

# Validate JSON
cat events.json | python -m json.tool

# Start local server (Python)
python -m http.server 8000

# Check Git status
git status

# Force push updates
git add . && git commit -m "Update events" && git push
```

---

**🎉 Your Department Calendar is ready to deploy!**

For detailed instructions, see the main README.md file.