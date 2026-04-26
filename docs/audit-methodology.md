# GEO Audit Methodology

A GEO audit is a structured assessment of how AI platforms perceive, describe, and recommend a specific company. This document describes how to design and run one.

## Audit structure

A meaningful GEO audit tests a company's visibility across four buyer journey stages:

| Stage | What it tests | Why it matters |
|-------|--------------|----------------|
| **Discovery** | Does the company appear when buyers describe their problem without naming anyone? | This is where new pipeline originates. Most companies score 0%. |
| **Comparison** | Does the company appear when buyers compare it to known competitors? | Tests whether AI understands competitive positioning. |
| **Brand** | Does AI accurately describe the company when asked about it by name? | Tests entity accuracy and sentiment. |
| **Buying Intent** | Does the company appear when buyers express purchase readiness? | Tests bottom-of-funnel visibility, the highest-value queries. |

## Query design principles

### Volume
A statistically meaningful audit requires at minimum 20 queries per buyer journey stage, run across at least two platforms. For enterprise categories, 100 to 150 queries total is recommended.

### Natural language
Queries should mirror how real buyers phrase questions. Use conversational prompts, not keyword strings. "What tools can help my team automate outbound prospecting?" not "outbound prospecting automation tools."

### Name omission for discovery
Discovery and buying intent queries must not include the company name. The point is to test whether the company appears organically when a buyer describes their problem.

### Fresh context
Each query should be run as a fresh conversation with no prior context. Prior messages in the same conversation can bias the model's responses.

## Scoring

**Citation rate** = (queries where company is cited ÷ total queries) × 100

A citation is any mention of the company name in the AI response, recommendation, comparison, or informational reference.

### Per-stage scoring
Calculate citation rate separately for each buyer journey stage. The pattern is typically: high scores at Brand and Comparison, zero or near-zero at Discovery and Buying Intent.

### Overall scoring
The overall citation rate is a weighted average. Discovery and Buying Intent carry higher weight because they represent new pipeline generation rather than existing brand awareness confirmation.

## Platform selection

Run across at minimum two platforms to capture citation variance:

- **ChatGPT** (GPT-4o or GPT-4o-mini), Largest user base, strong training data representation
- **Claude** (Haiku or Sonnet), Higher third-party corroboration threshold, different training data composition
- **Perplexity**, Real-time web retrieval, different citation mechanics

## Limitations

- **Non-determinism**: AI responses are probabilistic. The same query may produce different results across sessions.
- **Model updates**: Results may change when platforms update their models.
- **Retrieval variability**: Platforms with real-time web search may produce different results based on what content is currently indexed.

## Further reading

- [How AI models decide who to cite](how-ai-citation-works.md)
- [What is GEO?](what-is-geo.md)
- [Detailed methodology on persipica.com](https://persipica.com/research-methodology.html)
