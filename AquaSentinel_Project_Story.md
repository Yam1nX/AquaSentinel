## Inspiration

Two rivers run through the middle of this story: the **Buriganga** and the **Turag**,
both flowing through Dhaka, Bangladesh, and both officially declared **Ecologically
Critical Areas** by the Bangladesh government back in 2009. More than a decade later,
they're still severely polluted — dissolved oxygen near zero for months at a time,
biochemical oxygen demand many times over any safe threshold.

We started out wanting to build the obvious thing: an AI model that looks at a water
sample and says "safe" or "unsafe." But the more we dug in, the more we realized that
question is almost the *least* useful one to ask. Anyone standing at the riverbank can
often tell it's polluted. What nobody could easily answer was: *Is it getting worse?
Why? What's likely to happen next year? And if an agency only has enough people to
inspect a handful of sites this month, which ones matter most?*

That reframing — from a single classifier to a system that reasons about trends,
explanations, forecasts, and its own uncertainty — is what actually inspired
**AquaSentinel**.

## What it does

AquaSentinel is a full early-warning and decision-support platform for urban stream
health, built around a model trained on real European river-monitoring data and
honestly tested against real Bangladeshi government data. It:

- **Predicts risk** (Low / Medium / High) from water-quality readings, with a
  plain-language explanation of *why* (via SHAP), not just a number.
- **Detects real deterioration trends** across 7,577 actual multi-year European
  monitoring stations, with a transparent NORMAL → WATCH → WARNING → CRITICAL state
  machine that shows its reasoning.
- **Forecasts next year's risk**, backtested on years the model never saw during
  training, and honest about exactly how often it's right.
- **Ranks stations by inspection priority** — because a list of alerts isn't decision
  support; knowing where to send an inspector first is.
- **Flags when it's out of its depth** — an out-of-distribution detector that catches
  inputs that don't look like anything the model was trained on.
- **Knows what it doesn't know** — a missingness-aware conformal prediction layer that
  gives a statistically guaranteed confidence range instead of a fake-precise number,
  and *widens its answer* honestly when it genuinely can't distinguish Medium from
  High risk.
- **Shows real, government-sourced Bangladesh data** for the Buriganga and Turag
  rivers — not a demo, not a simulation, actual multi-year records.
- **Lets citizens report what they see** — foam, smell, visible pollution — clearly
  labelled as supplementary context, not lab measurements.

## How we built it

We started from a working prototype: a Random Forest classifier trained on the
European Environment Agency's Waterbase dataset (40,638 station-year records, 8,762
stations, six countries), with SHAP for explainability. From there, we built outward
in layers, each one answering a question the last layer exposed:

- Once we could classify a single reading, the obvious next question was *is this
  station's situation changing?* — so we built a real early-warning state machine off
  actual multi-year station histories, not simulated ones.
- Once we could detect a trend, the next question was *what's likely next year?* — so
  we built a one-year-ahead forecasting model, trained on 26,951 real year-to-year
  transitions and walk-forward validated (trained only through 2022, tested only on
  2023–2024, years it never saw).
- Then we tried to actually deploy this model on Bangladesh — and that's when the
  project's real turning point happened. We manually compiled real annual water-quality
  records for the Buriganga and Turag from four Bangladesh Department of Environment
  government reports (2015, 2021, 2022, 2023), extracting numbers table by table from
  the primary source documents, to build a genuine 18-observation, two-river,
  nine-year external test set — no simulation, no synthetic data.
- Testing on that real Bangladesh data is what led us to the project's central
  discovery, described below.
- Backend: Flask + scikit-learn + SHAP. Frontend: React + Leaflet + Tailwind. Every
  number either surface shows traces back to a single, fully executed Jupyter
  notebook that we treat as the source of truth for the whole project.

## Challenges we ran into

- **The model was systematically wrong on Bangladesh data — and we had to figure out
  why, not just report it.** Across all 18 real Bangladesh observations, our
  EU-trained model predicted Medium risk almost every time, while a transparent
  regulatory-threshold rule said High in 17 of 18. At first this looked like a
  failure. Digging in, we found the real cause: Bangladesh's monitoring programme
  doesn't measure four of the nine parameters our model uses (Ammonium, Nitrate,
  Nitrite, Total Phosphorus), and those parameters can only ever *add* to a risk
  score, never subtract — so the model was structurally biased toward
  under-estimating severity whenever they were missing.
- **Standard uncertainty quantification didn't catch this, and we had to build
  something that would.** We tried applying split conformal prediction — a
  distribution-free way to get statistically guaranteed confidence — and found that
  calibrating it the normal way (on fully-measured data) still silently failed:
  it claimed 90% confidence while actually being right only ~84% of the time on
  Bangladesh-like inputs. We had to build a missingness-aware version, calibrated
  specifically for the exact set of parameters available at inference time, to
  actually restore the guarantee.
- **Data integrity was harder than data science.** Our first pass at Bangladesh
  evidence relied on a handful of single-point field measurements with unclear
  original sourcing. Rather than ship that in a research-facing writeup, we went back
  to primary sources — real government PDF reports — and manually rebuilt the
  Bangladesh dataset from tables spread across four separate documents and multiple
  sampling locations per river per year.
- **Frontend map rendering bugs.** Leaflet doesn't automatically recalculate tile
  layout when its container is resized by React state changes, which caused the map
  to visually break when switching tabs — a genuinely tricky bug to trace back to a
  missing `ResizeObserver`.
- **Resisting the urge to overclaim.** Several times a result looked more impressive
  stated loosely than stated precisely. We chose precision every time — including
  running actual statistical significance tests (McNemar's test) on our two headline
  comparisons rather than reporting raw percentage differences alone.

## Accomplishments that we're proud of

- A genuinely reusable finding: **naive uncertainty calibration breaks silently under
  a real-world missingness shift, and calibrating per missingness pattern fixes it** —
  demonstrated with real data, not a toy example, and statistically significant
  (p < 10⁻⁶, with zero cases where the fix made things worse).
- Our out-of-distribution detector flagged 16 of 18 real Bangladesh observations —
  and the two exceptions turned out to line up exactly with the two years Turag's
  real dissolved oxygen recovered toward typical European levels. The system's
  internal signals are coherent with real, independently measured water chemistry.
- We found that Bangladesh's own legal water-quality standard (under its
  Environmental Conservation Rules, 1997) independently corroborates the same
  thresholds we'd already built from EU regulation — meaning our screening rule
  isn't an imported foreign standard, it's backed by Bangladesh's own law too.
- A fully working, end-to-end application — five live dashboard tabs, a tested Flask
  API, and a single notebook that reproduces every number we report.

## What we learned

- **Accuracy without honesty about uncertainty is dangerous, especially across
  regions.** A model that's 99% accurate in Europe can quietly mislead in a different
  deployment context, and the failure mode is often systematic, not random —
  meaning it's diagnosable and fixable if you go looking for it.
- **The best data almost always exists — it just isn't collected into a training set
  yet.** Government agencies in data-scarce regions are often already publishing
  exactly the information needed; the work is finding, extracting, and honestly
  citing it, not simulating around its absence.
- **Statistical rigor is achievable even under hackathon time pressure**, and it
  changes what you can honestly claim.
- **Limitations are not the enemy of a strong project.** Every honestly-stated
  limitation in this project — the forecast model's modest recall, the small
  Bangladesh sample, the risk rule's prototype status — made the parts we *do* claim
  more credible, not less.

## What's next for AquaSentinel

- Extending missingness-aware conformal calibration beyond two fixed scenarios to any
  arbitrary missingness pattern, so the system never has to say "not calibrated for
  this."
- Reaching out to Bangladesh's Department of Environment and local research groups to
  explore access to nutrient-parameter data, to test whether the model's under-call
  narrows once the missing measurements are available.
- Extending the early-warning state machine to distinguish *chronic* long-standing
  pollution from *acutely emerging* deterioration — right now both register as
  CRITICAL under the same rule.
- Testing the same missingness-aware approach in other data-scarce deployment
  regions, to see how general the finding really is beyond this one case study.
- Submitting the research findings for peer review, to put the core methodological
  contribution — and its honest limitations — in front of the broader scientific
  community.
