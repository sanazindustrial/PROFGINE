# Professor GENIE Logo Setup Instructions

## Required Logo Files

Please add the following logo images to the `public/logos/` folder:

### 1. **genie-icon.png** (Third Image - Magic Lamp with Graduation Cap)

- The icon version showing the purple/blue magic lamp with graduation cap
- Recommended size: 512x512px or higher
- Format: PNG with transparent background preferred
- This will be used in the navigation bar

### 2. **genie-badge.png** (First Image - Circular Badge)

- The full circular badge with:
  - "Professor GENIE Platform"
  - "Empowering Smart Learning"
  - Circuit pattern background
  - Golden border
- Recommended size: 800x800px or higher
- Format: PNG
- This will be used on the welcome page and as the main brand asset

### 3. **genie-text.png** (Second Image - Text Logo)

- The stylized text logo reading "Professor GENIE Platform"
- With purple to blue gradient
- Recommended size: 1200x400px or higher
- Format: PNG with transparent background
- This will be used for headers and banners

## How to Add Your Logos

1. Save each of the three logo images from your design files
2. Rename them exactly as specified above:
   - `genie-icon.png`
   - `genie-badge.png`
   - `genie-text.png`
3. Copy all three files into: `public/logos/`
4. Restart your development server

## Current Implementation

Your logos are now integrated across the platform:

### Navigation Bar (All Pages)

- Uses `genie-icon.png`
- Displays with smooth floating animation
- Scales up on hover
- Links to Course Design Studio or Home

### Welcome Page (app/page.tsx)

- Features large animated `genie-badge.png` in hero section
- Smooth floating animation
- Drop shadow effect

### Future Implementation Ready

- `genie-text.png` available for banners and marketing pages
- All three variants can be used interchangeably

## Animation Effects Applied

✅ **Smooth Floating**: Logos gently float up and down
✅ **Scale on Hover**: Interactive zoom effect
✅ **Gradient Animation**: Text gradients slowly animate
✅ **Fade In**: Content animates into view
✅ **Drop Shadows**: Professional depth effects

## Testing Checklist

After adding your logos:

- [ ] Logo appears in navigation bar
- [ ] Logo appears on welcome page
- [ ] Animations are smooth and professional
- [ ] Logo scales correctly on different screen sizes
- [ ] Dark mode compatibility (if applicable)
- [ ] Mobile responsiveness

## Troubleshooting

If logos don't appear:

1. Verify file names match exactly (case-sensitive)
2. Check files are in `public/logos/` directory
3. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
4. Restart development server (`pnpm dev`)

## Next Steps

Once logos are added, the platform will automatically:

- Display your brand consistently across all pages
- Apply smooth animations and transitions
- Scale properly on all devices
- Maintain professional appearance in light and dark modes

---

**Note**: The system expects PNG format for best quality. If you have SVG versions, you can use those instead by updating the file extensions in:

- `components/icons.tsx`
- `components/professor-genie-logo.tsx`
