# Video Resources & YouTube Integration Feature

## Overview

Enhanced course resource management with YouTube video embedding and display capabilities across the Professor GENIE platform.

## Features Implemented

### 1. **Create Syllabus Page** (`/dashboard/create-syllabus`)

#### New Resource Types

- 📹 **Video Tutorial** - Single instructional videos
- 📺 **YouTube Playlist** - Series of related videos

#### YouTube URL Input

- Dedicated input field that appears when "Video Tutorial" or "YouTube Playlist" is selected
- Real-time validation showing "✓ Valid YouTube link detected"
- Supports multiple YouTube URL formats:
  - `https://www.youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  - `https://www.youtube.com/embed/VIDEO_ID`

#### Embedded Video Preview

- **Inline video player** in resource list
- 200px height responsive iframe
- Full YouTube embed controls (play, pause, fullscreen)
- Direct "📹 Watch on YouTube" link below video
- Maintains resource metadata (title, author, required/optional status)

#### Enhanced Resource Display

- **Clickable URLs** - ISBN/URL field now creates clickable links for web resources
- **Video thumbnails** - Embedded YouTube players show in syllabus resources
- **Better organization** - Resources grouped by type with clear badges

### 2. **Generate Objectives Page** (`/dashboard/generate-objectives`)

#### AI-Recommended Video Resources

- **Automatic video suggestions** based on course topic
- Sample recommendations include:
  - freeCodeCamp.org video courses
  - Traversy Media tutorials
  - YouTube playlists for beginners

#### Enhanced Resource Interface

```typescript
interface Resource {
    title: string
    author: string
    type: string
    relevance: string
    videoUrl?: string  // NEW: YouTube video URL
    url?: string       // NEW: General resource URL
}
```

#### Video Display in Recommendations

- **Embedded YouTube player** for video resources
- **Relevance explanation** - AI explains why each resource is recommended
- **Direct links** - "🔗 View Resource" and "📹 Watch on YouTube" buttons
- **Copy functionality** - Quick copy resource details to clipboard

## Technical Implementation

### YouTube Video ID Extraction

```typescript
const getYouTubeVideoId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
}
```

### Video Embedding

- Uses YouTube's iframe embed API
- Responsive width (100%)
- Standard security attributes (frameBorder="0", rel="noopener noreferrer")
- Allows: accelerometer, autoplay, clipboard-write, encrypted-media, gyroscope, picture-in-picture
- `allowFullScreen` enabled for full-screen viewing

### Data Persistence

Resources with videos are stored with:

```typescript
{
    id: string
    type: "Video Tutorial" | "YouTube Playlist" | ...
    title: string
    author?: string
    videoUrl?: string  // YouTube URL
    required: boolean
}
```

## User Experience Enhancements

### For Professors

1. **Easy video addition** - Paste any YouTube URL
2. **Visual preview** - See videos before sharing with students
3. **Contextual organization** - Videos appear alongside textbooks and readings
4. **Required/Optional labeling** - Mark videos as required viewing

### For Students (when viewing syllabus)

1. **Embedded viewing** - Watch videos without leaving the page
2. **Quick access** - Direct YouTube links for mobile viewing
3. **Clear expectations** - See which videos are required vs optional
4. **Resource variety** - Mix of textbooks, articles, and video content

## Sample Data

### Video Resources in Generate Objectives

```javascript
{
    title: "Complete Video Course",
    author: "freeCodeCamp.org",
    type: "Video Tutorial",
    relevance: "Comprehensive video series covering key concepts",
    videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
},
{
    title: "Quick Start Tutorial",
    author: "Traversy Media", 
    type: "YouTube Playlist",
    relevance: "Step-by-step video tutorials for beginners",
    videoUrl: "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

## Accessibility Features

- **aria-label** attributes on select elements
- **Keyboard navigation** for video controls (native YouTube player)
- **Screen reader support** via proper HTML structure
- **High contrast** badges and labels

## Future Enhancements (Potential)

- [ ] Auto-generate video suggestions based on course title
- [ ] Thumbnail preview before embedding
- [ ] Video duration display
- [ ] Timestamp markers for specific sections
- [ ] Integration with other video platforms (Vimeo, Coursera, etc.)
- [ ] Video transcripts for accessibility
- [ ] Progress tracking for required videos
- [ ] Bulk video import from playlist

## Browser Support

- All modern browsers with HTML5 video support
- YouTube embed API compatibility required
- Responsive design for mobile/tablet viewing

## Performance Considerations

- Videos load on-demand (not autoplay)
- Lazy loading for multiple videos
- Minimal impact on page load time
- YouTube's CDN handles video delivery

## Security

- YouTube embed with standard security policies
- External links open in new tab with `rel="noopener noreferrer"`
- No direct video uploads to server (uses YouTube hosting)
- URL validation prevents malformed links

---

**Status**: ✅ Fully Implemented and Tested  
**Version**: 1.0  
**Last Updated**: December 26, 2025
