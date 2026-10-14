# BytePath

**Live site:** https://byte-path.vercel.app

A free, multi-page learning hub for **IT**, **computer science** and **information systems (IS)**. It does not host courses. It puts the best existing ones in a sensible order, with roadmaps, resources and a quiz to help you choose a path.

Built with plain HTML and CSS. One small JavaScript file powers the dark-mode button; everything else works without JavaScript.

## Pages

| Page | What it does |
| --- | --- |
| `index.html` | Home: choose a subject (IT, CS or IS), how BytePath works |
| `courses.html` | 23 tracks with filters by subject and level |
| `roadmap.html` | Step-by-step route for IT, CS and IS, plus IT certifications |
| `resources.html` | Curated links per track, cheat sheets, FAQ |
| `quiz.html` | "Which path fits you?" five-question quiz with three possible subjects |
| `about.html` | Principles, sample study week, contact form |

## Features

- **Three subjects**: IT, computer science and information systems (business analysis, systems design, ERP, analytics, project management). Each track is tagged with one or more subjects
- **CSS-only filters** on the courses page (radio inputs and sibling selectors)
- **CSS-only quiz**: 5 questions with three answers each. Three matching answers decide the result, and an even 2-2-1 split shows a "between two subjects" result, using `:has()`
- **Dark mode**: follows the device setting automatically, with a header toggle that remembers the choice
- **CSS-only mobile menu** and `<details>` FAQ
- **Smooth scrolling** to sections (turned off for visitors who prefer reduced motion)
- **Accessibility**: skip link, visible focus, `aria-current`, contrast-checked palettes in both themes

## Folder structure

```
bytepath/
├── index.html
├── courses.html
├── roadmap.html
├── resources.html
├── quiz.html
├── about.html
├── README.md
├── css/
│   └── style.css      all styles, colours as CSS variables
├── js/
│   └── theme.js       dark-mode toggle (optional)
└── assets/
    ├── logo-mark.svg
    ├── route-map.svg
    ├── route-map-dark.svg
    └── icon-*.svg     23 track icons (blue IT, violet CS, teal IS)
```

## Run it

No build step and no dependencies.

- Double-click `index.html`, or
- serve the folder locally:

```bash
cd bytepath
python3 -m http.server 8000
# open http://localhost:8000
```

Fonts (Bricolage Grotesque and Figtree) load from Google Fonts. Offline, the site falls back to system fonts.

## How it works

**Course filters.** Radio inputs sit before the course grid. A rule such as `#f-beg:checked ~ .course-grid .card:not([data-level="beginner"])` hides the cards that do not match. Cards carry `data-level` and `data-subject` attributes.

**Quiz.** Each question has three radios with ids like `q1-it`, `q1-cs` and `q1-is`. For each subject, ten `:has()` selectors cover every way to pick 3 or more of 5 answers, and that result block is shown. With 5 answers and 3 subjects, the only case with no majority is a 2-2-1 split, so 30 more selectors per pair of subjects show a "between two subjects" result once all five are answered. The "pending" message hides when any result shows or all five are answered. The reset button clears the answers.

**Dark mode.** Colours are CSS variables on `:root`. The dark palette applies in two cases:

1. the device prefers dark and the visitor has not forced light (`:root:not([data-theme="light"])`)
2. the visitor chose dark (`:root[data-theme="dark"]`)

`js/theme.js` runs in `<head>`, so the right theme is set before the page paints. It saves the choice in `localStorage` under `bytepath-theme`. Without JavaScript, the toggle stays hidden and the site follows the device setting.

## Customise

- **Colours and fonts**: edit the variables at the top of `css/style.css`, and the dark blocks lower down.
- **Contact form**: in `about.html`, replace `mailto:hello@example.com` with your address. A static site cannot send email on its own. For a real form, use a service such as Formspree or Netlify Forms.
- **Add a course**: copy an `article.card.course` in `courses.html`, set a unique `id`, `data-level` and `data-subject`, and add a matching `.res-group` with the same id in `resources.html`.
- **Add the Quiz to the menu**: the link currently appears only on `quiz.html`. Add `<a href="quiz.html">Quiz</a>` to the `<nav class="main-nav">` on the other pages.
- **Brand name and footer**: search for "BytePath" and the copyright line in each page.

## Browser support

Modern browsers. The quiz needs `:has()` (Chrome and Edge 105+, Safari 15.4+, Firefox 121+). In older browsers the quiz result will not appear, and everything else still works.

## Known limits

- Links on the home page cannot preselect a subject filter (that would need JavaScript).
- External resource links may change over time. Check them now and then.

## Deploy

The site is deployed on Vercel at https://byte-path.vercel.app. It needs no build settings: Vercel serves the folder as a static site. To update it, redeploy the changed files (or push to the connected Git repository).

It also works on any other static host: GitHub Pages, Netlify, Cloudflare Pages or plain web hosting.

## License

Released under the [MIT License](LICENSE). External courses and sites linked from BytePath belong to their owners.
