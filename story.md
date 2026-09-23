## Inspiration

Bangladesh is a river-rich country in South Asia, yet many of its rivers face serious pollution and declining water quality. For me, this is more than a dataset or a hackathon problem-I grew up in a country where communities depend on these rivers every day.

That led me to the **One Health** perspective behind AquaSentinel: polluted water does not affect people alone. It also threatens fish, aquatic ecosystems, livelihoods, and the communities that depend on them.

The **Buriganga** and **Turag**, two rivers flowing through Dhaka and declared Ecologically Critical Areas in 2009, kept coming back to me. Years later, extremely low dissolved-oxygen levels can still occur during certain periods. That raised a bigger question: **is the river getting worse, what might be driving the change, and where should limited monitoring resources be focused?**

A simple hackathon project could answer *“safe or unsafe?”* But Bangladesh does not need AI to tell us that some rivers are polluted. The harder problem is turning scattered water-quality data into **trends, predictions, and actionable monitoring priorities**.

That question became **AquaSentinel**. The system starts with European water-quality data, then tests its assumptions against Bangladesh's own river records. **That cross-region comparison is not a side experiment-it is central to the project.**


<img width="1916" height="913" alt="Screenshot 2026-09-22 012459" src="https://github.com/user-attachments/assets/31b00a25-246f-4ae6-8fe7-1a63870381b4" />


## What it does

**In one sentence:** give it a water reading, and it doesn't just say "safe" or "unsafe" - it tells you how confident it is, whether it's even trained for this kind of water, and where an inspector should go first.

- Predicts **Low/Medium/High** risk and explains *why* in plain language (SHAP), not just a label.
- Tracks real multi-year trends across **7,577 European monitoring stations**, flags `NORMAL → WATCH → WARNING → CRITICAL` with specific reasons attached.
- Forecasts next year's risk, backtested only on years the model never saw.
- Ranks stations by **inspection priority** - a list of 200 alerts isn't the same as "go here first."
- Knows when it's out of its depth (out-of-distribution check) and gives a statistically backed confidence range instead of a fake-precise number.
- Checks a reading against **Bangladesh's actual 2023 water law**, pass/fail/*unknown* - never silently assumes compliance when a parameter wasn't measured.
- Runs on **real Buriganga, Turag and Shitalakhya data** - 41 river-years, 2010–2023, zero missing years for Buriganga/Turag.
- Lets nearby residents report what they see (foam, smell, visible pollution) - built to be compatible with a citizen-science pipeline, not a lab result.
- **Interface:** one dashboard, eight focused tabs - assess a reading, browse the live Dhaka map, check legal compliance, see the evidence behind every number - built to be understandable by a non-technical environmental officer, not just a data scientist.

<img width="1230" height="802" alt="Screenshot 2026-09-22 012825" src="https://github.com/user-attachments/assets/87fd6580-e020-48df-a343-44d1bac67061" />

## How we built it

It grew one question at a time. Random Forest on the EU's Waterbase dataset (~40,000 station-year records, 6 countries) + SHAP for explanations. Then: does a station's situation change over time? → a real multi-year early-warning system. Then: can we predict where it's headed? → a one-year-ahead forecaster, tested only on transitions it never saw during training.

Then we ran it on Bangladesh data - and that's where the project actually changed direction (see below). We merged **three independent Bangladesh sources** into one evaluation dataset: DoE's own government reports (2010–2023), a University of Oxford field-monitoring campaign (REACH-Dhaka, 2017–2021, GPS-located), and the 2023 Bangladesh Gazette for the current water law. We added a mask-aware neural network as a second opinion, and a regional model that estimates likely nutrient levels when they weren't directly measured.

Stack: Flask, scikit-learn and SHAP on the backend, React, Leaflet and Tailwind on the front. Everything traces back to one Jupyter notebook we treat as ground truth - if a number's on the dashboard, it came from a notebook cell, not from us typing something that sounded right.

## Challenges we ran into

The real challenge wasn't a bug - it was our model being **consistently wrong** on Bangladesh data, and figuring out whether that was real or noise.

Across dozens of real Bangladesh river-years, the model kept predicting Medium while a plain threshold rule said High most of the time. Digging in: Bangladesh's monitoring program doesn't measure some of the nine parameters we trained on in most years - and those parameters can only push risk *up*, never down. So missing them makes the model structurally too optimistic. Not random - systematic, and explainable once we saw it.

Standard uncertainty tools didn't catch this either. Conformal prediction is supposed to give a statistically guaranteed confidence level - it still silently failed, claiming 90% while actually landing around 84%. We had to calibrate separately by which measurements are actually available.

Sourcing was its own fight. Our first Bangladesh data was three single-point readings with fuzzy "compiled from published studies" sourcing. We weren't comfortable standing behind that, so we pulled real numbers, table by table, out of **seven Bangladesh government PDF reports (2010-2023)** - including one that exists only as a scanned image with no text layer, where we had to read the trend tables directly off the page - plus the Oxford field dataset and the water-law gazette.

And yes, a completely mundane bug: our basemap provider quietly started requiring a paid API key and served "API KEY REQUIRED" watermark tiles instead of a map. Took an embarrassingly long time to notice.

## Accomplishments that we're proud of

Naive uncertainty calibration breaks quietly under a real missingness gap; calibrating for the actual missing pattern fixes it - statistically confirmed (*p* < 10⁻⁶), never made things worse.

We pushed this further than a two-scenario demo. On a **2,070-station-month, 28-river** evaluation, we compute a *mathematically guaranteed lower bound* on risk from only the measured parameters - since unmeasured parameters can only add risk points, never remove them. The model violates that guaranteed floor in roughly 1 in 4 cases, and our out-of-distribution flag predicts exactly those violations at **AUROC 0.895**.

We found Bangladesh's own current water-quality law (2023) already sets thresholds close to what we'd built from EU regulation - so we built a full pass/fail/unknown compliance checker directly against it.

And we closed a real data gap ourselves rather than just disclosing it: one government report existed only as a scanned image; we read its 2016 trend tables directly off the page. Buriganga and Turag now have **zero missing years, 2010–2023**.

It's a real, working app - eight tabs, a tested API, a notebook that reproduces every number on the dashboard - not a slide deck describing what we'd build with more time.

## What we learned

Being accurate isn't the same as being trustworthy, especially across regions. A model that's 99% accurate at home can quietly mislead somewhere else - and the failure is often systematic enough to find and fix, if you bother to look.

The data you need usually already exists - sitting in a government PDF (sometimes a scanned one) nobody's turned into a dataset yet. Bangladesh alone has **405 named rivers**; the environment agency's own lab network actively samples only about **8%** of them. That gap is the whole reason a prioritization tool like this matters - and it's a monitoring-resource problem shared by many countries in the Global South, not just Bangladesh.

And being upfront about what our system *doesn't* do well made the parts we *are* confident about land harder, not softer.

## What's next for AquaSentinel

- Get the parameters still genuinely unmeasured everywhere we've looked (Nitrite, Total phosphorus) for Bangladesh, to see whether the under-prediction actually closes once the data exists.
- Independently re-verify the gazette-read legal thresholds with Bangladesh's Department of Environment before treating them as a citable legal reference.
- Teach the early-warning system to tell "been bad for years" apart from "just started getting bad" - right now both look identical to it.
- Connect directly with OneAquaHealth's own Citizen Science App and Resilience Map, so the inspection-priority layer and citizen reports plug into the wider ecosystem instead of standing alone.
- Test whether the missingness-aware calibration fix generalizes outside Bangladesh - a fair question for any monitoring-scarce country in this hackathon's audience.
- Write this up properly for peer review - limitations and all.