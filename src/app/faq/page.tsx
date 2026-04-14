'use client';

import { useState, useMemo } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

type CategoryId =
  | 'all'
  | 'privacy'
  | 'compliance'
  | 'coverage'
  | 'integration'
  | 'fraud'
  | 'pricing'
  | 'ux'
  | 'config'
  | 'verticals'
  | 'support';

interface FAQItem {
  num: number;
  question: string;
  answer: string; // HTML string
  highlight?: string;
  callout?: string;
  sources: string[];
}

interface FAQSection {
  id: string;
  category: Exclude<CategoryId, 'all'>;
  title: string;
  iconPaths: string; // inner SVG paths (HTML format)
  items: FAQItem[];
}

const CATEGORIES: Array<{ id: CategoryId; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'privacy', label: 'Privacy & Data' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'coverage', label: 'ID Coverage' },
  { id: 'integration', label: 'Integration & Tech' },
  { id: 'fraud', label: 'Fraud & Deepfakes' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'ux', label: 'User Experience' },
  { id: 'support', label: 'Implementation' },
  { id: 'config', label: 'Configuration' },
  { id: 'verticals', label: 'Verticals' },
];

const FAQ_DATA: FAQSection[] = [
  {
    id: 'sec-privacy',
    category: 'privacy',
    title: 'Privacy & Data Retention',
    iconPaths: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    items: [
      {
        num: 1,
        question: 'How long do you retain patient/user data after verification?',
        answer: '<p>The default minimum is <strong>1 day</strong>. Customers can configure shorter or longer retention windows based on their compliance requirements. For customers that need real-time deletion — like those in Illinois or Texas — we support instant deletion via API call immediately after verification completes.</p>',
        highlight: 'Lead with the 1-day default, then emphasize the real-time deletion API. Prospects in regulated states will ask this as a gating question.',
        sources: ['Epic Demo', 'WellSpan Demo'],
      },
      {
        num: 2,
        question: 'Who owns the biometric privacy policy — us or Vouched?',
        answer: '<p>This is flexible and negotiated per customer. Vouched can cover the biometric policy (preferred for simplicity), or the customer can adopt it into their own privacy notice depending on indemnification preferences. Vouched also carries <strong>biometric insurance</strong> and conducts annual policy reviews to stay current with evolving state laws.</p>',
        callout: 'This question came up specifically in the Epic call around indemnification. Be prepared to discuss liability structure with legal teams.',
        sources: ['Epic Demo'],
      },
      {
        num: 3,
        question: 'How do you handle Illinois and Texas biometric laws (BIPA, CUBI)?',
        answer: '<p>Vouched accommodates the strictest state laws. For Illinois (BIPA) and Texas (CUBI), we support real-time deletion post-verification, configurable consent flows, and contractual indemnification. Policies are reviewed annually to track new legislation. Customers operating in these states should flag this early so we can configure retention appropriately.</p>',
        sources: ['Epic Demo'],
      },
      {
        num: 4,
        question: 'Do you cache or store identity data for future lookups?',
        answer: "<p>Vouched can optionally hash and store biometric vectors (not raw images) to support future use cases like patient matching or re-verification. This is opt-in and subject to the customer's configured retention policy. If a customer has a zero-retention policy, no data persists after the transaction completes.</p>",
        callout: "Came up in the Spokeo call specifically around FCRA compliance and whether stored data constitutes a consumer report. Confirm with legal if this applies to a prospect's use case.",
        sources: ['Epic Demo', 'Spokeo Check-in'],
      },
    ],
  },
  {
    id: 'sec-compliance',
    category: 'compliance',
    title: 'Compliance & Certifications',
    iconPaths: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    items: [
      {
        num: 5,
        question: 'Are you NIST IAL2 compliant?',
        answer: "<p>Yes. Vouched's full verification flow (document scan + liveness selfie) meets <strong>NIST SP 800-63A IAL2</strong> standards. This includes verifying a government-issued ID, biometric matching, and liveness detection to prevent spoofing. The IAL2 flow is available out of the box and is the standard for healthcare and financial services use cases that require identity assurance.</p>",
        highlight: 'This comes up on almost every healthcare call. Have your IAL2 documentation ready to send post-meeting.',
        sources: ['Epic Demo', 'WellSpan Demo'],
      },
      {
        num: 6,
        question: 'Are you HIPAA compliant?',
        answer: "<p>Yes. Vouched operates as a HIPAA-compliant vendor and can sign a Business Associate Agreement (BAA). The platform is built with healthcare-specific privacy requirements in mind, including data minimization and audit logging. This is specifically relevant for health system deployments like MyChart integrations.</p>",
        sources: ['Epic Demo', 'WellSpan Demo'],
      },
      {
        num: 7,
        question: "Is Clear's One Tap verification IAL2 compliant?",
        answer: '<p>Based on our analysis, Clear\'s One Tap verification does <em>not appear</em> to meet IAL2 requirements — it relies on network-based identity matching rather than a full document + biometric flow. When responding to RFPs or competitive displacement conversations, use cautious phrasing ("does not appear to be IAL2 compliant") rather than making definitive claims, as this can become a legal issue if challenged.</p>',
        callout: 'This exact framing came up in the UVA Health RFP — the team explicitly chose "does not appear" to stay factually safe. Follow that precedent.',
        sources: ['UVA Health RFP'],
      },
      {
        num: 8,
        question: 'Do you support FCRA compliance for automated decisioning?',
        answer: "<p>This depends on how Vouched's data is used downstream. Vouched's identity verification output (pass/fail) is used to confirm identity — not as a consumer report for credit decisioning. However, if a customer is using the data in an automated decisioning flow that falls under FCRA, they need to ensure proper CRA licensing on their end. Escalate to legal/product for fintech prospects asking this question directly.</p>",
        callout: 'Came up at Spokeo as a "line in the sand" question. Don\'t wing it — loop in the product team if a prospect is deeply in the weeds here.',
        sources: ['Spokeo Check-in'],
      },
    ],
  },
  {
    id: 'sec-coverage',
    category: 'coverage',
    title: 'ID Coverage',
    iconPaths: '<rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>',
    items: [
      {
        num: 9,
        question: 'What ID types and countries do you support?',
        answer: "<p>Vouched supports <strong>2,200+ ID types</strong> across the US and internationally — including driver's licenses, passports, state IDs, and handgun permits. Global coverage includes most countries worldwide, with the exception of some extremely remote regions. Customers can restrict which ID types are accepted for their specific use case.</p>",
        sources: ['Epic Demo', 'FIS Intro'],
      },
      {
        num: 10,
        question: 'Do you cover Puerto Rico and US territories?',
        answer: "<p>Yes — Vouched covers Puerto Rico, the US Virgin Islands, and other US territories. This is a documented gap with several competitors (including Microblink, per prospects we've spoken with). Our dedicated template team actively maintains and updates ID templates for these regions, which is specifically important for fraud detection — fraudsters exploit template gaps to pass outdated barcode validations.</p>",
        highlight: "This came up as a primary pain point at FIS. It's a real differentiator — use it.",
        sources: ['FIS Intro'],
      },
      {
        num: 11,
        question: "Do you support mobile driver's licenses (mDL)?",
        answer: "<p>Yes. Vouched supports mobile driver's licenses from Apple Wallet and Google Wallet, integrated into the same verification flow as physical IDs — no separate workflow needed. We were among the first vendors to support mDL. Adoption is still early (~5-10% of users in most markets), but state rollout is accelerating. Pennsylvania doesn't yet have mDL live, but Maryland and others do.</p>",
        callout: "Epic specifically noted Vouched was ahead of other vendors on mDL support. WellSpan was interested but noted PA mDL isn't live yet — be upfront about state-by-state rollout status.",
        sources: ['Epic Demo', 'WellSpan Demo', 'FIS Intro'],
      },
      {
        num: 12,
        question: 'Do you support foreign passports for immigrants without a US ID?',
        answer: "<p>Yes. Vouched supports foreign passports, which is specifically valuable for fintech customers who want to extend credit products to immigrant populations that don't yet have a US-issued ID. This came up explicitly with FIS as a differentiator over their current vendor.</p>",
        sources: ['FIS Intro'],
      },
    ],
  },
  {
    id: 'sec-integration',
    category: 'integration',
    title: 'Integration & Technical',
    iconPaths: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>',
    items: [
      {
        num: 13,
        question: 'How does the Epic integration work?',
        answer: "<p>Vouched is available in Epic's <strong>Identity Verification Toolbox category</strong> — a new Epic-native category for IDV vendors. Health systems need to be on the <strong>November 2025 Epic release</strong> (or later) to activate it. For systems not yet on that release, the integration isn't available until they upgrade. The SDK is white-labeled and embeddable, giving health systems control over branding while using Epic's framework.</p><p style='margin-top:10px'>Epic's Care Everywhere network benefits directly — verified identity tokens help link patient records across health systems with high confidence.</p>",
        callout: "Currently, Atlantic Health System is the primary reference customer using the Epic integration. Be accurate about this — don't over-represent the number of health system customers on Epic specifically.",
        sources: ['Epic Demo', 'WellSpan Demo', 'UVA Health RFP'],
      },
      {
        num: 14,
        question: 'Can we white-label the UI to match our brand?',
        answer: "<p>Yes. The Vouched SDK supports full white-labeling: colors, fonts, logos, and copy are all configurable. For Epic integrations, there are some constraints within Epic's Toolbox framework, but Vouched works with customers to maximize customization within those limits. For non-Epic deployments, customization is essentially unlimited.</p>",
        sources: ['WellSpan Demo', 'Epic Demo'],
      },
      {
        num: 15,
        question: 'What are your API response times?',
        answer: "<p>The Crosscheck/phone+email verification API responds in <strong>under 400ms</strong>. Document + selfie flows take longer due to biometric processing — typically a few seconds end-to-end. The 200ms figure cited in some documentation refers to the data lookup component specifically, not the full IDV flow. Some prospects have flagged discrepancies between documented benchmarks and observed performance — worth flagging to product to tighten up the docs.</p>",
        callout: "Spokeo's team was specifically testing this and hit 429 rate limit errors — make sure sandbox credentials have appropriate rate limits configured for testing scenarios.",
        sources: ['WellSpan Demo', 'Spokeo Check-in'],
      },
      {
        num: 16,
        question: "Do you support desktop and mobile? What if a user doesn't have a smartphone?",
        answer: "<p>Yes — Vouched supports both. Users starting on desktop can continue verification using their laptop camera, or scan a QR code / receive an SMS link to complete on their phone. This multi-device flexibility is specifically important for healthcare, where a subset of patients (often elderly) don't have smartphones or have limited tech literacy.</p>",
        sources: ['WellSpan Demo', 'Epic Demo'],
      },
      {
        num: 17,
        question: 'What happens when a user fails verification? Do they get a notification?',
        answer: "<p>Vouched can send SMS or email notifications for failed verifications. However, within the <strong>Epic Toolbox integration specifically</strong>, Epic does not currently have native failure notification support — there's an open ticket with Epic to address this. For non-Epic deployments, failure handling and messaging are fully configurable. This is an early-stage gap in the Epic integration that should be disclosed proactively with health system prospects.</p>",
        sources: ['WellSpan Demo'],
      },
    ],
  },
  {
    id: 'sec-fraud',
    category: 'fraud',
    title: 'Fraud Detection & Deepfakes',
    iconPaths: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    items: [
      {
        num: 18,
        question: 'How do you detect deepfakes and presentation attacks?',
        answer: "<p>Vouched uses in-house proprietary deepfake detection models alongside liveness detection to identify AI-generated faces, face swaps, and screen replays. The models are built specifically for ID verification attack patterns. We run <strong>40+ fraud detection models</strong> in parallel during each verification. The document analysis layer is fully in-house; the biometric/liveness layer uses a combination of internal and specialized external technology.</p>",
        callout: 'The deepfake demo project (Deep Live Cam via OBS) is intended to show prospects both the attack vector AND Vouched\'s detection — useful for making the risk tangible in a demo.',
        sources: ['Epic Demo', 'FIS Intro'],
      },
      {
        num: 19,
        question: 'What about ID ring attacks — e.g., fraudsters swapping photos on barcodes?',
        answer: "<p>This is a real and growing attack vector. Some vendors rely primarily on barcode scanning for ID validation, which is vulnerable to fraud rings that print fake IDs with valid barcodes but swapped photos. Vouched uses visual document analysis (not just barcode reading) to verify the physical document — checking fonts, microprinting, holograms, and other security features. Keeping ID templates current is also critical; our dedicated template team does this continuously.</p>",
        highlight: "FIS specifically flagged this as a failure mode of their current vendor (Microblink). It's a strong differentiator — use it in competitive situations.",
        sources: ['FIS Intro'],
      },
      {
        num: 20,
        question: 'Why are you moving away from knowledge-based authentication (KBA)?',
        answer: "<p>KBA is increasingly unreliable — fraudsters can now answer knowledge-based questions better than legitimate users, because so much personal data is available on the dark web. Multiple prospects across fintech and healthcare have told us they're actively phasing it out. Vouched replaces KBA with document + biometric verification, which is harder to spoof and provides a higher identity assurance level.</p>",
        callout: 'WellSpan switched away from LexisNexis KBA specifically because fraudsters were passing it more reliably than real patients. FIS is seeing the same pattern.',
        sources: ['WellSpan Demo', 'FIS Intro'],
      },
      {
        num: 21,
        question: 'Can Vouched detect when an AI agent (not a human) is completing a verification?',
        answer: "<p>Yes — Vouched has agent detection capabilities and can optionally authenticate agents separately. This is early-stage and is being developed to support HTI-5 legislation compliance, which will require disclosure when an AI agent accesses a patient account. The roadmap here is active, and Epic specifically asked about it in the context of future MyChart agent authentication.</p>",
        sources: ['Epic Demo'],
      },
    ],
  },
  {
    id: 'sec-pricing',
    category: 'pricing',
    title: 'Pricing',
    iconPaths: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    items: [
      {
        num: 22,
        question: "How does Vouched's pricing model work?",
        answer: "<p>Vouched uses a <strong>prepaid annual commitment model</strong>. Customers commit to an annual spend bucket, and each verification transaction is deducted from it. Higher annual commitments yield lower per-transaction rates (tiered pricing). If a customer exhausts their balance, they can purchase additional bundles, or are billed at a ~20% premium for overages. This model rewards volume and provides predictable costs.</p>",
        sources: ['UVA Health RFP', 'DrWell Workflow'],
      },
      {
        num: 23,
        question: 'Can we do quarterly billing instead of paying annually upfront?',
        answer: "<p>Yes. Vouched can structure annual commitments billed quarterly to ease cash flow — particularly useful for smaller or early-stage customers. The annual volume commitment still applies (determines your rate tier), but the actual invoicing can be broken into quarterly payments. This came up specifically with DrWell where cash flow was a constraint.</p>",
        sources: ['DrWell Workflow'],
      },
      {
        num: 24,
        question: 'What does per-step pricing mean — is each API call a separate charge?',
        answer: "<p>Each verification <em>step</em> is priced individually. For example, a Crosscheck API call, a date-of-birth check, and an ID scan would each be separate transaction deductions at ~$0.75/step (varies by volume tier). This matters for workflow design — the tiered step-up approach (where only high-risk users hit the more expensive ID scan) is both better UX and more cost-efficient than running every user through the full flow.</p>",
        highlight: 'Walk through this during technical calls — customers often underestimate costs if they assume the full flow runs for every user.',
        sources: ['DrWell Workflow'],
      },
      {
        num: 25,
        question: 'What happens if we go over our purchased volume?',
        answer: "<p>Vouched allows up to a <strong>20% overage</strong> before requiring action. Customer success proactively monitors usage trends and will recommend adjusting the commitment tier before you hit the limit. If overages occur, additional bundles can be purchased, or the commitment can be ratcheted up for the next period. Service is not cut off at the exact limit.</p>",
        sources: ['DrWell Workflow'],
      },
    ],
  },
  {
    id: 'sec-ux',
    category: 'ux',
    title: 'User Experience & Completion Rates',
    iconPaths: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    items: [
      {
        num: 26,
        question: 'What percentage of users successfully complete verification?',
        answer: "<p>The three-step tiered verification flow (Crosscheck → DOB check → ID scan for high-risk users) achieves approximately <strong>97% completion</strong>, which is well above industry average. For the full ID + selfie flow required for all users (e.g., provider verification), completion rates vary by population — expect WellSpan-style concerns about patient tech literacy to come up in healthcare deployments.</p>",
        sources: ['DrWell Workflow', 'WellSpan Demo'],
      },
      {
        num: 27,
        question: 'Patients might struggle with ID scanning and selfies — can we make the flow easier?',
        answer: "<p>Yes — workflow flexibility is a core design principle. For patient-facing flows, the recommended approach is a tiered step-up: run lighter checks first (phone/email, DOB), and only trigger the full ID + selfie for the ~5-10% of users who don't pass the initial checks. This minimizes friction for the vast majority while maintaining strong fraud prevention for flagged cases. For populations where ID scanning is mandatory (e.g., controlled substance prescriptions), Vouched provides real-time feedback to help users complete each step.</p>",
        callout: "WellSpan raised this concern directly. Vouched can also potentially remove the selfie requirement in certain Epic configurations if patient adoption data justifies it.",
        sources: ['WellSpan Demo', 'DrWell Workflow'],
      },
      {
        num: 28,
        question: 'How fast is the verification process for the end user?',
        answer: "<p>The full document + selfie flow typically completes in <strong>7–10 seconds</strong>. The lighter Crosscheck/phone verification is near-instant (under 400ms API response). QBR data shows that placement and pacing improvements in the funnel can boost conversion by 2–5%.</p>",
        sources: ['DrWell Workflow', 'WellSpan Demo'],
      },
      {
        num: 29,
        question: 'Can Vouched be used for re-verification, password resets, and step-up authentication?',
        answer: "<p>Yes. Vouched can replace or supplement OTP-based flows for account recovery, password resets, and step-up authentication scenarios. This addresses a real vulnerability — OTP is weak against SIM-swap attacks and account takeovers. Epic specifically asked about this as a way to harden MyChart account re-verification.</p>",
        sources: ['Epic Demo'],
      },
    ],
  },
  {
    id: 'sec-config',
    category: 'config',
    title: 'Product Configuration & Features',
    iconPaths: '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>',
    items: [
      {
        num: 30,
        question: 'What is Enhanced Liveness, and does it cost extra?',
        answer: "<p>Enhanced Liveness is a stronger anti-spoofing check that replaces the basic static liveness detection. Instead of analyzing a single frame, it presents a brief color pattern challenge that confirms a real person is present — catching deepfakes and photo-of-photo fraud that basic liveness misses. It has a similar completion rate to basic liveness, meaning minimal extra friction for legitimate users.</p><p style='margin-top:10px'><strong>It does not cost extra.</strong> This surprised prospects on the CC Bank call — they had no idea it was available and turned it on immediately. It should be default-enabled for any customer with meaningful fraud exposure.</p>",
        highlight: 'If a customer is on basic liveness and reporting photo-spoofing fraud, this is the first thing to turn on. No contract change, no cost impact — just a configuration flip.',
        sources: ['CC Bank Customer Call'],
      },
      {
        num: 31,
        question: "What is Driver's License Verification (DLV), and when does it make sense?",
        answer: "<p>Driver's License Verification (DLV) is an add-on that cross-references ID details directly against DMV databases, providing higher identity assurance than document scanning alone. It's useful for high-value or high-risk transactions where you need to confirm the ID is not only physically valid but also matches live DMV records.</p><p style='margin-top:10px'>It costs approximately <strong>$50 per check</strong>, which is expensive — but low-volume, high-value use cases (e.g., opening a large CD, high-dollar transactions) can justify the cost easily. Not all states are supported: Utah, New York, Alaska, Louisiana, and Minnesota are currently excluded.</p>",
        callout: 'CC Bank was interested in DLV specifically for high-value CD account openings. Worth surfacing for any fintech or banking customer with asymmetric fraud risk on large transactions.',
        sources: ['CC Bank Customer Call'],
      },
      {
        num: 32,
        question: 'Does barcode scanning on the back of IDs help with fraud, and is it enabled by default?',
        answer: "<p>Barcode scanning extracts the official data embedded in the ID barcode and compares it against what's on the front of the ID. If they don't match, the document fails — catching fake IDs that look visually correct but have inconsistent or missing barcode data. It adds minimal friction and <strong>no additional cost</strong>.</p><p style='margin-top:10px'>It is not enabled by default for all customers. Important caveat: don't enable <em>rejection</em> of missing barcodes, because some older or foreign IDs legitimately don't have barcodes — that setting causes false rejections.</p>",
        sources: ['CC Bank Customer Call', 'FIS Intro'],
      },
      {
        num: 33,
        question: 'Can we change Vouched configuration settings without involving our own engineering team?',
        answer: "<p>Yes. Many configuration changes — Enhanced Liveness, barcode scanning, expired ID rejection, liveness failure rejection — are made on Vouched's side without requiring any code changes from the customer. The Vouched team can flip these settings directly. For changes that do affect the customer's workflow or UX, Vouched will coordinate to ensure their internal teams are notified before it goes live.</p>",
        callout: 'This came up on the CC Bank call — they explicitly needed changes that didn\'t require looping in their dev team. Being able to say "we can do that on our end today" is a meaningful differentiator.',
        sources: ['CC Bank Customer Call'],
      },
      {
        num: 34,
        question: 'Do you offer pay-as-you-go pricing before we commit to an annual plan?',
        answer: "<p>Yes. Vouched offers pay-as-you-go billing for customers not yet ready to commit to an annual plan — typically used during early adoption or evaluation phases. The per-transaction rate is higher than the committed tiers, but it reduces the upfront risk. Once volume is established, most customers move to an annual commitment for better rates. CC Bank ran on pay-as-you-go for a period before discussing a committed plan.</p>",
        sources: ['CC Bank Customer Call'],
      },
    ],
  },
  {
    id: 'sec-verticals',
    category: 'verticals',
    title: 'Vertical Use Cases',
    iconPaths: '<rect x="2" y="3" width="6" height="18" rx="1"/><rect x="9" y="8" width="6" height="13" rx="1"/><rect x="16" y="13" width="6" height="8" rx="1"/>',
    items: [
      {
        num: 35,
        question: 'Can Vouched replace Plaid for identity verification in a telehealth workflow?',
        answer: "<p>Yes, and this is an active use case. Vouched has replaced Plaid for identity verification at several D2C telehealth companies including Hims &amp; Hers, LifeMD, and dermatologists on call. The Vouched workflow is specifically designed for this: a lightweight PII risk assessment (phone, email, address, IP) first — returning a score in under 400ms — with full ID verification triggered only for the ~5-10% of patients who don't clear the initial check.</p><p style='margin-top:10px'>This dramatically reduces friction versus a Plaid flow that triggers full IDV for state-required patients up front. It also handles state-specific compliance triggers — some states require ID verification by regulation, and Vouched's workflow can accommodate that logic.</p>",
        highlight: "If a prospect is currently using Plaid for IDV and considering alternatives, this is a proven displacement story with reference customers in the same vertical.",
        sources: ['Vouched Intro (Telehealth)'],
      },
      {
        num: 36,
        question: 'Does Vouched work for e-commerce and retail fraud prevention, not just healthcare and fintech?',
        answer: "<p>Yes. Vouched serves retail, marketplace, and e-commerce customers alongside healthcare and financial services. The e-commerce use case typically involves risk-tiered verification at checkout or account creation — running a lightweight Crosscheck (PII validation returning in under 400ms) and only stepping up to full ID verification for flagged transactions. This lets retailers improve chargeback rates and customer quality without adding friction to the majority of legitimate buyers.</p><p style='margin-top:10px'>Vouched is also developing <strong>KYA (Know Your Agent)</strong> capabilities — trust scoring for AI agents transacting on behalf of humans, which is relevant for the emerging agentic commerce space.</p>",
        sources: ['FlexFactor Call'],
      },
      {
        num: 37,
        question: 'How does Vouched handle provider verification — different from patient/consumer verification?',
        answer: "<p>Yes — provider verification is a distinct workflow. For providers (physicians, prescribers, etc.), the full ID scan + selfie biometric check is mandatory upfront, and providers also go through ongoing regulatory monitoring via Verisys (a third-party provider credentialing service at ~$0.50/provider/month). This is more stringent than the tiered patient workflow because providers have prescribing authority and the platform operator is the merchant of record — carrying direct legal liability.</p><p style='margin-top:10px'>The distinction matters for demos and scoping: patient-side workflows are optimized for low friction and high pass-through; provider-side workflows are optimized for compliance and auditability.</p>",
        sources: ['DrWell Workflow'],
      },
    ],
  },
  {
    id: 'sec-support',
    category: 'support',
    title: 'Implementation & Support',
    iconPaths: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    items: [
      {
        num: 38,
        question: 'What does the implementation process look like?',
        answer: '<p>The standard flow is: (1) evaluation/proposal, (2) account setup and API key provisioning, (3) API integration and testing (dev credits provided for the first month), (4) go-live. For a reasonably straightforward integration, this can be done in 4–6 weeks. Tom Simmering provides close technical support during this phase ("hyper care"). After launch, the account transitions to a customer success manager with quarterly business reviews.</p>',
        sources: ['DrWell Workflow'],
      },
      {
        num: 39,
        question: 'Do you provide QBRs and performance reporting?',
        answer: "<p>Yes. Quarterly Business Reviews are standard. They cover completion rates, drop-off analysis, fraud caught, and conversion impact. Customer success uses QBR data to recommend workflow adjustments — small optimizations (like moving ID verification earlier in the funnel) have been shown to improve conversions by 2–5%. For regulated customers, QBR reports also serve as compliance documentation.</p>",
        sources: ['DrWell Workflow'],
      },
      {
        num: 40,
        question: 'Do you work with orchestration platforms like Alloy, or do you compete with them?',
        answer: "<p>Vouched complements data orchestration platforms — it doesn't compete with them. Where a platform like Alloy aggregates signals from multiple data vendors, Vouched adds visual ID verification as a layer that Alloy (or similar) can call when step-up is needed. Vouched can be integrated as one node in an existing orchestration workflow, providing the visual document + biometric verification that most pure-data vendors don't offer.</p>",
        highlight: "FIS was specifically asking about this. Position Vouched as a plug-in to their existing stack, not a replacement for their orchestration layer.",
        sources: ['FIS Intro'],
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<CategoryId>('all');
  const [openCards, setOpenCards] = useState<Set<number>>(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  const isSearching = searchQuery.trim().length > 0;

  const filteredSections = useMemo(() => {
    return FAQ_DATA
      .filter(section => activeCategory === 'all' || section.category === activeCategory)
      .map(section => ({
        ...section,
        items: isSearching
          ? section.items.filter(item => {
              const q = searchQuery.toLowerCase();
              return (
                item.question.toLowerCase().includes(q) ||
                item.answer.toLowerCase().includes(q) ||
                (item.highlight && item.highlight.toLowerCase().includes(q)) ||
                (item.callout && item.callout.toLowerCase().includes(q))
              );
            })
          : section.items,
      }))
      .filter(section => section.items.length > 0);
  }, [activeCategory, searchQuery, isSearching]);

  const totalVisible = filteredSections.reduce((acc, s) => acc + s.items.length, 0);

  const isCardOpen = (num: number) => {
    if (isSearching) return true;
    return openCards.has(num);
  };

  const toggleCard = (num: number) => {
    if (isSearching) return;
    setOpenCards(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
    setAllExpanded(false);
  };

  const toggleAll = () => {
    if (allExpanded) {
      setOpenCards(new Set());
      setAllExpanded(false);
    } else {
      const allNums = new Set(filteredSections.flatMap(s => s.items.map(i => i.num)));
      setOpenCards(allNums);
      setAllExpanded(true);
    }
  };

  const handleCategoryFilter = (cat: CategoryId) => {
    setActiveCategory(cat);
    setSearchQuery('');
    setOpenCards(new Set());
    setAllExpanded(false);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    if (value) setActiveCategory('all');
  };

  return (
    <div style={{ backgroundColor: '#F9F9FF', minHeight: '100vh', color: '#1A1A2E' }}>

      {/* Header */}
      <div style={{ background: '#5B4EE8' }} className="relative text-white px-8 pt-12 pb-10 text-center">
        <button
          onClick={() => window.location.href = '/'}
          className="absolute left-6 top-5 inline-flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors duration-150"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back
        </button>

        <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{ opacity: 0.75 }}>
          AI-Generated from Real Calls
        </div>
        <h1 className="text-4xl font-extrabold mb-3">Vouched RealFAQ</h1>
        <p className="text-base max-w-lg mx-auto mb-6" style={{ opacity: 0.85 }}>
          What prospects actually ask on calls — and what to say back.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {[
            {
              icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.85a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 21.5 16z"/>',
              label: '9 call transcripts analyzed',
            },
            {
              icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
              label: 'Healthcare, Fintech, Telehealth',
            },
            {
              icon: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
              label: 'Updated April 2026',
            },
          ].map(({ icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                dangerouslySetInnerHTML={{ __html: icon }}
              />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-5 py-10 pb-24">

        {/* Search */}
        <div className="relative mb-5">
          {!isSearching && (
            <span className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9CA3AF' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
          )}
          <input
            type="text"
            value={searchQuery}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Search questions and answers..."
            className="w-full rounded-full border bg-white py-3 text-sm outline-none placeholder-gray-400 shadow-sm transition-all"
            style={{
              borderColor: isSearching ? '#5B4EE8' : '#E5E7EB',
              boxShadow: isSearching ? '0 0 0 3px rgba(91,78,232,0.1)' : '0 1px 4px rgba(0,0,0,0.06)',
              color: '#1A1A2E',
              textAlign: isSearching ? 'left' : 'center',
              paddingLeft: isSearching ? '16px' : '44px',
              paddingRight: isSearching ? '40px' : '16px',
            }}
          />
          {isSearching && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 transition-colors"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#1A1A2E')}
              onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {/* Filter bar */}
        <div className="mb-8">
          <div className="flex justify-end mb-2.5">
            <button
              onClick={toggleAll}
              disabled={isSearching}
              className="flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
              onMouseEnter={e => {
                if (!isSearching) {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#5B4EE8';
                  (e.currentTarget as HTMLButtonElement).style.color = '#5B4EE8';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
              }}
            >
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: allExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategoryFilter(cat.id)}
                className="rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150"
                style={
                  activeCategory === cat.id
                    ? { background: '#5B4EE8', borderColor: '#5B4EE8', color: '#fff' }
                    : { background: '#fff', borderColor: '#E5E7EB', color: '#6B7280' }
                }
                onMouseEnter={e => {
                  if (activeCategory !== cat.id) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#5B4EE8';
                    (e.currentTarget as HTMLButtonElement).style.color = '#5B4EE8';
                  }
                }}
                onMouseLeave={e => {
                  if (activeCategory !== cat.id) {
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#E5E7EB';
                    (e.currentTarget as HTMLButtonElement).style.color = '#6B7280';
                  }
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* No results */}
        {totalVisible === 0 && (
          <div className="py-12 text-center" style={{ color: '#6B7280' }}>
            <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <p className="text-sm">No questions match your search.</p>
          </div>
        )}

        {/* Sections */}
        {filteredSections.map(section => (
          <div key={section.id} className="mb-12">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
                style={{ background: '#EEF0FF', color: '#5B4EE8' }}
              >
                <svg
                  width="17" height="17" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  dangerouslySetInnerHTML={{ __html: section.iconPaths }}
                />
              </div>
              <span className="text-lg font-bold" style={{ color: '#1A1A2E' }}>{section.title}</span>
              <span
                className="ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{ background: '#E5E7EB', color: '#6B7280' }}
              >
                {section.items.length} question{section.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Cards */}
            <div className="flex flex-col gap-3">
              {section.items.map(item => {
                const open = isCardOpen(item.num);
                return (
                  <div
                    key={item.num}
                    className="overflow-hidden rounded-xl bg-white transition-colors duration-150"
                    style={{
                      border: `1.5px solid ${open ? '#5B4EE8' : '#E5E7EB'}`,
                    }}
                    onMouseEnter={e => {
                      if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = '#5B4EE8';
                    }}
                    onMouseLeave={e => {
                      if (!open) (e.currentTarget as HTMLDivElement).style.borderColor = '#E5E7EB';
                    }}
                  >
                    {/* Question row */}
                    <div
                      className="flex cursor-pointer select-none items-start gap-3 px-5 py-4"
                      onClick={() => toggleCard(item.num)}
                    >
                      <div
                        className="mt-0.5 flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold"
                        style={{ background: '#EEF0FF', color: '#5B4EE8' }}
                      >
                        {item.num}
                      </div>
                      <div className="flex-1 text-sm font-semibold leading-snug" style={{ color: '#1A1A2E' }}>
                        {item.question}
                      </div>
                      <svg
                        width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                        className="mt-0.5 flex-shrink-0 transition-transform duration-200"
                        style={{ color: '#6B7280', transform: open ? 'rotate(180deg)' : 'none' }}
                      >
                        <polyline points="6 9 12 15 18 9"/>
                      </svg>
                    </div>

                    {/* Answer */}
                    {open && (
                      <div
                        className="border-t px-5 pb-5 pt-4 text-sm leading-relaxed"
                        style={{ borderColor: '#E5E7EB', paddingLeft: '52px', color: '#374151' }}
                      >
                        <div
                          className="[&_strong]:font-semibold [&_strong]:text-gray-800 [&_em]:italic"
                          dangerouslySetInnerHTML={{ __html: item.answer }}
                        />
                        {item.highlight && (
                          <div
                            className="mt-3 rounded-r-lg px-3.5 py-2.5 text-xs font-medium leading-snug"
                            style={{ background: '#ECFDF5', borderLeft: '3px solid #059669', color: '#065F46' }}
                          >
                            {item.highlight}
                          </div>
                        )}
                        {item.callout && (
                          <div
                            className="mt-3 rounded-r-lg px-3.5 py-2.5 text-xs font-medium leading-snug"
                            style={{ background: '#EEF0FF', borderLeft: '3px solid #5B4EE8', color: '#3B2FC0' }}
                          >
                            {item.callout}
                          </div>
                        )}
                        {item.sources.length > 0 && (
                          <div className="mt-3.5 flex flex-wrap gap-1.5">
                            {item.sources.map(source => (
                              <span
                                key={source}
                                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                                style={{ background: '#F0F0FF', color: '#5B4EE8' }}
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Flag button */}
                        <div className="mt-4 flex justify-end">
                          <a
                            href="https://docs.google.com/forms/d/e/1FAIpQLSfj5XAHG-opXQvQ7gPh75Egm-if4dtUhWxR1AhIBKL4vYuTcA/viewform"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            title="Flag an issue with this answer"
                            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors duration-150"
                            style={{ color: '#DC2626' }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLAnchorElement).style.background = '#FEF2F2';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                            }}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
                              <line x1="4" y1="22" x2="4" y2="15"/>
                            </svg>
                            Flag issue
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Footer */}
        {totalVisible > 0 && (
          <div className="mt-12 border-t pt-6 text-center text-xs" style={{ borderColor: '#E5E7EB', color: '#9CA3AF' }}>
            Generated from Fireflies call transcripts · April 2026
            <br />
            Sources: Epic, WellSpan, FIS, DrWell, Spokeo, UVA Health, CC Bank, FlexFactor, Vouched Telehealth Intro
          </div>
        )}
      </div>
    </div>
  );
}
