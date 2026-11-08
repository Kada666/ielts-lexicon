# IELTS Lexicon

**Turn words you recognise into vocabulary you can recall and use.**

[Open the app](https://kada666.github.io/ielts-lexicon/) · [简体中文](README.md) · **English** · [Technical guide, in Chinese](docs/technical-guide.zh-CN.md)

> Unified public edition: application code and Markdown vocabulary notes are public; handwritten source images are excluded. Each user keeps review history, personal edits and settings in their own browser.

![IELTS Lexicon learning dashboard](docs/screenshots/desktop.png)

> The screenshot uses an isolated test database. The app does not upload personal study records or guarantee an exam score.

## Purpose

IELTS Lexicon is a local-first, offline-capable vocabulary study system for learners who already recognise much of an English vocabulary book but still need to strengthen unfamiliar words, uncertain recall and less familiar meanings.

It starts with a personal screening workflow for a 50-List IELTS vocabulary book: skip words already known, mark unfamiliar words with **○**, mark uncertain words with **△**, and gradually turn handwritten notes into a reviewable personal collection. The original learning context is preparation for IELTS Academic with a target of 6.5. Vocabulary from listening, reading, writing and speaking practice can also be added.

## Problems it addresses

| Problem | Approach |
| --- | --- |
| Relearning whole lists wastes time when most words are already familiar | Collect personal weak spots and preserve the original List and ○ / △ classification |
| Recognition after seeing an answer does not ensure independent recall | Show English first, reveal the meaning and memory cue, then record a self-rating |
| Handwritten lists become scattered and hard to update | Keep source images and an editable Markdown master with repeatable JSON generation |
| Generic memory tricks do not suit everyone | Edit personal word-part explanations, sound cues, associations and stories |
| It is unclear when to review again | Schedule reviews from Forgot / Uncertain / Remembered ratings |
| Imports may overwrite progress or personal notes | Separate base content, personal overrides, scheduling state and history; merge duplicate words across Lists |
| Long-term use should not require an account or paid backend | Use browser storage, an offline app shell and complete JSON backups |

## Features

- **Recall-first flashcards:** multiple Chinese meanings, a preferred memory cue, useful collocations and a short example. Touch and keyboard support.
- **Six memory-cue types:** etymology, morphology, onomatopoeia, phonetic association, free association and word families. Historical claims and creative associations have distinct labels and review states.
- **Vocabulary preview:** desktop rows show words on the left and meanings on the right. Hover to reveal a meaning, adjust the reading size, or select a word to edit it.
- **Basic spaced repetition:** shorter initial intervals for unfamiliar words, longer intervals after successful recall and shorter intervals after forgetting. V1 uses a simple tested scheduler, not FSRS.
- **Study overview:** imported Lists, vocabulary size, mastery, reviews due, reviews completed, seven-day activity and difficult words.
- **Portable data:** complete JSON backup and restore, incremental JSON import and CSV vocabulary export.
- **Offline study:** after caching, reload, reveal cards, rate recall and save progress without a network connection.

## Get started

Open **[IELTS Lexicon](https://kada666.github.io/ielts-lexicon/)**. There is one public repository and one shared app URL. The same code can also run locally.

1. Open the initial-vocabulary review flow to preview **139 candidates from Lists 1 to 4**. With an existing collection, use **更新词库与笔记** on the dashboard to merge the missing words and notes. The import page also offers a Lists 3 + 4 supplement.
2. Compare the transcription with the Markdown notes, check spelling and classification, then confirm import. Additional Lists can be checked separately.
3. Start a session: recall → reveal → read the meaning and cue → rate.
4. Add personal memory cues and export complete backups regularly.

**Moving from localhost:** export a complete JSON backup from the original local app and restore it on the hosted app. Storage is separate for each website origin, browser and device; it is not automatically synced.

### Install and use offline

Use a supporting desktop browser's installation option, or Safari's **Add to Home Screen** on iPad / iPhone. The first visit needs connectivity. Wait for the offline-ready indicator before disconnecting. The app requires HTTPS or localhost for offline caching; ordinary LAN HTTP is not an iPad installation solution.

Clearing site data or browser storage eviction can remove records. Installation does not replace backups. See the [technical guide](docs/technical-guide.zh-CN.md) for details.

### Run locally

Requires Node.js 22.12+.

```sh
npm ci
npm run build
npm run preview -- --port 4173 --strictPort
```

Open `http://127.0.0.1:4173/`. On Windows, `start-lexicon.cmd` builds and runs the local server. Use `npm run dev` for development; offline checks require the production build.

## Source data and expansion

Initial materials are four user-supplied handwritten screening sheets, transcribed into four files under `data/notes/`; handwritten source images are excluded from the public repository. They are personal selections, not complete book Lists. Without full List totals, the app does not claim a book-wide unfamiliar-word rate.

| List | ○ Unfamiliar | △ Uncertain | 练 Practice | Candidates |
| --- | ---: | ---: | ---: | ---: |
| 1 | 14 | 10 | 0 | 24 |
| 2 | 15 | 10 | 0 | 25 |
| 3 | 28 | 15 | 0 | 43 |
| 4 | 22 | 19 | 6 | 47 |
| Total | 79 | 54 | 6 | 139 |

The four detailed notebooks contribute **91 handwritten memory cues**, organized into word parts, hooks, recall steps and related words. Edit the [Markdown notebooks](data/notes/) to update them. A [dedicated import file](data/vocabulary.list_03_04.json) contains the 90 words in Lists 3 and 4. [Vocabulary audit](data/import_review.md)

Transcriptions in `vocabulary.pending.json` enter the browser's collection after review and confirmation. Definitions, phonetics, examples and mnemonics retain their own review states. The practice group has its original mark and uses the uncertain-word schedule.

```text
Text notes → Candidate Markdown → Human review
                                           ↓ npm run build:data
                              JSON → Confirmed import → IndexedDB
```

The schema supports all 50 Lists and other sources without an invented List number. See the [review checklist](data/import_review.md), [master vocabulary](data/vocabulary_master.md) and [external-source example](data/external-source.example.json).

## Data ownership

The active database lives in the current browser's **IndexedDB**. No required account, paid cloud database or runtime AI / OCR call. GitHub Pages serves static files and bundled candidates; personal review history and edits stay in the browser.

A **complete JSON backup** preserves words, personal overrides, scheduling states, all review events and settings. CSV is for inspection, not restoring history. Restoring replaces current device data, with explicit confirmation and a download of its current backup first. V1 does not merge independently edited histories from multiple devices.

## Technology and validation

React · TypeScript · Vite · IndexedDB / idb · Service Worker · PWA.

```sh
npm test             # Data, deduplication, scheduling, backup and migration
npm run build        # Markdown conversion, type checking and production build
npm run test:e2e     # Isolated Chrome: import, edit, rate, restore and offline
```

V1 passed **17 unit tests and 11 browser tests**, including desktop meaning reveal, vocabulary upgrades, mnemonic editing and offline reload. Desktop, 834px tablet and 390px phone layouts were checked. Physical iPad Safari and macOS installation remain unverified. [Verification record](docs/verification.md)

GitHub Actions tests, builds and deploys the unified Pages app after a push to `main`. Planned work includes FSRS, listening recognition, meaning recall and word-family links. Automatic cross-device sync is not part of V1.

## One app, independent browser data

Only one public repository and app URL are maintained. App updates never upload or reset browser study data. Importing an updated base vocabulary requires confirmation. Different browser profiles and devices have separate IndexedDB databases; people sharing the same profile also share that site storage.

The public repository starts with clean history, without original handwritten images or previous Git commits. The former private repository is a historical archive, not a second development or deployment target.

## Mobile reading and pronunciation

The phone collection puts the word on the left and meanings on the right, with compact initial-level symbols and source labels. Scrolling loads more words automatically. Study cards focus on the word, pronunciation, meaning and preferred memory cue. Previous/next does not record a rating; already-rated cards can be revisited without duplicate ratings. Hold a memory cue for 550 ms or tap Edit to change it.

Tap the phonetic text or speaker for device speech synthesis, requesting en-GB and preferring a local UK voice. Offline speech requires an installed local UK voice; ordinary offline study and ratings remain available without it. This is not an official IELTS audio recording. See [interaction and audio details](docs/mobile-reading.md).
