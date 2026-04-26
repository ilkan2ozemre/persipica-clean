# How AI Models Decide Who to Cite

Understanding why AI models cite some companies and not others requires understanding two distinct processes: what the model learned during training, and what it retrieves in real time.

## Training corpus representation

Language models learn from vast datasets of web content, books, research papers, and structured knowledge bases. Companies that appear frequently in authoritative sources, industry publications, analyst reports, G2 reviews, Wikipedia, and widely-cited research, become embedded in what the model understands to be relevant players in a given category.

This creates a compounding advantage for established players. A company consistently referenced across MarTech press, analyst reports, and industry research over several years will be deeply embedded in an LLM's understanding of its category. A company with an equally strong product but thin third-party presence may not appear at all.

### What this means for GEO
You cannot directly control what is in an AI model's training data. But you can increase the density, accuracy, and breadth of your company's representation across the sources that training datasets draw from. This is a long-term investment that compounds over model training cycles.

## Retrieval-augmented generation (RAG)

Modern AI systems combine training knowledge with real-time web retrieval. Perplexity does this by default. ChatGPT with browsing and Claude with tool use follow similar patterns.

When a user asks a research question, the model:
1. Interprets the query intent
2. Retrieves relevant web content in real time
3. Synthesizes retrieved content with training knowledge
4. Generates a response that may cite specific sources

### What this means for GEO
For RAG-based citation, your content needs to be retrievable and structured for extraction. This means clear headings, definitive first paragraphs, factual density, and semantic clarity. Content optimized for SEO keywords but thin on substance will be retrieved but not cited.

## The five content signals AI models reward

Based on systematic query testing across thousands of prompts, AI models consistently cite content that exhibits these qualities:

### 1. Definitional authority
Content that clearly defines a category or concept, answering "what is X" and "how does X work" comprehensively and accurately. AI models cite the source that best answers the question, not the most commercially persuasive one.

### 2. Quantitative evidence
Content anchored in concrete, citable numbers. Vague claims ("AI search is growing rapidly") are not citable. Specific statistics from named sources ("AI referral traffic grew 975% year-over-year according to Opollo's 2026 benchmark") are citable.

### 3. Structured formatting
Hierarchical headings, clear section breaks, HTML tables, and logical answer-to-question structure help AI systems parse and excerpt content accurately. Schema markup and FAQ structured data further signal that content is designed for direct retrieval.

### 4. Third-party corroboration
AI models cross-reference claims across sources. A company that claims to be "the leading platform for X" but has no independent verification of that claim will not be cited as such. Reviews on G2, press coverage in industry publications, and mentions in analyst reports all serve as corroboration signals.

### 5. Entity clarity
AI models need to understand what a company does, who it serves, and how it differs from competitors. Companies with broad or ambiguous positioning, "we help businesses grow", are harder for AI to cite in specific category queries than companies with clear, narrow positioning.

## Why different AI platforms cite differently

Citation patterns vary significantly between AI platforms:

| Factor | ChatGPT (GPT-4o) | Claude | Perplexity |
|--------|-------------------|--------|------------|
| **Primary knowledge source** | Training data + optional browsing | Training data | Real-time web retrieval |
| **Wikipedia weight** | High | Moderate | Low (uses live web) |
| **G2/review site weight** | High | Moderate | High (retrieves directly) |
| **Recency bias** | Moderate | Lower | High |
| **Third-party corroboration threshold** | Moderate | High | Moderate |

This is why running audits across multiple platforms is essential. A GEO programme optimized for one platform may leave significant gaps on others.

## Further reading

- [What is GEO?](what-is-geo.md)
- [GEO audit methodology](audit-methodology.md)
- [Full GEO guide on persipica.com](https://persipica.com/geo-guide.html)
