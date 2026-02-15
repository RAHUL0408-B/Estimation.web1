# Hero Slider Troubleshooting Guide

## Issue
Hero slider is not working/displaying on the homepage.

## Possible Causes & Solutions

### 1. **No Hero Slides in Database**
**Most Common Issue**: The hero slider needs data to be added through the admin dashboard.

#### How to Check:
1. Open browser console (F12)
2. Look for these console messages:
   - `"Home page data loaded:"` - Shows if data exists
   - `"Hero slides:"` - Shows the slides array
   - `"No home page content found for tenant"` - Means no data exists

#### Solution:
**Add Hero Slides via Admin Dashboard:**

1. Go to: `http://localhost:3000/dashboard/website-setup`
2. Click on the **"Pages"** tab
3. Select **"Home"** sub-tab
4. Scroll to **"Hero Slider"** section
5. Click **"Add Slide"**
6. Fill in:
   - **Image URL** (required) - Upload or paste image URL
   - **Heading** (required) - Main title text
   - **Subheading** (optional) - Description text
   - **Primary Button Text** - e.g., "Get Started"
   - **Primary Button Link** - e.g., `/estimate`
   - **Secondary Button Text** (optional)
   - **Secondary Button Link** (optional)
7. Click **"Save"**
8. Refresh the homepage

### 2. **Empty Slides Array**
If `heroSlides` is an empty array `[]`, the slider shows a default fallback.

**Expected Behavior:**
```javascript
// Empty array shows default hero
slides = []  →  Shows "Welcome to Our Interior Design Studio"

// With slides shows slider
slides = [{ id: "1", imageUrl: "...", heading: "..." }]  →  Shows slider
```

### 3. **Firestore Not Initialized**
If you see: `"Firestore not initialized. Cannot load homepage data."`

**Solution:**
- Check that `.env.local` exists in project root
- Verify Firebase credentials are correct
- Restart dev server: `npm run dev`

### 4. **Database Path Issues**
The hero slider data is stored at:
```
tenants/{tenantId}/pages/home
```

**Data Structure:**
```json
{
  "heroSlides": [
    {
      "id": "slide-1",
      "imageUrl": "https://example.com/image.jpg",
      "heading": "Transform Your Space",
      "subheading": "Professional interior design services",
      "primaryButtonText": "Get Started",
      "primaryButtonLink": "/estimate",
      "secondaryButtonText": "View Portfolio",
      "secondaryButtonLink": "/portfolio"
    }
  ]
}
```

## Quick Diagnostic Steps

### Step 1: Check Console Logs
Open browser console and refresh the page. Look for:

✅ **Good Signs:**
```
Home page data loaded: { heroSlides: [...], ... }
Hero slides: [{ id: "...", heading: "..." }]
```

❌ **Problem Signs:**
```
No home page content found for tenant: xxx
Firestore not initialized
Hero slides: []
Hero slides: undefined
```

### Step 2: Verify Tenant ID
Make sure you're visiting the correct tenant URL:
- ✅ `http://localhost:3000/amit-interiors`
- ✅ `http://localhost:3000/your-store-id`
- ❌ `http://localhost:3000` (no tenant)

### Step 3: Check Database
If you have Firebase Console access:
1. Go to Firestore Database
2. Navigate to: `tenants > {your-tenant-id} > pages > home`
3. Check if `heroSlides` field exists and has data

### Step 4: Test with Sample Data
If no data exists, you can manually add it via Firebase Console or use the admin dashboard.

## Testing the Slider

### Minimum Working Example
Add at least one slide with:
- ✅ Valid image URL
- ✅ Heading text
- ✅ At least one button

### Multiple Slides
- Add 2-3 slides to test auto-advance (every 5 seconds)
- Test navigation arrows (left/right)
- Test dot indicators (bottom)

## Common Mistakes

### ❌ Wrong Image URL
```javascript
imageUrl: "image.jpg"  // Won't work - needs full URL
```

### ✅ Correct Image URL
```javascript
imageUrl: "https://example.com/image.jpg"  // Works
imageUrl: "/uploads/tenant-id/hero/image.jpg"  // Works if uploaded
```

### ❌ Missing Required Fields
```javascript
{
  id: "1",
  // Missing imageUrl and heading - won't display properly
}
```

### ✅ Complete Slide
```javascript
{
  id: "1",
  imageUrl: "https://...",
  heading: "Welcome",
  subheading: "Transform your space",
  primaryButtonText: "Get Started",
  primaryButtonLink: "/estimate"
}
```

## Expected Behavior

### With No Slides (Empty Array)
Shows default fallback:
- Dark background
- "Welcome to Our Interior Design Studio"
- "Transform your space into something extraordinary"

### With 1 Slide
- Shows the slide
- No navigation arrows
- No dot indicators
- No auto-advance

### With 2+ Slides
- Shows first slide initially
- Navigation arrows appear (left/right)
- Dot indicators appear (bottom)
- Auto-advances every 5 seconds
- Smooth fade transitions

## Debugging Commands

### Check if data exists:
Open browser console and run:
```javascript
// Check if slides are loaded
console.log(document.querySelector('section').textContent);
```

### Force refresh:
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

## Next Steps

1. **Open browser console** (F12)
2. **Refresh the page**
3. **Look for console logs** about hero slides
4. **Share the console output** if you need more help

### If you see "Hero slides: []"
→ **Add slides via admin dashboard** (see Solution #1 above)

### If you see "No home page content found"
→ **Create home page content** in admin dashboard

### If you see "Firestore not initialized"
→ **Check Firebase configuration** and restart server

---

## Quick Fix Checklist

- [ ] Firebase is initialized (check console for warnings)
- [ ] Visiting correct tenant URL (e.g., `/amit-interiors`)
- [ ] Home page content exists in database
- [ ] `heroSlides` array has at least one slide
- [ ] Each slide has `imageUrl` and `heading`
- [ ] Image URLs are valid and accessible
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser cache cleared (hard refresh)

---

**Status**: Enhanced with better error logging
**Files Modified**: `src/app/(storefront)/[tenantId]/page.tsx`
**Console Logs Added**: Yes - shows hero slides data
