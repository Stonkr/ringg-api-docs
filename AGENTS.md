# Codex Guidance for Ringg API Docs

## Product Documentation Decisions

- Keep docs changes Mintlify-native unless the user explicitly asks for custom components.
- Do not create standalone public docs/nav pages for `DELETE /agent/{agent_id}` or `PATCH /public/agent/{agent_id}`. If needed, mention these only as contextual notes in the relevant assistant/agent docs.
- For individual outbound call docs, state that exactly one caller-number option is required: `from_number_id` or `from_number`.
- Keep workflow contact-list APIs hidden until Workflows is live.
- Campaign docs should include the standard flow, `POST /campaign/save` plus `POST /campaign/start`.
- Campaign docs should also include the beta large-campaign flow for 5k+ rows: `POST /campaign/upload-csv`, `GET /campaign/upload-status/{bulk_list_id}`, `POST /campaign/make-call-async`, and `POST /campaign/check-balance/{bulk_list_id}`.
