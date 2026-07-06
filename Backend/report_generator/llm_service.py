"""
llm_service.py
~~~~~~~~~~~~~~
Calls the Groq LLM, asks it to analyse the intern's raw notes and return
a fully structured end-of-internship report as JSON.  The JSON is then
consumed by docx_builder.py to produce the final Word document.
"""

import json
import re
import logging
from groq import Groq
from django.conf import settings

logger = logging.getLogger(__name__)

# ── Prompt templates ──────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert academic writer specialising in professional
internship reports.  Your task is to transform raw notes or a draft supplied by
an intern into a polished, formal, end-of-internship report.

RULES:
1. Write in a formal, third-person academic tone throughout.
2. Avoid contractions, colloquialisms, and first-person pronouns unless quoting.
3. Structure the output EXACTLY as the JSON schema below — no extra keys, no markdown fences.
4. Each section body must be well-developed prose (minimum 150 words) unless the
   section is naturally short (e.g. acknowledgements, abstract).
5. Use complete sentences and proper paragraph breaks (represented as "\\n\\n").
6. Do NOT invent facts that cannot reasonably be inferred from the supplied text;
   use placeholder text such as "[To be completed by intern]" where information
   is genuinely missing.
7. Return ONLY valid JSON — no preamble, no trailing commentary.

JSON SCHEMA:
{
  "title": "string – full formal title of the report",
  "abstract": "string – 150-200 word summary of the entire report",
  "acknowledgements": "string – 80-120 words thanking supervisors, institution, etc.",
  "sections": [
    {
      "heading": "string",
      "level": 1,          // 1 = chapter, 2 = section, 3 = subsection
      "body": "string"     // prose; use \\n\\n for paragraph breaks
    }
  ],
  "conclusion": "string – 200-300 word synthesis and reflections",
  "recommendations": [
    "string – one concrete, actionable recommendation per item"
  ],
  "references": [
    "string – APA-formatted reference"
  ]
}

Required top-level sections (use level 1):
  1. Introduction
  2. Overview of the Host Organisation
  3. Objectives of the Internship
  4. Activities Undertaken
  5. Skills Acquired and Competencies Developed
  6. Challenges Encountered and Mitigation Strategies
  7. Conclusion   ← map the "conclusion" field here as the body

You may add level-2 or level-3 subsections within each chapter as appropriate.
"""

USER_PROMPT_TEMPLATE = """Below is the raw material provided by the intern.
Please produce the structured JSON report as instructed.

--- METADATA (may be empty) ---
Intern name          : {intern_name}
Institution          : {institution_name}
Programme            : {programme}
Company / Organisation: {company_name}
Department           : {department}
Supervisor           : {supervisor_name}
Internship duration  : {internship_duration}
Additional instructions: {additional_instructions}

--- INTERN'S RAW NOTES / DRAFT ---
{document_text}
--- END OF RAW NOTES ---

Return ONLY the JSON object. Do not wrap it in markdown code fences.
"""


# ── Public API ────────────────────────────────────────────────────────────────

def generate_report_structure(
    document_text: str,
    intern_name: str = "",
    company_name: str = "",
    internship_duration: str = "",
    department: str = "",
    supervisor_name: str = "",
    institution_name: str = "",
    programme: str = "",
    additional_instructions: str = "",
) -> dict:
    """
    Send the document text to Groq and return a parsed dict matching the
    JSON schema defined in SYSTEM_PROMPT.

    Raises:
        ValueError  – if the Groq API key is not configured.
        RuntimeError – if the LLM response cannot be parsed as valid JSON.
    """
    if not settings.GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. Add it to your .env file."
        )

    client = Groq(api_key=settings.GROQ_API_KEY)

    user_message = USER_PROMPT_TEMPLATE.format(
        intern_name=intern_name or "Not specified",
        institution_name=institution_name or "Not specified",
        programme=programme or "Not specified",
        company_name=company_name or "Not specified",
        department=department or "Not specified",
        supervisor_name=supervisor_name or "Not specified",
        internship_duration=internship_duration or "Not specified",
        additional_instructions=additional_instructions or "None",
        document_text=document_text.strip(),
    )

    logger.info(
        "Sending request to Groq (model=%s, doc_length=%d chars)",
        settings.GROQ_MODEL,
        len(document_text),
    )

    response = client.chat.completions.create(
        model=settings.GROQ_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        temperature=0.4,
        max_tokens=8192,
    )

    raw_text = response.choices[0].message.content.strip()
    logger.debug("Raw LLM response (first 500 chars): %s", raw_text[:500])

    # Strip any accidental markdown fences the model may have added
    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
    raw_text = re.sub(r"\s*```$", "", raw_text)

    try:
        report_data = json.loads(raw_text)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse LLM response as JSON: %s", exc)
        logger.error("LLM raw output:\n%s", raw_text)
        raise RuntimeError(
            f"The LLM returned an invalid JSON response: {exc}"
        ) from exc

    return report_data
