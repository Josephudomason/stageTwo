# React + Vite project

# stage2
reactjs invoice project

# Architecture Explanation:
This project is a small single-page application built with React and Vite.

## Main files
- src/App.jsx: Contains the core UI, page state, invoice state, form logic, validation, data normalization, modal handling, and utility helpers.

- src/App.css: Contains the app-specific styling, layout rules, theme styling, and responsive behavior.

- src/index.css:  Contains global base styles such as typography, resets, and root-level styling.
- 
vite.config.js:  Keeps the Vite setup simple and lightweight for local development and production builds.
State and data flow
The app manages:

- invoice collection
- selected invoice
- current page view
- filter state
- create/edit drawer state
- delete confirmation state
- theme state

Invoice data is normalized before use so that totals, due dates, and status-related rendering stay consistent. The app also restores persisted invoice data from localStorage and defensively normalizes it again to avoid malformed saved state causing runtime issues.

Persistence
The app uses browser localStorage for:

invoice persistence
theme persistence
This keeps the project simple and makes it easy to run without a backend.

# Trade-offs
The app uses local React state instead of a larger state management library. This keeps the project easier to understand, but it also means the main file holds a lot of logic that would likely be split in a larger application.
Persistence is handled with localStorage instead of a database or API. This is lightweight and fast for a front-end challenge, but it does not support multi-user sync or cross-device persistence.
The project keeps most logic in one main component file for simplicity. This improves portability for a small codebase, but reduces separation of concerns compared to a more production-scaled folder structure.
The mobile detail layout was intentionally tightened to reduce scrolling and keep invoice information visible sooner, which improves usability on small screens but leaves less visual whitespace.


# Accessibility Notes
The app includes several accessibility-minded decisions:

semantic form controls such as button, input, and select
keyboard support for dialogs, including Escape to close
focus management when drawers and confirmation dialogs open
visible focus states for keyboard users
text labels paired with status colors so meaning is not conveyed by color alone
ARIA attributes for dialog roles and labels
Areas that could still be improved further:

more robust menu semantics for the filter dropdown
expanded screen reader testing across all flows
automated accessibility auditing with tools like Lighthouse or axe
Improvements Beyond Requirements
A few improvements were added beyond basic feature delivery:

invoice and theme persistence across sessions
defensive normalization of saved invoice data to prevent broken state after reload
fallback unique ID generation when crypto.randomUUID() is unavailable
stricter date handling to avoid invalid or timezone-sensitive invoice dates
responsive refinements to keep invoice detail content more visible on smaller screens
cleanup to avoid Windows metadata files such as desktop.ini affecting the project
Future Improvements
If this project were extended further, the next steps would likely be:

split App.jsx into smaller components and custom hooks
add unit and integration tests
move invoice storage to a backend or API
add search and sorting
improve filter menu accessibility semantics
add loading, error, and empty-state variations for more flows

