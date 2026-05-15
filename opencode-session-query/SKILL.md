---
name: opencode-session-query
description: Query and manage sessions on a running local OpenCode server. Use this skill whenever the user asks about OpenCode sessions, recent project activity, changed projects, sessions touched in a time window, project/worktree grouping, reports from a local opencode server, or asks to rename/update OpenCode session titles. Prefer curl and jq for fast, dependency-light JSON querying unless the user explicitly asks for a script or richer automation.
---

# OpenCode Session Query

Use this skill to produce recent OpenCode activity reports from a running OpenCode HTTP server. The default target is `http://127.0.0.1:4096`.

The common report is:

```text
[project / worktree | directory] -> { session title, session id }
```

Default time windows:

- Projects changed in the last `48h`.
- Sessions touched in the last `24h`.

## Data Source

Use the OpenCode API directly:

- `GET /project` returns projects with `id`, `worktree`, `time.created`, `time.updated`, and possible `sandboxes`.
- `GET /session?scope=project&directory=<project.worktree>&limit=1000` returns sessions for a project, sorted by most recently updated.
- `PATCH /session/{sessionID}` updates a session. For title renames, send `{ "title": "New title" }`.

Use `project.time.updated // project.time.created` as the project activity timestamp.
Use `session.time.updated // session.time.created` as the session touch timestamp.

## Quick Report

Prefer this curl/jq workflow. It avoids extra runtime dependencies and keeps the result auditable.

```bash
BASE_URL="${OPENCODE_URL:-http://127.0.0.1:4096}"
NOW_MS="$(date +%s000)"
PROJECT_CUTOFF_MS="$((NOW_MS - 48 * 60 * 60 * 1000))"
SESSION_CUTOFF_MS="$((NOW_MS - 24 * 60 * 60 * 1000))"

curl -fsS "$BASE_URL/project" |
  jq -r --argjson cutoff "$PROJECT_CUTOFF_MS" '
    map(select((.time.updated // .time.created // 0) >= $cutoff))
    | sort_by(.time.updated // .time.created // 0)
    | reverse
    | .[]
    | [.id, .worktree] | @tsv
  ' |
while IFS=$'\t' read -r project_id worktree; do
  encoded_directory="$(jq -rn --arg v "$worktree" '$v|@uri')"
  curl -fsS "$BASE_URL/session?scope=project&limit=1000&directory=$encoded_directory" |
    jq -r \
      --arg project "$worktree" \
      --argjson cutoff "$SESSION_CUTOFF_MS" '
        map(select((.time.updated // .time.created // 0) >= $cutoff))
        | sort_by(.directory // "", .time.updated // .time.created // 0)
        | reverse
        | group_by(.directory // $project)
        | .[]?
        | "[\($project) | \(.[0].directory // $project)]"
          + "\n"
          + (map("- { title: \(.title // "Untitled Session"), id: \(.id) }") | join("\n"))
          + "\n"
      '
done
```

## Output Rules

For the default report:

- Include only projects changed within the project window.
- Include only sessions touched within the session window.
- Group sessions by the exact pair `project.worktree | session.directory`.
- Use `session.directory // project.worktree` when a session directory is absent.
- Show each session as `{ title, id }`.
- Omit changed projects that have no touched sessions unless the user asks to include empty projects.
- Preserve full paths unless the user asks for shortened paths.

## JSON Output Variant

If the user asks for JSON, output an object keyed by `[project | directory]`:

```json
{
  "/path/to/project | /path/to/project/subdir": [
    {
      "title": "Session title",
      "id": "ses_abc123"
    }
  ]
}
```

Use this jq body inside the per-project loop when JSON is needed, then merge objects if necessary:

```bash
jq \
  --arg project "$worktree" \
  --argjson cutoff "$SESSION_CUTOFF_MS" '
    map(select((.time.updated // .time.created // 0) >= $cutoff))
    | group_by(.directory // $project)
    | map({
        key: "\($project) | \(.[0].directory // $project)",
        value: map({ title: (.title // "Untitled Session"), id })
      })
    | from_entries
  '
```

## Session Renaming

Rename sessions only when the user explicitly asks to rename, retitle, label, or update session titles. Treat renaming as a write operation: resolve the target carefully, show enough context to avoid surprising the user, perform the smallest update, and verify the final title.

### Rename by Known Session ID

When the user provides an exact session id and a new title, fetch the current session, patch the title, then fetch it again to verify.

```bash
BASE_URL="${OPENCODE_URL:-http://127.0.0.1:4096}"
SESSION_ID="ses_example"
NEW_TITLE="Concise new title"

before="$(curl -fsS "$BASE_URL/session/$SESSION_ID")" || exit 1
old_title="$(printf '%s' "$before" | jq -r '.title // "Untitled Session"')"

curl -fsS \
  -X PATCH "$BASE_URL/session/$SESSION_ID" \
  -H 'content-type: application/json' \
  --data "$(jq -n --arg title "$NEW_TITLE" '{ title: $title }')" >/dev/null

curl -fsS "$BASE_URL/session/$SESSION_ID" |
  jq -r --arg old "$old_title" '
    "- { id: \(.id), old_title: \($old), new_title: \(.title // "Untitled Session") }"
  '
```

### Resolve Sessions Before Renaming

If the user gives a project, directory, title fragment, or natural-language reference instead of an exact session id, first list candidate sessions using the normal query workflow. Do not rename on a fuzzy match when more than one candidate is plausible.

For title or directory matching inside one project:

```bash
BASE_URL="${OPENCODE_URL:-http://127.0.0.1:4096}"
PROJECT="/path/to/project"
MATCH="title or path fragment"
encoded_directory="$(jq -rn --arg v "$PROJECT" '$v|@uri')"

curl -fsS "$BASE_URL/session?scope=project&limit=1000&directory=$encoded_directory" |
  jq -r --arg project "$PROJECT" --arg match "$MATCH" '
    map(select(
      ((.title // "") | ascii_downcase | contains($match | ascii_downcase))
      or ((.id // "") == $match)
      or ((.directory // $project) | ascii_downcase | contains($match | ascii_downcase))
    ))
    | sort_by(.time.updated // .time.created // 0)
    | reverse
    | .[]
    | "- { title: \(.title // "Untitled Session"), id: \(.id), directory: \(.directory // $project) }"
  '
```

If there is exactly one clear candidate and the requested new title is explicit, proceed with the rename. If there are multiple candidates, ask the user to choose by session id. If there are no candidates, say no matching session was found and include the base URL and project/directory searched.

### Bulk Renames

For multiple renames, require an explicit mapping before changing anything:

```text
ses_abc -> New title one
ses_def -> New title two
```

Do not infer bulk rename titles from summaries unless the user asks you to propose titles first. When proposing titles, output the proposed mapping and wait for confirmation before patching.

Use a TSV mapping for auditable bulk changes:

```bash
BASE_URL="${OPENCODE_URL:-http://127.0.0.1:4096}"
RENAMES_TSV='ses_abc	New title one
ses_def	New title two'

printf '%b\n' "$RENAMES_TSV" |
while IFS=$'\t' read -r session_id new_title; do
  [ -n "$session_id" ] && [ -n "$new_title" ] || continue
  before="$(curl -fsS "$BASE_URL/session/$session_id")" || exit 1
  old_title="$(printf '%s' "$before" | jq -r '.title // "Untitled Session"')"

  curl -fsS \
    -X PATCH "$BASE_URL/session/$session_id" \
    -H 'content-type: application/json' \
    --data "$(jq -n --arg title "$new_title" '{ title: $title }')" >/dev/null

  after="$(curl -fsS "$BASE_URL/session/$session_id")" || exit 1
  verified_title="$(printf '%s' "$after" | jq -r '.title // "Untitled Session"')"
  printf -- '- { id: %s, old_title: %s, new_title: %s }\n' "$session_id" "$old_title" "$verified_title"
done
```

### Rename Rules

- Preserve the user's requested title exactly except for trimming accidental leading/trailing whitespace.
- Reject empty titles and ask for a replacement.
- Prefer concise, descriptive titles when the user asks you to propose names.
- Avoid changing session contents, messages, project data, directories, or archives while renaming.
- Verify every rename with a follow-up `GET /session/{sessionID}`.
- Report renames as `{ id, old_title, new_title }`.
- If a rename fails partway through a bulk operation, stop and report which session failed and which prior sessions were already renamed.

## Server and Tool Checks

Before running a report, verify required tools and server availability when the user has not already confirmed them:

```bash
command -v curl >/dev/null && command -v jq >/dev/null
curl -fsS "$BASE_URL/project" >/dev/null
```

If `jq` is missing, ask whether to install it or use Python. Do not silently switch to Python unless the user asks for it or curl/jq cannot reasonably express the requested query.

If the server is not reachable, report the base URL tried and ask whether OpenCode is running on another port.

## Query Adjustments

Adapt the windows when the user specifies different periods:

- "last 2 days" means `48h`.
- "today" means start of local day unless the user specifies rolling 24 hours.
- "last 24 hours" is a rolling window from current time.
- "changed projects" means project activity timestamp unless the user explicitly means Git file changes.
- "touched sessions" means session activity timestamp unless the user asks for message-level inspection.

If the user asks for sandboxes or worktrees separately, include `project.sandboxes` as additional project directories to inspect only after confirming whether they want project-owned sandboxes included. The default report uses `project.worktree` from `/project` and `session.directory` from `/session`.

## Pagination Note

OpenCode's `/session` endpoint accepts `limit`. Use a high enough limit, such as `1000`, for local reporting. Do not assume `start` is an offset unless the server documentation or a live check confirms it.

## Failure Modes

Handle these explicitly:

- Empty project list: state that OpenCode returned no projects.
- No projects in window: state that no projects changed in the requested period.
- Changed projects but no sessions in window: state that no sessions were touched in the session window.
- HTTP error: show the endpoint and status/error text.
- Malformed JSON: say the server response was not valid JSON and include the endpoint queried.
- Rename target not found: state the session id or search criteria used and do not patch anything.
- Ambiguous rename target: list candidate `{ title, id, directory }` entries and ask the user to choose one.
- Rename verification mismatch: report the old title, requested title, observed title, and endpoint used.

## Example Response

```text
Window: projects changed since 2026-05-11T09:00:00Z; sessions touched since 2026-05-12T09:00:00Z

[/mnt/apps/palaver | /mnt/apps/palaver/opencode-session-skill]
- { title: Changed projects and touched sessions report, id: ses_1df825c4fffegp7I8lUsd0b4RI }

[/mnt/apps/kaleidoscope | /mnt/apps/kaleidoscope/fix-search-ux]
- { title: Themability approaches for FilterShortcuts, id: ses_1e392de4effeYUpL0Bqm9Nm3le }
- { title: UI consistency and spacing redesign, id: ses_1e3e694f7ffeKhjWbRthrbLt8S }
```
