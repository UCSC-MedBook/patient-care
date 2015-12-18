# MedBook-PatientCare

Primary tables vs. report tables

Primary tables contain the most up-to-date information.
New data uploaded using Wrangler goes directly into the primary tables after validation.
New reports are generated when new data comes in, but old reports are never deleted.
Primary tables contain patient identifiable information while report tables do not.

I would guess you would call it "a variant of unknown significance" if it is not known
whether it is actionable. Some prospective genomic studies use a tier system to report
variants:

tier 1 (same variant , same disease): this exact variant is known to be actionable in the patient''s exact disease
(e.g. BRAFV600E mutation in a melanoma patient)

tier 2 (same variant , different disease): this exact variant is known to be actionable in a different disease (e.g.
BRAFV600E mutation in a neuroblastoma patient)

tier 3 (same gene, same disease): the gene is implicated in cancer, but this exact variant is not (BRAF mutation that isn''t a V600E)

You could break it down into tier 3 (gene implicated in this exact disease) and 

tier 4 (same gene, diferent disease) as above for variant.

Then, depending on how conservative the oncologist is, tier 1 and 2 variants are
typically considered actionable. However, some trials only act on tier 1 variants.
The other extreme is "liberal" oncologists who might act on a tier 3 or 4 variant if
there is additional evidence to support it from pathway analysis, etc (this is where CKCC may come in)

One key point that was brought up in DC is that if the clinicians act on tier 2, 3 and
4 events, we need to make sure to capture the outcome so that we can eventually
graduate these variants into "tier 1" if they are indeed drivers.

I think a tier system like this would be a good way to classify variants, and this is
something the community is going towards

Olena

