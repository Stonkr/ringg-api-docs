---
name: ringg-skills
description: Use when integrating with the Ringg AI platform - creating assistants, editing prompts, setting up webhooks, managing knowledge bases, making calls, running campaigns, fetching call history, or any RinggAI API interaction
metadata:
  author: ringg-ai
  version: "1.0"
---

# RinggAI Platform Integration

## Overview

Complete integration skill for the RinggAI Voice AI platform. Covers assistant management, webhook setup, knowledge bases, calling, campaigns, and analytics. Always fetch current state before editing. Always ask the user when requirements are unclear.

## Base URL and Auth

```
Base URL: https://prod-api.ringg.ai/ca/api/v0
Auth Header: X-API-KEY: <api-key>
```

If the user hasn't provided their API key, ask for it before proceeding.

---

# PART 1: Assistant Management

## Creating an Assistant

1. Gather required fields (ask for what's missing):
   - `agent_name` (max 100 chars)
   - `introduction_and_objective` (max 2000 chars) — agent's role/purpose
   - `response_guidelines` (max 3000 chars) — behavioral instructions
   - `task` (max 1500 chars) — specific task
   - `primary_language` — see Supported Languages below
   - `voice_id` — UUID from voices endpoint
   - `intro_message` (max 500 chars) — opening spoken message

2. Optional fields:
   - `faq` (max 5000 chars)
   - `sample_conversations` (max 5000 chars, `\n` between turns)
   - `secondary_language`
   - `agent_type` — `inbound`, `outbound` (default), `outbound_inbound`
   - `custom_variables` — string[] (outbound auto-includes `callee_name`, `mobile_number`)

3. Help pick a voice first if needed:

   ```bash
   curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/voices?language=en-US' \
     -H 'X-API-KEY: YOUR_API_KEY'
   ```

4. Create:

   ```bash
   curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/public/agent' \
     -H 'Content-Type: application/json' \
     -H 'X-API-KEY: YOUR_API_KEY' \
     -d '{
       "agent_name": "Sales Assistant",
       "introduction_and_objective": "You are a sales assistant for Acme Corp.",
       "response_guidelines": "Be polite, helpful, and concise.",
       "task": "Help customers understand products and schedule demos.",
       "primary_language": "en-US",
       "voice_id": "UUID-FROM-VOICES-ENDPOINT",
       "intro_message": "Hello! This is Sarah from Acme Corp. How can I help?",
       "agent_type": "outbound",
       "custom_variables": ["callee_name", "mobile_number", "company"]
     }'
   ```

Response:
```json
{"success": true, "data": {"id": "UUID", "version": "v1", "created_at": "ISO-8601"}, "message": "Agent created successfully"}
```

---

## Editing an Assistant

**CRITICAL: Always fetch the current agent state before editing.**

### Step 1 — Fetch current state:
```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/AGENT_ID' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

### Step 2 — Show user what exists, ask what to change.

### Step 3 — Use `PATCH /agent/v1` with the appropriate operation. One operation per request.

### Edit Operations Reference

| Operation                        | Required Fields                  | Description                   |
|----------------------------------|----------------------------------|-------------------------------|
| `edit_prompt`                    | `agent_prompt`                   | Update assistant instructions |
| `edit_voice`                     | `voice_id`                       | Change primary voice          |
| `edit_language`                  | `language`                       | Change primary language       |
| `edit_agent_display_name`        | `agent_display_name`             | Rename assistant              |
| `edit_intro_message`             | `intro_message`                  | Change opening message        |
| `edit_custom_vars`               | `custom_variables` (string[])    | Update variable list          |
| `edit_secondary_language`        | `secondary_language`             | Change fallback language      |
| `edit_secondary_voice`           | `secondary_voice_id`             | Change fallback voice         |
| `edit_voice_speed`               | `voice_speed` (number)           | Modify speech rate            |
| `edit_vocab`                     | vocab data                       | Update vocabulary/terminology |
| `edit_event_subscriptions`       | `event_subscriptions`            | Configure webhooks            |
| `attach_kb`                      | `kb_id`                          | Connect knowledge base        |
| `remove_kb`                      | `kb_id`                          | Disconnect knowledge base     |
| `attach_inbound_number`          | `number_id`                      | Link phone number             |
| `remove_inbound_number`          | `number_id`                      | Unlink phone number           |
| `edit_agent_whitelisted_domains` | `whitelisted_domains` (string[]) | Allowed domains for webcalls  |
| `edit_noise_settings`            | noise config                     | Background noise handling     |
| `edit_dtmf_settings`             | DTMF config                      | Keypad tone settings          |
| `edit_vad_settings`              | VAD config                       | Voice activity detection      |
| `edit_api_settings`              | API config                       | API integration settings      |
| `edit_extract_callee_name`       | boolean                          | Toggle name extraction        |
| `edit_query_phrases`             | query phrases                    | Update trigger phrases        |

Example — editing a prompt:
```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "operation": "edit_prompt",
    "agent_id": "AGENT_ID",
    "agent_prompt": {
      "prompt_sections": [
        {"section_title": "Role", "section_content": "You are a helpful sales assistant."},
        {"section_title": "Guidelines", "section_content": "Be concise and professional."}
      ]
    }
  }'
```

Response: `{"message": "Agent updated successfully!", "agent_id": "UUID"}`

### Prompt Editing Safety

1. GET the agent first to see the current prompt format
2. If current prompt uses `prompt_sections`, preserve that format — do NOT flatten to plain string
3. If user wants to change one section, keep all other sections unchanged
4. If current prompt is a plain string and user wants sections, convert to `prompt_sections`
5. Always show the user the final prompt before sending

### Prompt Formats

Plain string:
```json
{ "agent_prompt": "You are a helpful sales assistant." }
```

Structured:
```json
{
  "agent_prompt": {
    "prompt_sections": [
      {"section_title": "Role", "section_content": "..."},
      {"section_title": "Guidelines", "section_content": "..."}
    ]
  }
}
```

### Custom Variables

- Referenced in prompts using `@{{variable_name}}` syntax
- Outbound agents always have `callee_name` and `mobile_number` (cannot remove)
- Passed at call time via `custom_args_values`

---

## Listing and Deleting Assistants

```bash
# List all
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/all?limit=20&offset=0' \
  -H 'X-API-KEY: YOUR_API_KEY'

# Get one
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/AGENT_ID' \
  -H 'X-API-KEY: YOUR_API_KEY'

# Delete (soft-delete/archive)
curl -X DELETE 'https://prod-api.ringg.ai/ca/api/v0/agent/AGENT_ID' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## Available Voices

```bash
# All voices
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/voices' \
  -H 'X-API-KEY: YOUR_API_KEY'

# By language
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/agent/voices?language=en-US,hi-IN' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

Response: `id`, `name`, `languages`, `voice_previews`, `gender`, `image_url`

## Supported Languages

`en-US`, `en-IN`, `hi-IN`, `ta-IN`, `te-IN`, `bn-IN`, `mr-IN`, `kn-IN`, `ka-IN`, `gu-IN`, `ar-AE`

---

# PART 2: Webhook Setup

## Event Types

| Event                         | Fires When                             | Key Payload Fields                        |
|-------------------------------|----------------------------------------|-------------------------------------------|
| `call_completed`              | Call finishes (completed/failed/retry) | transcript, duration, status, custom_args |
| `recording_completed`         | Audio processed and downloadable       | recording_url, recording_duration         |
| `platform_analysis_completed` | Ringg AI analysis finishes             | key_points, summary, classification       |
| `client_analysis_completed`   | Custom analysis finishes               | user-defined analysis_data                |

## Subscribe to Webhooks

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "operation": "edit_event_subscriptions",
    "agent_id": "AGENT_ID",
    "event_subscriptions": [
      {
        "event_type": "call_completed",
        "callback_url": "https://your-domain.com/webhooks/call-completed",
        "headers": {"Authorization": "Bearer your-secret"},
        "method_type": "POST"
      },
      {
        "event_type": "recording_completed",
        "callback_url": "https://your-domain.com/webhooks/recording",
        "headers": {"Authorization": "Bearer your-secret"},
        "method_type": "POST"
      }
    ]
  }'
```

Supported method_type: `POST` (recommended), `PUT`, `PATCH`.

## Webhook Requirements

- Endpoint MUST return **HTTP 200** within **30 seconds**
- Use `call_id` for idempotency (retries can deliver duplicates)
- One URL per event_type per agent — re-subscribing overwrites

## Retry Policy

| Attempt | Timing      |
|---------|-------------|
| 1st     | Immediate   |
| 2nd     | +10 seconds |
| 3rd     | +1 minute   |
| 4th     | +2 minutes  |

After 4 failures, delivery stops. Data accessible via API.

## Webhook Payload Schemas

### Common Fields (all events)

`event_type`, `call_id` (UUID), `call_sid`, `agent_id`, `workspace_id`, `agent_name`, `version_id`, `custom_args_values` (object), `call_cost` (number|null), `overall_latency_seconds`, `first_utterance_seconds`

### `call_completed` — additional fields

`call_duration` (seconds), `call_type` (inbound/outbound/webcall), `status` (completed/failed/retry), `to_number`, `from_number`, `transcript` (array of `{"bot":"..."}`/`{"user":"..."}`), `retry_count`, `recording_url` (null at this stage), `bulk_list_id`, `called_on` (UTC), `agent_message_count`, `user_message_count`

### `recording_completed` — additional fields

`recording_url` (MP3 URL), `recording_duration` (seconds), `bulk_list_id`

### `platform_analysis_completed` — additional fields

All `call_completed` fields plus `analysis_data`: `key_points` (string[]), `action_items` (array), `summary`, `classification`, `callback_requested` (bool), `callback_requested_time`, `status` ("analyzed"), `call_disconnect_reason` (agent_hangup/user_hangup), `timezone`

### `client_analysis_completed` — additional fields

Same structure but `analysis_data` is fully custom (user-defined schema).

---

# PART 3: Knowledge Base Management

## Create KB

Rate limit: 10 req/hour. Max 10 files (2MB each), 20 URLs, 5MB total.

```bash
curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/external/kb' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -F 'kb_name=Product Documentation' \
  -F 'files=@document.pdf' \
  -F 'urls=["https://example.com/docs"]' \
  -F 'faqs=[{"question":"Hours?","answer":"9am-6pm IST"}]'
```

`kb_name` is required. `files`, `urls`, `faqs` are all optional but at least one should be provided.

Response: `{"kb_id": "UUID", "processing_status": "pending", "files_queued": 1}`

Processing is async — poll with GET.

## Check KB Status

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/external/kb/KB_ID' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

Status: `pending`, `processing`, `completed`, `failed`

## List All KBs

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/external/kb/all' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## Update KB

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/external/kb' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -F 'kb_id=KB_ID' \
  -F 'new_urls=["https://example.com/new"]' \
  -F 'files_to_remove=["file-id-1"]' \
  -F 'urls_to_remove=["url-file-id-1"]' \
  -F 'faqs_to_remove=["faq-file-id-1"]' \
  -F 'new_faqs=[{"question":"New Q?","answer":"New A"}]'
```

All fields except `kb_id` are optional. Use form-data (not JSON). To add new files: `-F 'new_files=@newdoc.pdf'`.

Removals are permanent.

## Delete KB

```bash
curl -X DELETE 'https://prod-api.ringg.ai/ca/api/v0/external/kb/KB_ID' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

Permanent and irreversible.

## Attach/Remove KB from Agent

```bash
# Attach
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"operation": "attach_kb", "agent_id": "AGENT_ID", "kb_id": "KB_ID"}'

# Remove
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"operation": "remove_kb", "agent_id": "AGENT_ID", "kb_id": "KB_ID"}'
```

---

# PART 4: Phone Numbers & Domains

## Attach Inbound Number

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"operation": "attach_inbound_number", "agent_id": "AGENT_ID", "number_id": "NUMBER_ID"}'
```

Get available numbers: `GET /workspace/numbers`

## Remove Inbound Number

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"operation": "remove_inbound_number", "agent_id": "AGENT_ID", "number_id": "NUMBER_ID"}'
```

## Domain Whitelisting (Web Calls)

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/agent/v1' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"operation": "edit_agent_whitelisted_domains", "agent_id": "AGENT_ID", "whitelisted_domains": ["https://mysite.com"]}'
```

---

# PART 5: Making Calls

## Individual Outbound Call

```bash
curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/calling/outbound/individual' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "name": "John Doe",
    "mobile_number": "+919876543210",
    "agent_id": "AGENT_UUID",
    "from_number": "+919876543211",
    "custom_args_values": {
      "company_name": "Acme Corp",
      "appointment_date": "2026-03-10"
    }
  }'
```

### Required Fields

| Field           | Type   | Description                              |
|-----------------|--------|------------------------------------------|
| `name`          | string | Callee name                              |
| `mobile_number` | string | With country code (e.g. `+919876543210`) |
| `agent_id`      | UUID   | Agent to use                             |

Plus exactly ONE of:
| Field | Type | Description |
| --- | --- | --- |
| `from_number` | string or string[] | Phone number(s) with country code |
| `from_number_id` | string or string[] | Phone number UUID(s) from workspace |

### Optional Fields

| Field                | Type   | Description                                       |
|----------------------|--------|---------------------------------------------------|
| `custom_args_values` | object | Key-value pairs matching agent's custom variables |
| `smart_formatter`    | object | Name formatting options                           |
| `call_config`        | object | Timing, retry, and scheduling config              |

### Smart Formatter

```json
{
  "smart_formatter": {
    "extract_first_name": false,
    "transliteration": false,
    "transliteration_language": {"source": "en", "target": "hi"}
  }
}
```

Transliteration converts names to target script. `"Mr Rajesh Kumar"` → `"राजेश"`

### Call Config

```json
{
  "call_config": {
    "idle_timeout_warning": 5,
    "idle_timeout_end": 10,
    "max_call_length": 240,
    "call_retry_config": {
      "retry_count": 3,
      "retry_busy": 30,
      "retry_not_picked": 30,
      "retry_failed": 30
    },
    "call_time": {
      "call_start_time": "09:00",
      "call_end_time": "18:00",
      "timezone": "Asia/Kolkata",
      "scheduled_at": "2026-03-10T09:00:00+05:30"
    }
  }
}
```

### Response

```json
{
  "status": "success",
  "data": {
    "call_id": "UUID",
    "call_direction": "outbound",
    "call_status": "registered",
    "initiated_at": "ISO-8601",
    "agent_id": "UUID"
  },
  "message": "Call initiated successfully"
}
```

Call status values: `registered`, `ongoing`, `retry`, `error`, `completed`, `failed`, `cancelled`, `forwarded`

---

# PART 6: Campaign Management

## Step 1: Upload Contact List

```bash
curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/campaign/save' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -F 'file=@contacts.csv' \
  -F 'agent_id=AGENT_UUID' \
  -F 'campaign_name=Q1 Sales Outreach' \
  -F 'country_code=IN' \
  -F 'campaign_start_time=04/03/2026, 09:00' \
  -F 'campaign_end_time=04/03/2026, 18:00' \
  -F 'variables_map={"callee_name":"Name","company_name":"Company","email":"Email"}' \
  -F 'call_config={"idle_timeout_warning":10,"idle_timeout_end":15,"max_call_length":300,"call_time":{"call_start_time":"09:00","call_end_time":"18:00","timezone":"Asia/Kolkata"},"call_retry_config":{"retry_count":3,"retry_busy":30,"retry_not_picked":30,"retry_failed":30}}' \
  -F 'remove_invalid_rows=false' \
  -F 'transliterate_callee_name=false'
```

CSV requirements:
- Must include `Mobile Number` column
- Numbers must include country code (e.g. `+919876543210`)
- Minimum columns: `Mobile Number, Name`

`variables_map` maps CSV columns to agent custom variables.

Response:
```json
{"message": "Contacts imported successfully!", "list_id": "UUID", "total_rows": 100, "successful_rows": 98, "failed_rows": 2}
```

## Step 2: Get Phone Number IDs

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/workspace/numbers?limit=50' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## Step 3: Start Campaign

```bash
curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/campaign/start' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "agent_id": "AGENT_UUID",
    "list_id": "LIST_UUID_FROM_STEP_1",
    "from_numbers": ["phone-number-id-1", "phone-number-id-2"]
  }'
```

Returns 402 if insufficient credits. Start with 5-10 concurrent calls before scaling.

## Step 4: Monitor Progress

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/calling/history?bulk_list_id=LIST_UUID&limit=50' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## List All Campaigns

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/campaign/all?limit=20&offset=0' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

---

# PART 7: Call History & Details

## Call History

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/calling/history?start_date=2026-03-01T00:00:00%2B05:30&end_date=2026-03-04T23:59:59%2B05:30&limit=20&offset=0' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

### Query Parameters

| Param          | Type          | Default     | Description        |
|----------------|---------------|-------------|--------------------|
| `start_date`   | ISO 8601 + TZ | Today 00:00 | Start of range     |
| `end_date`     | ISO 8601 + TZ | Today 23:59 | End of range       |
| `limit`        | integer       | 10          | Items per page     |
| `offset`       | integer       | 0           | Items to skip      |
| `agent_id`     | string        | —           | Filter by agent    |
| `status`       | enum          | —           | Filter by status   |
| `bulk_list_id` | string        | —           | Filter by campaign |

### Call Sub-Status Values

`IN_DB`, `QUEUED`, `ACCEPTED`, `RATE_LIMITED`, `RETRY_LIMIT_REACHED`, `RETRY_SCHEDULED`, `FAILED`, `USER_DID_NOT_JOIN`, `USER_LEFT`, `USER_BECAME_IDLE`, `CAMPAIGN_TIME_EXCEEDED`, `MAX_CALL_DURATION`, `NOT_ABLE_TO_CALL`, `USER_TERMINATED`, `DND_SKIPPED`, `VOICEMAIL_DETECTED`, `VOICEMAIL_DETECTED_VIA_LLM`, `PIPECAT_TIMEOUT`, `PRE_CALL_API_FAILED`

## Call Details

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/calling/call-details?id=CALL_UUID&send_analysis=true' \
  -H 'X-API-KEY: YOUR_API_KEY'
```

## Download Call History (CSV)

```bash
curl -X POST 'https://prod-api.ringg.ai/ca/api/v0/calling/history/download?start_date=2026-03-01&end_date=2026-03-04&limit=1000' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  --output call_history.zip
```

Optional params: `agent_id[]`, `status`, `include_analysis`, `call_type`, `bulk_list_id`, `voicemail`, `from_number`, `to_number`, `call_id`.

---

# PART 8: Terminating Calls

Single endpoint: `PATCH /ca/api/v0/campaign/terminate`. The termination mode is determined by which body fields you provide. At least one field is required.

## By Agent

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/campaign/terminate' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"agent_id": "AGENT_UUID"}'
```

Terminates all `registered` and `retry` calls for the agent. Does NOT affect completed or connected calls.

## By Call IDs

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/campaign/terminate' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"call_ids": ["uuid1", "uuid2"]}'
```

## By Campaign

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/campaign/terminate' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"campaign_id": "CAMPAIGN_UUID"}'
```

## By Numbers within a Campaign (max 100)

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/campaign/terminate' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"campaign_id": "CAMPAIGN_UUID", "mobile_numbers": ["+919876543210"]}'
```

## By Numbers globally (max 100)

```bash
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/campaign/terminate' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{"mobile_numbers": ["+919876543210"]}'
```

Add `?terminate_all_calls=true` to terminate across ALL active campaigns (only valid with `mobile_numbers`, cannot combine with `campaign_id`).

## Request Body Reference

| Field            | Type          | Max | Description                                                      |
|------------------|---------------|-----|------------------------------------------------------------------|
| `agent_id`       | string (UUID) | —   | Terminate all calls for this agent                               |
| `call_ids`       | string[]      | —   | Terminate specific calls                                         |
| `campaign_id`    | string (UUID) | —   | Terminate all calls in this campaign                             |
| `mobile_numbers` | string[]      | 100 | Terminate calls to these numbers (international format required) |

---

# PART 9: Workspace & Analytics

## Workspace

```bash
# Get workspace info
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/workspace' -H 'X-API-KEY: YOUR_API_KEY'

# Get numbers
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/workspace/numbers?limit=50' -H 'X-API-KEY: YOUR_API_KEY'

# Get users
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/workspace/users?limit=50' -H 'X-API-KEY: YOUR_API_KEY'

# Get all workspaces
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/workspace/all' -H 'X-API-KEY: YOUR_API_KEY'

# Regenerate API key (invalidates current key immediately)
curl -X PATCH 'https://prod-api.ringg.ai/ca/api/v0/workspace/api-key' -H 'X-API-KEY: YOUR_API_KEY'
```

## Analytics

```bash
curl -X GET 'https://prod-api.ringg.ai/ca/api/v0/analytics/platform-analytics' -H 'X-API-KEY: YOUR_API_KEY'
```

| Endpoint                                  | Description              |
|-------------------------------------------|--------------------------|
| `GET /analytics/platform-analytics`       | Overall platform stats   |
| `GET /analytics/drill-down-analytics`     | Detailed drill-down      |
| `GET /analytics/number-analytics`         | Per-number stats         |
| `GET /analytics/duration-distribution`    | Duration distribution    |
| `GET /analytics/classification-analytics` | Classification breakdown |

## Delete a Contact List

```bash
curl -X DELETE 'https://prod-api.ringg.ai/ca/api/v0/calling/contact/LIST_UUID' -H 'X-API-KEY: YOUR_API_KEY'
```

---

# Error Responses

| Status | Meaning                                                   |
|--------|-----------------------------------------------------------|
| 400    | Bad request / voice-language mismatch / field constraints |
| 401    | Invalid or missing API key                                |
| 402    | Insufficient credits (campaigns)                          |
| 404    | Resource not found                                        |
| 429    | Rate limit exceeded                                       |
| 500    | Server error                                              |

# Red Flags — STOP and Ask

- User wants to edit but hasn't specified which agent → ask for agent_id or name
- User provides a prompt but current format is unknown → fetch agent first
- User wants to change voice but hasn't checked voices → list voices first
- User wants webhooks but hasn't specified events → ask which of the 4 events
- User wants to attach KB, but it doesn't exist → create it first
- User provides callback URL without HTTPS → warn, HTTPS required
- User wants to make a call but hasn't specified the agent → ask for agent_id
- User wants to start a campaign but hasn't uploaded contacts → guide upload first
- User wants to terminate but scope is unclear → ask which termination method
- User provides phone numbers without country codes → warn, required
- Any ambiguity → ask, don't assume
