Genie Lamp Animation Specification Document
Overview
This specification describes the implementation of a macOS-style genie lamp animation effect for window minimization/expansion using Canvas API and html2canvas library in a SolidJS + Tailwind CSS application.
Animation Characteristics
Visual Behavior
The genie lamp effect should replicate the iconic macOS window minimize animation where:

The window content appears to be "sucked into" a destination point (like liquid flowing into a bottle)
The animation creates a smooth, organic distortion effect
The window maintains visual continuity throughout the transformation
The effect shows a curved, tapering motion from the window rectangle to a small destination point
The animation should feel fluid and natural, not mechanical or linear

Timing and Duration

Total animation duration: 400-600ms (configurable)
Easing function: Custom bezier curve approximating macOS behavior (ease-in-out with slight emphasis on the final compression)
Frame rate target: 60fps for smooth visual experience
Animation phases:

Initial phase (0-30%): Gentle beginning with subtle distortion
Middle phase (30-70%): Accelerating warp with increasing distortion
Final phase (70-100%): Rapid compression into destination point



Technical Architecture
Core Components Structure
1. Animation Controller Component
   Responsibilities:

Orchestrate the entire animation lifecycle
Manage animation state (idle, animating, completed)
Handle timing and frame scheduling using requestAnimationFrame
Coordinate between capture, rendering, and cleanup phases
Expose trigger methods for starting animation
Provide callback hooks for animation events (start, progress, complete)

2. Canvas Renderer Component
   Responsibilities:

Create and manage the animation canvas overlay
Position canvas to match the original window dimensions
Handle canvas context and drawing operations
Implement the mesh distortion algorithm
Render each animation frame based on distortion calculations
Clean up canvas resources after animation completes

3. Window Capture Service
   Responsibilities:

Utilize html2canvas to capture the current window/element state
Handle capture configuration (scale, quality, ignore elements)
Convert captured content into a format suitable for canvas manipulation
Cache the captured image data for animation frames
Handle errors during capture process

4. Geometry Calculator Utility
   Responsibilities:

Calculate mesh grid dimensions and subdivisions
Compute distortion matrices for each animation frame
Handle coordinate transformations from rectangle to destination point
Implement the warping mathematics (bezier curves, perspective transforms)
Calculate vertex positions for the deforming mesh

State Management
Animation State
Properties to track:

isAnimating: boolean flag
progress: 0-1 value representing animation completion
startTimestamp: animation start time
sourceRect: DOMRect of the original window
targetPoint: {x, y} coordinates of destination
capturedImage: ImageData or HTMLImageElement from html2canvas
animationId: requestAnimationFrame ID for cancellation

Configuration State
Configurable parameters:

duration: animation length in milliseconds
meshResolution: grid density for distortion (e.g., 20x20 grid)
easingFunction: bezier curve parameters
captureQuality: html2canvas quality settings
canvasScale: resolution multiplier for retina displays
targetElement: where the animation should flow toward

Detailed Animation Algorithm
Phase 1: Initialization and Capture
Pre-Animation Setup

Validate prerequisites:

Confirm source element exists and is visible
Verify destination point is valid
Check if animation is already in progress (prevent duplicates)


Capture window content:

Configure html2canvas with optimal settings:

Include all visible content within bounds
Set appropriate scale for display density
Handle cross-origin images if necessary
Ignore elements with specific data attributes (e.g., animation overlays)


Execute capture and await completion
Handle capture failures gracefully with fallback or error callback


Create canvas overlay:

Generate fullscreen canvas element
Position absolutely over the source window with exact dimensions
Set z-index high enough to appear above all content
Configure canvas for high DPI displays (scale context)
Hide original window element (opacity: 0 or visibility: hidden)



Phase 2: Mesh Generation
Grid Structure

Define mesh grid:

Create an NxM grid of vertices (e.g., 20x15 for good quality/performance balance)
Higher resolution = smoother animation but more computationally expensive
Each vertex represents a point in the image mesh
Store initial positions in normalized coordinates (0-1 range)


Create triangulation:

Divide each grid cell into two triangles (quad split)
Maintain vertex connectivity information
This creates the base structure for image warping


UV mapping:

Map each vertex to corresponding texture coordinates
UV coordinates determine which part of the captured image maps to each vertex
Store as 0-1 normalized coordinates for the source image



Phase 3: Frame-by-Frame Distortion
Distortion Calculation Per Frame
For each animation frame (called via requestAnimationFrame):

Calculate progress:

Determine elapsed time since animation start
Compute normalized progress (0-1) based on duration
Apply easing function to get eased progress value


Compute vertex transformations:

For each vertex in the mesh:

Calculate its target position based on:

Distance from destination point
Current progress value
Depth in the "funnel" (vertices closer to destination point compress first)


Apply mathematical distortion:

Horizontal/Vertical squeeze: Vertices compress toward the center axis as they approach target
Depth-based scaling: Create perspective effect where vertices further from destination lag behind
Curved path: Follow bezier curve from original position to target, not straight line
Rotation component: Slight rotation/twist can enhance the organic feel






Specific mathematical approach:

Distance mapping: Calculate each vertex's distance from the destination point
Influence falloff: Vertices closer to destination are influenced more strongly and earlier
Funnel shape: Create tapering effect using quadratic or exponential scaling
Interpolation: Blend between original position and fully compressed state
Formula concept:

finalPosition = lerp(originalPosition, targetPosition, easedProgress * influenceFactor)
influenceFactor based on distance and depth (vertices near destination = higher factor)




Render distorted frame:

Clear canvas
For each triangle in the mesh:

Use canvas transform operations or manual triangle rendering
Draw the corresponding portion of captured image warped to triangle's new shape
Apply appropriate texture coordinates from UV map


Composite the entire mesh to create the warped frame



Phase 4: Cleanup and Completion

Detect animation end:

When progress reaches 1.0
Render final frame (or fade to transparent)


Cleanup operations:

Cancel any pending requestAnimationFrame
Remove canvas overlay from DOM
Show/restore original window element or transition to next state
Clear cached image data from memory
Reset animation state


Callback execution:

Fire completion callback
Pass any relevant animation data to callback
Allow chaining of additional actions



Canvas Rendering Techniques
Image Warping Implementation Options
Option 1: Transform-based (Simpler, Less Accurate)

Use canvas transform() matrix operations
Apply to entire image or large sections
Faster but less accurate for complex distortions
Suitable for subtle effects

Option 2: Triangle-based Texture Mapping (Recommended)

Manually render each triangle with distorted geometry
Use drawImage() with 9-parameter syntax for perspective mapping approximation
More complex but produces authentic genie effect
Requires careful triangle rendering and z-ordering

Option 3: WebGL for Maximum Performance (Advanced)

Use WebGL context instead of 2D canvas
Implement vertex shaders for distortion calculations
Fragment shaders for texture sampling
Most performant for complex animations
Higher implementation complexity

Rendering Optimization
Performance Considerations

Canvas resolution:

Balance between visual quality and performance
Consider device pixel ratio for retina displays
Optionally reduce resolution during animation for performance


Mesh density:

Start with lower resolution (10x10) and increase if needed
More vertices = smoother distortion but slower rendering
Profile on target devices to find optimal balance


Frame skipping:

If frame time exceeds budget (16.67ms for 60fps)
Consider adaptive mesh resolution
Skip intermediate distortion calculations if falling behind


Compositing:

Use CSS will-change: transform on canvas element
Enable hardware acceleration where possible
Avoid triggering layout recalculations during animation



Integration with SolidJS
Component Structure
Reactive State Management

Use SolidJS createSignal for animation state
createEffect for side effects (canvas creation, cleanup)
createMemo for derived calculations (eased progress, vertex positions)
Props for configuration (duration, target, callbacks)

Component API Design
GenieAnimation Component should expose:
- Props:
    - sourceElement: reference to element to animate
    - targetPoint: {x, y} or element reference
    - duration: number (ms)
    - onComplete: callback function
    - onStart: callback function
    - enabled: boolean (whether animation is active)
    - config: object with advanced settings

- Methods (via ref):
    - trigger(): start animation
    - cancel(): abort current animation
    - reset(): return to initial state

- Signals exposed:
    - isAnimating: boolean
    - progress: number (0-1)
      Lifecycle Management

Mount: Initialize services, prepare canvas template
Trigger: Execute capture and begin animation
Unmount: Cancel animations, cleanup resources, remove event listeners

Event Handling
Trigger Mechanisms

Manual trigger:

Button click or programmatic call
Direct method invocation on component ref


Scroll-based trigger:

Monitor scroll events on target container
Define threshold for animation trigger
Calculate scroll velocity for dynamic timing
Debounce/throttle scroll events for performance


Intersection observer:

Trigger when element enters/exits viewport
More performant than scroll listeners
Good for automatic triggering



Error Handling and Edge Cases
Capture Failures

html2canvas errors:

Timeout after reasonable duration (5000ms)
Fallback to simple fade animation
Log error for debugging
Notify user if appropriate


Cross-origin issues:

Configure CORS properly for external images
Provide fallback rendering without external resources
Document limitations in component documentation



Performance Degradation

Low FPS detection:

Monitor frame times during animation
Reduce mesh resolution if performance drops
Optionally skip to end state if severely degraded


Memory constraints:

Limit maximum capture resolution
Clean up previous captures before starting new animations
Test on low-memory devices



User Interactions During Animation

Click/touch events:

Option to cancel animation on interaction
Or ignore events during animation
Configurable behavior via props


Rapid triggers:

Queue animations or cancel previous
Prevent double-trigger issues
Debounce trigger mechanism



Accessibility Considerations
Motion Preferences

prefers-reduced-motion:

Detect system preference
Provide instant transition instead of animation
Or use simpler, faster animation (fade)
Respect user comfort with motion



Screen Readers

ARIA announcements:

Announce state changes
Not necessary to describe animation visually
Focus on the functional outcome



Keyboard Navigation

Ensure animation doesn't trap focus
Maintain focus management during animation
Allow keyboard cancellation (ESC key)

Configuration and Customization
Presets
Define preset configurations for common use cases:

Fast preset: 300ms duration, 12x12 mesh, simpler easing
Standard preset: 500ms duration, 20x15 mesh, macOS-like easing
Smooth preset: 700ms duration, 25x20 mesh, extended easing
Performance preset: Reduced resolution, simplified distortion

Customization Points

Mesh resolution (grid density)
Animation duration
Easing curve parameters
Target point position
Capture quality settings
Canvas scaling factor
Distortion intensity (subtle vs dramatic)
Color effects during animation (optional tint/blur)

Testing Strategy
Unit Tests

Geometry calculations (vertex transformations)
Easing function accuracy
State transitions
Configuration validation

Integration Tests

Canvas rendering output
html2canvas integration
SolidJS reactivity
Cleanup and memory management

Visual Regression Tests

Capture animation frames
Compare against reference implementation
Ensure consistency across browsers

Performance Tests

Frame rate monitoring
Memory leak detection
Animation timing accuracy
Profile on various devices (desktop, mobile, low-end)

Browser Compatibility
Required APIs

Canvas 2D context (all modern browsers)
requestAnimationFrame (universal support)
html2canvas library (check library compatibility)
CSS transforms (for overlay positioning)

Testing Targets

Chrome/Edge (Chromium) - latest 2 versions
Firefox - latest 2 versions
Safari - latest 2 versions
Mobile Safari (iOS)
Chrome Mobile (Android)

Fallback Strategy

Detect Canvas support
Fallback to CSS transition if Canvas unavailable
Simple fade as ultimate fallback

Performance Benchmarks
Target Metrics

Animation FPS: 60fps sustained
Memory usage: <50MB additional during animation
Capture time: <500ms for typical window
Total animation time: User configurable (400-600ms default)

Optimization Priorities

Smooth frame rate (most important for perceived quality)
Accurate visual reproduction
Memory efficiency
Fast capture time

Documentation Requirements
API Documentation

Component props with types and descriptions
Method signatures and return values
Configuration object structure
Callback function signatures
Example usage code

Implementation Guide

Setup instructions
Basic usage example
Advanced customization examples
Troubleshooting common issues
Performance tuning guide

Visual Examples

Animated GIFs showing effect
Side-by-side comparison with macOS original
Various configuration demonstrations


Implementation Notes for LLM
When implementing this specification:

Start with core structure: Build the animation controller and state management first before attempting distortion math
Iterate on distortion quality: Begin with simple linear distortion, then refine to achieve the characteristic genie effect
Prioritize performance: Profile frequently and optimize hotspots in the rendering loop
Test incrementally: Verify each phase (capture, mesh generation, distortion, cleanup) independently
Focus on the math: The genie effect's quality depends entirely on the vertex transformation algorithm - this is the most critical code section
Use TypeScript types: Ensure type safety for geometry calculations, configuration objects, and state management
Consider WebGL upgrade path: Design the initial 2D Canvas implementation to allow future WebGL optimization without major refactoring
Handle edge cases early: Build error handling and cleanup into the core architecture from the start, not as an afterthought