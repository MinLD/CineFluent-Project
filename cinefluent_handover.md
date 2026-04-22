# CineFluent Project Handover & Knowledge Transfer (KT)

## 🎯 Project Vision
CineFluent is an AI-powered English learning platform that uses movies/videos. Unlike traditional players, it uses **Deep Knowledge Tracing (DKT)** to track a user's mastery of 12 English tenses and dynamically triggers "cloze tests" (fill-in-the-gap) for sentences they are struggling with.

---

## 🧠 The AI "Brain" Architecture

### 1. Grammar Classification (12 Tenses)
- **Model**: `FacebookAI/xlm-roberta-base` (Single-task Sequence Classification).
- **Location**: `server/be_flask_cinefluent/storage/models/grammar_xlm_roberta/`.
- **Output**: 12 Tense IDs (0-11) mapped in `grammar_label_map.json`.
- **Spacy Integration**: Uses `en_core_web_sm` to identify main verbs (VERBs) and generate 3 distractors (ED, ING, S, etc.) for cloze tests.

### 2. Deep Knowledge Tracing (DKT)
- **Engine**: ONNX Runtime (CineFluentDKT Singleton).
- **Model**: `server/be_flask_cinefluent/storage/cinefluent_dkt.onnx`.
- **Input**: History of user attempts (binary 0/1) for specific grammar tags.
- **Output**: Mastery probability (0.0 - 1.0) for each tag.

### 3. Adaptive Learning Trigger
- **Look-ahead Logic**: While playing, the Frontend "looks ahead" 4 seconds.
- **Trigger**: If a future sentence has a `grammar_tag_id`, it asks the DKT engine: "Will the user fail this?".
- **Action**: If mastery is low, it pauses the video and shows `AdaptiveClozeModal`.

---

## 🏎️ High-Performance Architecture (CRITICAL)

To prevent UI "explosions" (lag) when processing thousands of subtitles, we use **VTT Metadata Injection**:
1. **Backend**: When AI analysis finishes, `export_subtitle_to_vtt` (in `video_service.py`) generates a `.vtt` file.
2. **Injection**: Metadata is hidden in the VTT file: `[METADATA]{"tag_id": 0, "cloze": {...}}`.
3. **Frontend**:
    - **Web Worker**: `vtt.worker.ts` parses the large VTT file in a background thread.
    - **Binary Search**: The player finds the current/next subtitle in `O(log n)` time.
    - **Clean State**: React only handles the *current* subtitle, not the whole list.

---

## 🛠️ Current State & Key Files

### Backend (Flask)
- `app/services/movie_ai_service.py`: The heart of the AI pipeline (Inference + Cloze Gen + DB Saving).
- `app/services/video_service.py`: Handles VTT generation and injection logic.
- `app/controller/kt_controller.py`: DKT Bridge.
- `scripts/reseed_grammar_id_fixed.py`: IMPORTANT - Resets `grammar_tags` to IDs 0-11 (handles MySQL `AUTO_INCREMENT` quirks).

### Frontend (Next.js)
- `app/components/movies/VideoPlayerWrapper.tsx`: The orchestrator of playback, DKT look-ahead, and modal triggering.
- `app/utils/vtt.worker.ts`: Background VTT parser (Metadata aware).
- `app/components/movies/AdaptiveClozeModal.tsx`: Real AI cloze test UI (verbs, distractors).

---

## 🔜 Tomorrow's Agenda: The "Final Polish"

The architecture is solid, but the **Admin UI** still reflects the "Old AI Model" (CEFR/Difficulty).

### 1. Admin UI Cleanup
- **File**: `client/Fe_CineFluent/app/components/admin/...` (Admin Video Analysis components).
- **Task**: Remove charts for CEFR Ratios and Difficulty Scores (the new model doesn't output these).
- **Enhancement**: Add a **Grammar Distribution Chart** (Pie/Bar chart showing the frequency of the 12 tenses in the movie).

### 2. DKT Feedback Loop
- **Task**: Ensure that when a user finishes a Cloze Test in `AdaptiveClozeModal`, the result (Correct/Wrong) is successfully sent to `/api/kt/update_mastery` and triggers a DKT state update for that user.

### 3. End-to-End Verification
- **Test Case**: Upload video -> Run AI Analysis -> Check `.vtt` file for `[METADATA]` -> Play video -> See AI-driven Cloze trigger.

---

## 🗝️ Pro-Tips for the New Agent
- **Database**: Always ensure `grammar_tags` IDs are 0-11. 
- **VTT**: If you edit `video_service.py`, remember the frontend Worker expects `[METADATA]` to be on its own line.
- **Worker**: If the UI lags, check `vtt.worker.ts`. Do NOT put heavy JSON processing on the React render cycle.

---

## ✅ Session Update (2026-04-21)

### Phase 7 Progress Completed

#### 1. Admin UI cleanup
- Removed legacy CEFR / difficulty-oriented presentation from the admin AI modal.
- Reworked `client/Fe_CineFluent/app/components/admin/admin_video_ai_modal/index.tsx` to focus on:
  - AI status
  - segment count
  - dominant grammar tags
  - grammar distribution read from injected VTT metadata
- Simplified the admin modal visual style:
  - removed decorative icons in the distribution list
  - removed gradient progress bars
  - switched to flat color bars

#### 2. Admin subtitle modal wording sync
- Updated copy in `client/Fe_CineFluent/app/components/admin/admin_subtitles_modal/index.tsx`
- Replaced old “phân tích độ khó phim” wording with grammar-first wording:
  - “Phân tích ngữ pháp AI”
  - grammar-focused success/error/help text

#### 3. Frontend movie analysis card cleanup
- Reworked `client/Fe_CineFluent/app/components/movies/MovieAIAnalysisCard.tsx`
- Removed legacy sections:
  - Movie Score
  - Difficulty Mix
  - Top Hard Segments
- Kept only grammar-relevant information:
  - segment count
  - grammar patterns with percentage bars

#### 4. Grammar distribution support for detail page
- Added `grammar_distribution` to detailed AI analysis serialization only.
- Important optimization:
  - `VideoSchema` still uses summary AI schema
  - `VideoDetailSchema` uses detail AI schema with `grammar_distribution`
  - this avoids unnecessary subtitle queries in video list/admin list responses

#### 5. Badge / grammar label sync
- Added `client/Fe_CineFluent/app/lib/constants/grammar.ts`
- Centralized tag-id → tense label mapping there.
- Updated `AdaptiveClozeModal.tsx` so debug/test display shows tense name instead of raw `#Tag N`.
  - Example: Tag 9 now renders as `Future Continuous`

#### 6. Quiz toggle in player settings
- Added a new setting toggle in `client/Fe_CineFluent/app/components/movies/CustomVideoControls.tsx`
  - label: `Quiz học tập`
- Wired it into `client/Fe_CineFluent/app/components/movies/VideoPlayerWrapper.tsx`
  - when OFF: no DKT look-ahead quiz trigger
  - when ON: existing adaptive cloze flow works as before
- Current default is OFF.

#### 7. Quiz toggle safety fix
- Added cleanup logic in `VideoPlayerWrapper.tsx`
- When user turns quiz OFF:
  - clear pending cloze trigger
  - close current cloze modal if any
  - remove subtitle blur state caused by cloze mode

#### 8. Backend AI demo contract sync
- Updated `server/be_flask_cinefluent/app/controller/ai_controller.py`
- Removed legacy difficulty/CEFR fields from the demo response.
- Demo endpoint now returns grammar-oriented payload:
  - `segment_count`
  - `dominant_grammar_tags`
  - `predicted_segments`
  - `model_meta`

#### 9. Admin list AI status fix
- Updated `client/Fe_CineFluent/app/components/admin/videos_management/index.tsx`
- Replaced old CEFR-based status badge with grammar-safe label:
  - `Grammar AI`

### Known Remaining Issues
- The async analysis endpoint still returns immediately while backend analysis continues in a background thread.
- Because of that, old AI results can remain visible briefly until analysis finishes and VTT is re-exported.
- Proper long-term fix would be:
  - add `PROCESSING` status to `MovieAIAnalysis`
  - update admin/frontend to poll until completion
  - hide stale results while processing

**Happy Coding! You are now the "Brain" of CineFluent.**

---

## ✅ Session Update (2026-04-22)

### Final Polish completed in this pass

#### 1. Added real `PROCESSING` state for Movie AI Analysis
- Updated `server/be_flask_cinefluent/app/models/models_model.py`
  - `MovieAIAnalysis.status` now supports `PROCESSING`, `READY`, `FAILED`
- Added Alembic migration:
  - `server/be_flask_cinefluent/migrations/versions/f2b8d3c4a1e5_add_processing_status_to_movie_ai.py`
- Updated `server/be_flask_cinefluent/app/services/movie_ai_service.py`
  - analysis is marked `PROCESSING` before inference starts
  - stale `grammar_tag_id` and `cloze_data` are cleared before a new pass
  - status stays `PROCESSING` until VTT export finishes
  - only after export does status move to `READY`

#### 2. Prevented duplicate background analysis jobs
- Updated `server/be_flask_cinefluent/app/controller/video_controller.py`
  - if a video is already in `PROCESSING`, the endpoint now returns `202` instead of spawning another thread
  - endpoint message is now grammar-oriented instead of old difficulty wording

#### 3. Fixed stale-result UX in admin
- Rebuilt `client/Fe_CineFluent/app/components/admin/admin_video_ai_modal/index.tsx`
  - added full `PROCESSING` UI
  - hides stale AI result cards while backend is still working
  - polls `/videos/:id` every 5 seconds until status changes
  - only reads VTT metadata when status is `READY`
- Updated `client/Fe_CineFluent/app/components/admin/admin_subtitles_modal/index.tsx`
  - analysis state is now managed locally
  - immediately switches to `PROCESSING` after clicking analyze
  - disables the analyze button while processing
  - polls the backend every 5 seconds to refresh AI state
- Updated `client/Fe_CineFluent/app/components/admin/videos_management/index.tsx`
  - admin list badge now handles `PROCESSING`

#### 4. Fixed quiz race and hardened player gating
- Updated `client/Fe_CineFluent/app/components/movies/VideoPlayerWrapper.tsx`
  - quiz only runs when AI status is actually `READY`
  - async `predictKtAction()` responses are guarded with a request token
  - old in-flight responses are ignored if user turns quiz off meanwhile
  - turning quiz off now clears:
    - pending cloze trigger
    - predicted tag cache
    - current cloze modal
    - subtitle blur state
  - wrapped `onSubtitleSettingsChange` to normalize `learningQuizEnabled` into a strict boolean
- Updated `client/Fe_CineFluent/app/components/movies/CustomVideoControls.tsx`
  - fixed toggle fallback from `?? true` to `?? false`

#### 5. Synced remaining UI surfaces with grammar-only pipeline
- Updated `client/Fe_CineFluent/app/components/movies/MovieDifficultyBadge.tsx`
  - now renders a processing badge for `PROCESSING`
- Updated `client/Fe_CineFluent/app/components/movies/MovieAIAnalysisCard.tsx`
  - now shows a processing state instead of pretending data is ready
- Updated `client/Fe_CineFluent/app/lib/actions/videos.ts`
  - user-facing messages now say grammar analysis instead of difficulty analysis

#### 6. Removed old CEFR leakage from support services
- Updated `server/be_flask_cinefluent/app/services/chat_context_service.py`
  - removed legacy `movie_score`, `movie_cefr_range`, `top_hard_segments` from movie chat context
  - now returns:
    - `status`
    - `movie_level`
    - `segment_count`
    - `dominant_grammar_tags`
- Updated `server/be_flask_cinefluent/app/services/admin_dashboard_service.py`
  - top video cards now use `ai_status` and `ai_label`
  - removed dashboard dependence on CEFR
  - wording changed from AI difficulty analysis to AI grammar analysis
- Updated:
  - `client/Fe_CineFluent/app/lib/types/admin_dashboard.ts`
  - `client/Fe_CineFluent/app/components/admin/dash_board_page/index.tsx`

### Verification performed
- `client/Fe_CineFluent`: `tsc --noEmit` passed
- `git diff --check` passed for the files modified in this pass

### Remaining known gaps
- No socket-based push yet; admin still uses polling for `PROCESSING -> READY`
- Backend and docs are still standardized around `/api/kt/update_state`, not `/api/kt/update_mastery`
