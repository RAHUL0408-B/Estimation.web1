# Hero Slider Setup Guide - Complete Fix

## ✅ Current Status
**NO DUPLICATE FILES FOUND** - All files are correctly placed:
- ✅ `src/components/storefront/HeroSlider.tsx` - Component file (ONLY ONE)
- ✅ `src/app/(storefront)/[tenantId]/page.tsx` - Page using the component
- ✅ `src/app/(storefront)/[tenantId]/layout.tsx` - Layout wrapper

## 🎯 The Real Issue

The hero slider **component is working perfectly**, but it needs **data from Firebase** to display slides. Currently, it's showing the default fallback because there's no data.

## 📋 Step-by-Step Fix

### Step 1: Find Your Tenant/Store ID

1. Open your browser console (Press `F12`)
2. Go to: `http://localhost:3000`
3. Look for any existing tenant URLs or check your Firebase database

**Common tenant URLs:**
- `http://localhost:3000/amit-interiors`
- `http://localhost:3000/your-store-name`

### Step 2: Access the Admin Dashboard

Navigate to:
```
http://localhost:3000/dashboard/website-setup
```

OR if you need to login first:
```
http://localhost:3000/dashboard
```

### Step 3: Add Hero Slides

1. In the dashboard, click **"Pages"** tab
2. Select **"Home"** sub-tab
3. Scroll to **"Hero Slider"** section
4. Click **"Add Slide"** button

### Step 4: Fill in Slide Information

**Required Fields:**
- **Image URL**: Use a full URL or upload an image
  - Example: `https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920`
  - Or upload from: `public/uploads/[tenant-id]/pages/home/hero/`

- **Heading**: Main title
  - Example: `"Transform Your Space"`

**Optional but Recommended:**
- **Subheading**: Description text
  - Example: `"Professional interior design services tailored to your vision"`

- **Primary Button Text**: Call-to-action
  - Example: `"Get Started"`

- **Primary Button Link**: Where the button goes
  - Example: `/estimate`

- **Secondary Button Text**: Optional second button
  - Example: `"View Portfolio"`

- **Secondary Button Link**: Second button destination
  - Example: `/portfolio`

### Step 5: Save and Test

1. Click **"Save"** button
2. Navigate to your storefront: `http://localhost:3000/[your-tenant-id]`
3. The hero slider should now appear!

## 🔍 Debugging Steps

### Check Browser Console

1. Open browser console (`F12`)
2. Refresh the page
3. Look for these messages:

**✅ Good Signs:**
```
Home page data loaded: { heroSlides: [...], ... }
Hero slides: [{ id: "...", heading: "..." }]
```

**❌ Problem Signs:**
```
No home page content found for tenant: xxx
Firestore not initialized
Hero slides: []
Hero slides: undefined
```

### If You See "No home page content found"

This means you need to add data through the admin dashboard (see Step 2-4 above).

### If You See "Firestore not initialized"

1. Check that `.env.local` exists in your project root
2. Verify Firebase credentials are correct
3. Restart the dev server:
   ```bash
   npm run dev
   ```

## 🎨 Sample Slide Data

Here are 3 sample slides you can use:

### Slide 1:
```
Heading: Transform Your Space
Subheading: Professional interior design services tailored to your vision
Image URL: https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920
Primary Button Text: Get Started
Primary Button Link: /estimate
Secondary Button Text: View Portfolio
Secondary Button Link: /portfolio
```

### Slide 2:
```
Heading: Modern Living Spaces
Subheading: Creating beautiful, functional spaces that inspire
Image URL: https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920
Primary Button Text: Book Consultation
Primary Button Link: /book-consultation
Secondary Button Text: Our Work
Secondary Button Link: /portfolio
```

### Slide 3:
```
Heading: Your Dream Interior
Subheading: From concept to completion, we bring your vision to life
Image URL: https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920
Primary Button Text: Get Estimate
Primary Button Link: /estimate
Secondary Button Text: Contact Us
Secondary Button Link: /contact
```

## 📊 Expected Behavior

### With 0 Slides (Current State):
- Shows default fallback message
- Dark background
- "Welcome to Our Interior Design Studio"

### With 1 Slide:
- Shows your slide
- No navigation arrows
- No auto-advance

### With 2+ Slides:
- Shows first slide initially
- Left/Right navigation arrows appear
- Dot indicators at bottom
- Auto-advances every 5 seconds
- Smooth fade transitions

## 🚀 Quick Test Command

Open your browser console and run this to check the current state:

```javascript
// Check if the hero slider section exists
const heroSection = document.querySelector('section');
console.log('Hero section found:', heroSection ? 'YES' : 'NO');
console.log('Hero section content:', heroSection?.textContent.substring(0, 100));
```

## 📁 File Structure (Verified - No Duplicates)

```
src/
├── components/
│   └── storefront/
│       └── HeroSlider.tsx          ← Component (ONLY ONE)
├── app/
│   └── (storefront)/
│       └── [tenantId]/
│           ├── layout.tsx           ← Layout wrapper
│           └── page.tsx             ← Uses HeroSlider
└── lib/
    ├── firebase.ts                  ← Firebase config
    └── firestoreHelpers.ts          ← Database helpers
```

## ✅ Checklist

Before asking for help, verify:

- [ ] Firebase is initialized (no console errors)
- [ ] You're visiting the correct tenant URL (e.g., `/your-store-id`)
- [ ] You've added at least one slide through the admin dashboard
- [ ] Each slide has an `imageUrl` and `heading`
- [ ] Image URLs are valid and accessible
- [ ] Dev server is running (`npm run dev`)
- [ ] Browser cache is cleared (Ctrl+Shift+R)

## 🎯 Next Steps

1. **Find your tenant ID** (check Firebase or existing URLs)
2. **Access admin dashboard** at `/dashboard/website-setup`
3. **Add hero slides** with the sample data above
4. **Refresh your storefront** page
5. **Enjoy your working hero slider!** 🎉

---

**Need Help?** Share your browser console output (F12) for specific debugging assistance.
