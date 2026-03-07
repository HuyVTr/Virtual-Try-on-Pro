# AI Agent Instructions for Virtual Try-On Pro (Gem-Lab Studio)

## Project Overview

**Virtual Try-On Pro** is an AI-powered multi-module web application built with React + TypeScript + Vite that leverages Google's Gemini API for image generation and video creation.

### Core Purpose
Provide three distinct AI capabilities:
1. **Virtual Try-On Module** - Overlay clothing on person images with background customization
2. **AI Video Creator Module** - Generate animated videos from static images using Veo models
3. **AI Photo Studio Module** - Text-to-Image generation, image enhancement, and upscaling

---

## Architecture & Data Flow

### Main Components Structure
```
src/
├── App.tsx                    # Main router + state management (650 lines)
├── services/
│   └── geminiService.ts      # All Google Gemini API calls (5 functions)
├── components/
│   ├── ImageUpload.tsx       # Reusable image upload component
│   └── ApiKeyModal.tsx       # API key selection dialog
└── types.ts                  # Central type definitions + AVAILABLE_MODELS constant
```

### State Management Pattern
- **No Redux/Zustand** - Uses React hooks only (`useState`, `useMemo`, `useEffect`)
- **Module-based state** - Separate state for each module (TRY_ON, VIDEO, STUDIO)
- **Shared state** - Generation status, error messages, API key availability

### Module Switching Logic
- Global enum `AppModule` controls which module displays
- Models filtered by `supportedModules` array (some models work for multiple modules)
- Reset outputs when switching modules to avoid stale results

---

## Critical Files & Key Patterns

### `src/types.ts` - Single Source of Truth
```typescript
// Core enums that control behavior
export enum AppModule { TRY_ON, VIDEO, STUDIO }
export type StudioMode = 'TEXT_TO_IMAGE' | 'ENHANCE' | 'UPSCALE'
export type BackgroundMode = 'DEFAULT' | 'TEXT_PROMPT' | 'IMAGE_UPLOAD'

// AVAILABLE_MODELS constant (5 models with supportedModules)
// NEVER hardcode model IDs - always reference this array
export const AVAILABLE_MODELS: Model[] = [
  { id: 'gemini-2.5-flash-image', supportedModules: [TRY_ON, STUDIO], ... },
  { id: 'veo-3.1-generate-preview', supportedModules: [VIDEO], ... }
]
```

**Pattern:** When adding new models, update AVAILABLE_MODELS with proper `supportedModules` array.

### `src/services/geminiService.ts` - API Integration
```typescript
// 5 exported functions - one per distinct operation:
export const checkApiKeyAvailability()      // Check if API key exists
export const openApiKeySelection()          // Open AI Studio key dialog
export const generateTryOnImage()           // Photo: person + garment + background
export const generateVideo()                // Video: image → motion (with polling)
export const generateStudioImage()          // Studio: text/enhance/upscale

// Error handling pattern:
const parseGeminiError = (error: any): string => {
  if (error.message.includes("api key not valid")) return "API_KEY_INVALID"
  if (error.status.includes('permission_denied')) return "Billing Required message"
  // Returns user-friendly Vietnamese messages
}
```

**Critical Detail:** Function `generateVideo()` uses **polling pattern** with 10s interval for `veo-3.1-generate-preview` (expensive model).

### `src/App.tsx` - Component Architecture
```typescript
// Module selector at top - filters models by supportedModules
const modelsForCurrentModule = useMemo(() => 
  AVAILABLE_MODELS.filter(m => m.supportedModules.includes(currentModule))
, [currentModule])

// Conditional rendering per module
if (currentModule === AppModule.TRY_ON) { /* Try-On UI */ }
if (currentModule === AppModule.VIDEO) { /* Video UI */ }
if (currentModule === AppModule.STUDIO) { /* Studio UI */ }
```

**Layout Pattern:** 2-column layout (Input Controls | Result Preview) using Tailwind grid.

---

## Project Conventions & Patterns

### Environment Variables
- **Format:** `VITE_GEMINI_API_KEY` (note: `VITE_` prefix required for Vite)
- **Usage:** `import.meta.env.VITE_GEMINI_API_KEY`
- **Location:** `.env` file (gitignored, never commit API keys)

### Naming Conventions
- Component files: PascalCase (e.g., `ImageUpload.tsx`)
- Service functions: camelCase with action verb (e.g., `generateTryOnImage`)
- Enums: PascalCase, use for state enums only
- Types/Interfaces: PascalCase with `I` prefix (e.g., `UploadedImage`)

### UI Styling
- **Framework:** Tailwind CSS (config scans `./src/**/*.{js,ts,jsx,tsx}`)
- **Color scheme:** Indigo primary (`indigo-600`), Slate neutrals (`slate-50` to `slate-900`)
- **Component pattern:** Rounded-2xl cards with shadow-sm borders
- **Icons:** Lucide React (destructured imports)

### Error Handling Pattern
```typescript
try {
  const result = await apiCall()
  setStatus(GenerationStatus.SUCCESS)
} catch (err: any) {
  const userMessage = parseGeminiError(err)
  if (userMessage === "API_KEY_INVALID") {
    setShowKeyModal(true)
  }
  setError(userMessage)
  setStatus(GenerationStatus.ERROR)
}
```

---

## Developer Workflows

### Setup & Running
```bash
npm install          # Install 216 packages
npm run dev          # Start Vite dev server (http://localhost:5174)
npm run build        # Production build to dist/
npm run lint         # TypeScript type checking
```

### Common Tasks

**Adding a new model:**
1. Add to `AVAILABLE_MODELS` in `types.ts` with `supportedModules` array
2. Ensure `id` matches Google Gemini API model ID
3. UI automatically shows in module selector

**Fixing API errors:**
1. Check `.env` has `VITE_GEMINI_API_KEY` set
2. Verify API key is valid in Google Cloud Console
3. For paid models, ensure Billing is enabled
4. Add error message to `parseGeminiError()` helper

**Debugging state issues:**
- Use React DevTools Extension to inspect state per module
- Check that `useEffect` dependencies are correct
- Verify `useMemo` dependencies for model filtering

### Known Issues & Workarounds
- **TypeScript strict mode enabled** - Requires proper typing, no `any` in function params
- **Tailwind CSS in Vite** - CDN disabled, must use PostCSS config
- **API Key in .env** - NOT `.env.local`, name must match exactly

---

## Integration Points & External Dependencies

### Google Gemini API
- **Library:** `@google/genai` (imported as `GoogleGenAI`)
- **Auth:** API key from `.env` via `import.meta.env.VITE_GEMINI_API_KEY`
- **Models used:** 
  - `gemini-2.5-flash-image` (photo mode, free tier)
  - `gemini-3-pro-image-preview` (photo mode, preview)
  - `veo-3.1-fast-generate-preview` (video, paid)
  - `veo-3.1-generate-preview` (video, paid)
  - `imagen-3.0-generate-001` (studio, paid)

### AI Studio Integration
- `window.aistudio.hasSelectedApiKey()` - Check if key selected in AI Studio UI
- `window.aistudio.openSelectKey()` - Open key selection dialog
- Fallback to `.env` API key if not in AI Studio

### React & Supporting Libraries
- `react-dom` for rendering
- `lucide-react` for 30+ icons
- `tailwindcss` for utility-first styling

---

## Quick Reference

| Pattern | Location | Example |
|---------|----------|---------|
| Module state | `App.tsx` line 8-45 | `useState<AppModule>(AppModule.TRY_ON)` |
| Model filtering | `App.tsx` line 11 | `useMemo` with `supportedModules` |
| API calls | `geminiService.ts` | All 5 exported functions |
| Error handling | `geminiService.ts` line 13-44 | `parseGeminiError()` |
| Image input | `ImageUpload.tsx` | File → Base64 → Preview |
| Styling | All `.tsx` files | `className` with Tailwind |

---

## What NOT to Do

❌ Hardcode model IDs (reference `AVAILABLE_MODELS`)
❌ Use `any` type in functions (respect TypeScript strict mode)
❌ Store API key in code (use `.env`)
❌ Modify `BackgroundConfig` structure without updating both UI and service
❌ Add polling outside of `generateVideo()` (non-video models don't need it)

---

## Asking for Clarification

When implementing features for this codebase, always ask:
1. **Which module?** (TRY_ON/VIDEO/STUDIO - affects model availability)
2. **What's the new model ID?** (Check `supportedModules` in AVAILABLE_MODELS)
3. **Does it need polling?** (Only video generation uses polling)
4. **Error handling for paid models?** (Billing errors return special message)

---

*Last Updated: January 19, 2026*
*Version: 1.0 (Multi-Module Gem-Lab Studio)*
