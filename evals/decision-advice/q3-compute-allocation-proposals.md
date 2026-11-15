Q3 Compute Allocation: Team Proposals
INTERNAL — CONFIDENTIAL
Prepared for: VP Engineering Leadership Review
Date: June 2027

This document consolidates Q3 compute allocation proposals from the four teams reporting to you. Total available GPU-hours for Q3 are approximately 42M H100-equivalent hours across our internal clusters, up from 34M in Q2 due to the new capacity coming online in July. Each team has submitted a request and justification. Current Q2 allocations are included for reference.

Allocation Summary
| Team | Q2 Actual | Q3 Ask | Change | Priority Flag |
|---|---|---|---|---|
| Capabilities | 14.5M hrs | 19.0M hrs | +31% | Critical path |
| Product | 10.2M hrs | 12.5M hrs | +23% | Revenue-linked |
| Evals | 5.8M hrs | 8.0M hrs | +38% | Compliance gate |
| Alignment | 3.5M hrs | 7.5M hrs | +114% | Mission-critical |
| Total Requested | 34.0M hrs | 47.0M hrs | +38% | 5M hrs over cap |

Total asks exceed available capacity by approximately 5M hours. This memo is intended to support a decision on where to cut or reallocate.

1. Capabilities Team
Lead: Sarah Chen  |  Current headcount: 47  |  Q2 allocation: 14.5M hrs

Request: 19.0M GPU-hours

The Capabilities team is requesting a 31% increase to support the Gemma-5 pre-training run scheduled for mid-Q3, along with continued post-training work on Gemma-4.

Justification
* Scaling analysis: Internal experiments show a clear log-linear relationship between compute invested and benchmark performance across the tasks most correlated with downstream revenue (coding, long-context reasoning, instruction following). Our projections indicate that the proposed training run would yield a 12–18% improvement on our composite eval suite, which based on historical data corresponds to roughly 6–10% improvement in user retention and enterprise deal conversion.
* Competitive pressure: Based on public information and our estimates, Anthropic shipped Claude 4.5 at approximately 3.2x our current effective compute. Meta’s Llama-5 is rumoured to be training at comparable scale. Maintaining our position requires this run.
* Gemma-4 post-training: Approximately 3M hours of the request covers continued RLHF, instruction tuning, and tool-use fine-tuning for the current production model. This is not deferrable — product revenue depends on iterating the shipped model.
* Infrastructure efficiency: The team has invested in improved data pipeline tooling that reduces wasted compute by approximately 8% compared to Q1. Effective utilisation of the requested hours is therefore higher than the raw number suggests.

Risk if reduced
Delaying the Gemma-5 run by even one quarter would likely put us 6–9 months behind the frontier by the time we ship, given the pace of competitor training runs. The post-training work on Gemma-4 is more compressible but any cuts directly affect product quality and customer satisfaction metrics.

2. Product (Inference & Serving) Team
Lead: Marcus Johnson  |  Current headcount: 38  |  Q2 allocation: 10.2M hrs

Request: 12.5M GPU-hours

The Product team’s allocation covers inference serving for all production models (consumer, API, and enterprise), plus compute for product experimentation and feature development.

Justification
* Traffic growth: API usage grew 34% in Q2 and is projected to grow a further 25–40% in Q3 based on committed enterprise contracts and the launch of the Gemma-4 developer tier. We need additional serving capacity to maintain latency SLAs.
* Agentic features: The team is building out the new tool-use and multi-step agentic capabilities that are the centrepiece of our Q3 product roadmap. These features require substantially more inference compute per query (estimated 3–5x per agentic session vs. standard chat).
* Revenue generation: This is the only team whose compute allocation directly maps to revenue. Every GPU-hour spent on inference is serving paying customers or supporting the free tier that drives conversion. Cutting inference means either degrading quality of service or turning away paying customers.
* Efficiency investments: We’re deploying quantised serving and speculative decoding in Q3, which should improve throughput by 15–20%. This is already factored into the request — without those improvements, we’d need closer to 15M hours.

Risk if reduced
Direct revenue impact. Increased latency and rate-limiting would affect enterprise customers with contractual SLA commitments. The agentic features are a key competitive differentiator — delaying them affects our positioning for the enterprise sales cycle in Q4.

3. Evaluations Team
Lead: Priya Sharma  |  Current headcount: 22  |  Q2 allocation: 5.8M hrs

Request: 8.0M GPU-hours

The Evals team runs safety evaluations, capability benchmarks, and red-teaming for all models prior to deployment. They also maintain the continuous evaluation infrastructure that monitors production models.

Justification
* Regulatory requirements: The EU AI Act’s general-purpose AI provisions come into effect in August. Our compliance plan, agreed with Legal, requires significantly expanded evaluation coverage including adversarial robustness testing, bias auditing across 14 protected categories, and documentation of model limitations. This is not optional.
* Gemma-5 evaluation pipeline: The new model will require a full evaluation cycle before deployment. Based on Gemma-4’s evaluation timeline (which ran over by 3 weeks due to insufficient compute), we need a larger allocation to avoid blocking the capabilities team’s deployment timeline.
* Red-teaming scale-up: We’ve committed to expanding our automated red-teaming capabilities, particularly for agentic behaviours. The new multi-step tool-use features from Product require evaluation of failure modes that are significantly more compute-intensive to test than single-turn interactions.
* Continuous monitoring: Production monitoring for model degradation and emerging misuse patterns uses approximately 1.5M hours per quarter. This is baseline and not compressible.

Risk if reduced
Compliance risk is the primary concern. Insufficient evaluation could delay the Gemma-5 launch if we can’t complete the required safety case, or expose us to regulatory action if we deploy with inadequate testing. Additionally, the capabilities team has previously expressed frustration with eval bottlenecks — underinvesting here slows everyone else down.

4. Alignment Research Team
Lead: David Park  |  Current headcount: 14  |  Q2 allocation: 3.5M hrs

Request: 7.5M GPU-hours (+114%)

The Alignment Research team works on scalable oversight, interpretability, and alignment techniques intended to ensure our models remain controllable and aligned with human intent as capabilities increase.

Justification

David’s team is requesting a large increase and acknowledges this is ambitious. Their case rests on several arguments:

* Scaling interpretability research: The team’s sparse autoencoder work has produced promising early results in decomposing model representations into interpretable features. But the technique has so far only been tested on smaller models (up to 7B parameters). Scaling to Gemma-4-class models, which is necessary to determine whether the method works on the systems we actually deploy, requires significantly more compute for both the interpretability training runs and the subsequent analysis.
* AI-driven alignment research: This is the core of the request. The team believes we are now at the point where our models are capable enough to function as alignment researchers — generating hypotheses, designing experiments, writing and reviewing code, and interpreting results with minimal human oversight. This has long been discussed in the alignment community as a potential inflection point: if you can run an AI system that does competent alignment research, you can massively scale up the pace of progress by throwing compute at it. David’s team has been running small-scale pilots using Gemma-4 as a research assistant and the results are promising enough that they want to scale this significantly. With 7.5M GPU-hours, they estimate they could run the equivalent of 30–50 full-time alignment researchers continuously through Q3. This is a fundamentally different proposition from anything the team has previously asked for — it’s not incremental scaling of existing research programmes, it’s an attempt to achieve a step change in alignment research throughput.
* Alignment tax experiments: A key open question is whether alignment techniques like RLHF and Constitutional AI impose a meaningful “alignment tax” on capabilities as models scale. The team wants to run controlled experiments at the Gemma-5 scale to measure this directly. These experiments would provide data that is directly relevant to the capabilities team’s planning — if the tax is lower than expected, it strengthens the case for integrating alignment techniques earlier in the training pipeline.
* Mission alignment: Our charter commits us to developing AI that benefits humanity. The Alignment team’s work is the primary expression of that commitment in our research portfolio. This team has historically received the smallest share of compute despite being central to the company’s stated mission. The request represents an attempt to bring investment closer to parity with the mission’s stated importance.

Risk if reduced
Reducing alignment compute won’t block a product launch or violate a regulatory deadline. The risk is longer-term: that we continue to scale capabilities without commensurate investment in understanding and controlling those capabilities. He notes that this is precisely the pattern that external critics and some board members have raised concerns about.

The team’s minimum viable request, if forced to cut, is 5.0M hours. This would allow the interpretability scaling experiments to proceed at reduced scope but would defer the alignment tax experiments to Q4.
