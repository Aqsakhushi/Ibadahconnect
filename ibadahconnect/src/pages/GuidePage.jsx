import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// ---------- GUIDE DATA (thepilgrim-style: sections => articles) ----------
const GUIDE_DATA = [
  {
    slug: "umrah-badal",
    name: "Umrah Badal",
    symbol: "🕋",
    color: "#0d6b44",
    tint: "#eaf5ef",
    eyebrow: "Umrah Guide",
    heroLine: "Take the first step of the holiest journey",
    desc: "A complete guide to arranging Umrah for a deceased or permanently unable loved one.",
    overview:
      "Umrah Badal means arranging the lesser pilgrimage on behalf of someone who cannot perform it. The process begins with eligibility and intention, then moves through Niyyah, Ihram, Tawaf, Sa'i and Halq or Taqsir — with documented proof at every milestone.",
    sections: [
      {
        slug: "umrah-overview",
        name: "Umrah Badal Overview",
        icon: "🕋",
        about: "What Umrah Badal means, who may receive it and why the proof process matters.",
        articles: [
          { title: "What is Umrah Badal?", text: "Umrah Badal means arranging and performing Umrah on behalf of a deceased person or a living person who is permanently unable to perform it. The performer enters Ihram with the named beneficiary in mind according to the valid arrangement." },
          { title: "Who can receive Umrah Badal?", text: "Common cases include deceased loved ones and people permanently unable to travel or complete the rituals due to age or serious illness. Individual eligibility should be confirmed with a qualified scholar." },
          { title: "How long does completion take?", text: "The rituals themselves take roughly 45 minutes to 3 hours for a single Umrah, but for Badal the full schedule depends on the assigned performer, permitted crowd conditions and the package milestones. Your tracking page shows the live stage at all times." },
          { title: "Virtue of Umrah", text: "The Prophet (peace be upon him) said that Umrah serves as an expiation for sins committed between consecutive Umrahs. This virtue is the reason many families arrange Umrah Badal for their loved ones — it carries the same reward framework when performed with a valid representation." },
          { title: "Umrah Badal in Ramadan", text: "The Prophet (peace be upon him) said: Performance of Umrah in Ramadan is equivalent to Hajj, or he said: equal to performing Hajj with me. This merit extends to all the days and nights of Ramadan, so Ramadan slots are arranged first for eligible beneficiaries." },
          { title: "Why is proof important?", text: "Sponsors receive milestone updates, photo and video proof, location records where required and a completion certificate, so the booking can be followed with total clarity from anywhere in the world." },
        ],
      },
      {
        slug: "umrah-glossary",
        name: "Umrah Glossary",
        icon: "📖",
        about: "The essential Islamic terms used in Umrah Badal, explained simply.",
        articles: [
          { title: "Ihram", text: "Ihram is a sacred state that Muslim pilgrims enter before performing the rituals of Umrah. It involves cleansing acts, a specific dress and clear restrictions. A pilgrim cannot leave this state until Halq or Taqsir is completed." },
          { title: "Niyyah", text: "The sincere intention to perform the Ibadah for a named beneficiary according to the valid representation. For Badal, the Niyyah names the person on whose behalf the pilgrimage is performed." },
          { title: "Talbiyah", text: "The devotional declaration recited after entering Ihram: Labbaik Allahumma Labbaik. It is recited throughout the pilgrimage and affirms that the Umrah is performed for the glory of Allah alone." },
          { title: "Tawaf", text: "Tawaf is the act of circumambulating the Holy Kaaba in an anti-clockwise direction — walking around it seven times as part of the Umrah rituals, reciting Takbir and supplications from the Sunnah." },
          { title: "Sa'i", text: "Sa'i honours the struggle of Hajar (AS), the wife of Prophet Ibrahim (AS). It means walking between Safa and Marwah seven times, performed after Tawaf as a compulsory rite of Umrah." },
          { title: "Halq or Taqsir", text: "Halq is shaving the entire head after completion and applies exclusively to men; Taqsir is shortening the hair. This is the final step after which the pilgrim exits the state of Ihram." },
        ],
      },
      {
        slug: "umrah-preparation",
        name: "Umrah Badal Preparation",
        icon: "📋",
        about: "Beneficiary details, package confirmation, permits and the intention at Miqat.",
        articles: [
          { title: "Step 1 — Confirm the person and ruling", text: "Record the full beneficiary name and confirm that the person is eligible for Umrah Badal. Ask a qualified scholar for a specific ruling when circumstances are unusual." },
          { title: "Step 2 — Choose the correct package", text: "Review the performer, inclusions, number of proof milestones, schedule and certificate before confirming the order." },
          { title: "Step 3 — Record Niyyah and any dua", text: "Provide the Niyyah and any special dua or instruction exactly as you want it recorded. This information is shared with the assigned performer." },
          { title: "Step 4 — Enter Ihram at Miqat", text: "The representative enters Ihram at the appointed Miqat with the name and intention of the beneficiary." },
          { title: "Step 5 — Complete the ritual sequence", text: "Tawaf, Sa'i and Halq or Taqsir are completed in the correct order, with milestone evidence submitted at each stage." },
          { title: "Official permits & the Nusuk app", text: "Umrah permits and Haram reservations are managed through the official Nusuk app. For Badal, the assigned performer handles the permit booking — sponsors never need a Nusuk account; the booking appears on your order timeline." },
        ],
      },
      {
        slug: "umrah-proof",
        name: "Proof & Certification",
        icon: "🏅",
        about: "How completion is documented and delivered to the sponsor.",
        articles: [
          { title: "Milestone tracking", text: "Each stage is updated through the order tracking page so the sponsor can follow the process in real time with the tracking code received after checkout." },
          { title: "Photo and video proof", text: "Where a milestone requires proof, clear photographs and videos are uploaded for sponsor review." },
          { title: "Location verification", text: "Captured location and timing may be attached to proof while the performer completes the ritual." },
          { title: "Completion certificate", text: "After all milestones are complete, a certificate is generated and made available through the order." },
        ],
      },
      {
        slug: "makkah-travel",
        name: "Makkah & Travel",
        icon: "🕌",
        about: "The Haram sanctuary, repeat Umrah and how crowds affect the schedule.",
        articles: [
          { title: "Makkah: The Haram", text: "The Haram is a sanctified area where rewards are amplified and special rules apply out of reverence for God. It was declared a sanctuary from the day the heavens and earth were created, and it remains so till the end of time." },
          { title: "Repeat Umrah for Badal", text: "One Umrah serves as atonement for the sins committed between it and the previous one, and performing it more than once is permitted. For a second Umrah, the performer enters Ihram again from the nearest Miqat — such as Aishah's mosque in Al Taneem — and repeats the sequence for the beneficiary." },
          { title: "Best time & crowd planning", text: "It is better to perform the rituals in less crowded times so Tawaf and prayers are completed with ease. Umrah is not arranged during the Hajj season for those not combining it with Hajj, so that the sacred sites remain available for Hajj pilgrims." },
        ],
      },
    ],
  },
  {
    slug: "hajj-badal",
    name: "Hajj Badal",
    symbol: "𓂀",
    color: "#b45309",
    tint: "#fdf1e2",
    eyebrow: "Hajj Guide",
    heroLine: "Fulfil the duty of Hajj on behalf of a loved one",
    desc: "A complete guide to eligibility, representation, rituals, Hady and Udhiya.",
    overview:
      "Hajj Badal is the performance of obligatory Hajj on behalf of another person. It is permitted for eligible deceased people or those permanently unable to perform Hajj. The representative must follow the beneficiary's intended type of Hajj and must not leave obligatory rites incomplete.",
    sections: [
      {
        slug: "hajj-overview",
        name: "What is Hajj Badal?",
        icon: "🕋",
        about: "The meaning, ruling and circumstances in which Hajj Badal may be arranged.",
        articles: [
          { title: "Definition", text: "Hajj Badal, also called Proxy Hajj or Hajj e Badal, means appointing another person to perform compulsory Hajj on someone else's behalf." },
          { title: "Permissibility", text: "The permissibility is established in Islamic teaching and supported across the major schools. The representative must complete their own obligatory Hajj first unless a qualified scholar confirms an exception." },
          { title: "When is it used?", text: "It may be used for a person who has passed away, has reached an age that prevents travel, or suffers from permanent illness with no hope of recovery." },
          { title: "How many times?", text: "Guidance varies by case and madhab. Umrah Badal may be performed more than once; an individual case should be confirmed with a qualified scholar." },
        ],
      },
      {
        slug: "hajj-eligibility",
        name: "Eligibility & Conditions",
        icon: "✅",
        about: "The representative, intention, authority and Hajj type.",
        articles: [
          { title: "Step 1 — Confirm eligibility", text: "The person represented must qualify because of death, permanent inability or another case recognized by a qualified scholar." },
          { title: "Step 2 — The representative", text: "The appointed person must be sane, Muslim, physically able and qualified to perform every required rite." },
          { title: "Step 3 — Make Niyyah at Ihram", text: "At the time of entering Ihram, the representative makes the Niyyah on behalf of the named person." },
          { title: "Step 4 — Confirm authority", text: "The representative must be authorized by or on behalf of the intended person. Complex authorization should be documented." },
          { title: "Step 5 — Follow the requested Hajj type", text: "Ifraad, Tamattu or Qiran should be completed according to the valid desire or ruling of the person represented." },
          { title: "Step 6 — Complete every obligation", text: "No obligatory Hajj rite may be deliberately omitted. Any violation or missed duty should receive the applicable ruling." },
        ],
      },
      {
        slug: "hajj-qurbani",
        name: "Hady, Qurbani & Udhiya",
        icon: "🐐",
        about: "The difference between required Hady, Hajj expiation and voluntary Udhiya.",
        articles: [
          { title: "Does one sacrifice cover both people?", text: "A separate sacrifice does not become necessary merely because Hajj is performed for another person. Hady or Dam may be required for Tamattu or Qiran Hajj or an applicable violation." },
          { title: "What is Hady?", text: "Hady is a required sacrificial offering connected to a specific Hajj ruling or expiation." },
          { title: "What is Udhiya?", text: "Udhiya is the voluntary Eid al-Adha sacrifice. It is not automatically the same as Hady required in Hajj." },
          { title: "Who pays for it?", text: "The cost and package inclusion should be clearly stated. Any required sacrifice should be documented and confirmed in the order." },
        ],
      },
      {
        slug: "hajj-evidence",
        name: "Quran & Sunnah",
        icon: "📖",
        about: "The scriptural and hadith basis commonly presented for Hajj Badal.",
        articles: [
          { title: "Surah Ali Imran 3:97", text: "Allah says that Hajj to the House is a duty owed to Allah by mankind, for those who can find a way to do it." },
          { title: "Sahih al-Bukhari 1754", text: "A woman asked whether she could perform Hajj on behalf of her deceased mother. The Prophet (peace be upon him) confirmed that she should, comparing it to paying a debt owed to Allah." },
          { title: "Abu Dawood 1811", text: "A man declared Hajj on behalf of Shubrumah before completing his own Hajj. The Prophet (peace be upon him) instructed him to complete Hajj for himself first, then perform Hajj for his relative." },
        ],
      },
    ],
  },
  {
    slug: "donations",
    name: "Donations",
    symbol: "♡",
    color: "#0369a1",
    tint: "#e5f2fa",
    eyebrow: "Sadaqah Guide",
    heroLine: "Give with clarity, receive proof of impact",
    desc: "A clear guide to Iftar, Zamzam, Quran, orphan and Eid donations.",
    overview:
      "IbadahConnect donations are arranged with a clear intention, package quantity and proof. Each category has a documented process so sponsors can review what was purchased or handed over.",
    sections: [
      {
        slug: "donation-types",
        name: "Donation Types",
        icon: "🎁",
        about: "Choose an appropriate Iftar, Zamzam, orphan, Eid or Quran donation.",
        articles: [
          { title: "Iftar and meals", text: "Arrange a meal or Iftar for eligible fasting people. The package should clearly state quantity and location." },
          { title: "Zamzam and water", text: "Confirm approved quantity, delivery method and recipient conditions before placing the order." },
          { title: "Orphan and family support", text: "Provide essentials or an Eid gift through a documented handover to a verified family or beneficiary." },
          { title: "Quran donation", text: "Donate Quran copies or Islamic learning essentials to a suitable recipient or institution." },
          { title: "Sadaqah Jariyah", text: "Lasting assistance such as food security, wheelchairs or education support is arranged with an outcome and handover record." },
        ],
      },
      {
        slug: "donation-process",
        name: "Booking & Handover",
        icon: "📋",
        about: "The complete process from intention to receipt and final proof.",
        articles: [
          { title: "Step 1 — Select a donation", text: "Choose the category and package that matches the donation and budget." },
          { title: "Step 2 — Share the intention", text: "Add the beneficiary name or Niyyah if the donation is being made on behalf of someone." },
          { title: "Step 3 — Make payment", text: "Complete the booking with an approved payment method and retain the confirmation." },
          { title: "Step 4 — Review handover proof", text: "View receipts, photos or handover records and keep the completion update." },
        ],
      },
    ],
  },
];

const styles = `
html{scroll-behavior:smooth}
.guide-page{min-height:100vh;padding-top:64px;background:#f4f7f4;color:#183426;font-family:'Outfit','Segoe UI',sans-serif}
.guide-hero{position:relative;height:min(590px,72vh);min-height:500px;overflow:hidden;color:#fff;background:#10291d}
.guide-video,.guide-poster{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.guide-video{animation:guideCinematic 16s ease-in-out infinite alternate}
.guide-hero-overlay{position:absolute;inset:0;background:linear-gradient(90deg,rgba(7,30,20,.94) 0%,rgba(7,30,20,.72) 44%,rgba(7,30,20,.18) 78%),linear-gradient(0deg,rgba(7,30,20,.58),transparent 55%)}
.guide-hero-grain{position:absolute;inset:0;opacity:.08;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.7'/%3E%3C/svg%3E")}
.guide-hero-inner{position:relative;z-index:2;width:min(1180px,calc(100% - 48px));height:100%;margin:auto;display:flex;align-items:center;padding-bottom:58px}
.guide-hero-copy{max-width:690px;animation:guideReveal .9s cubic-bezier(.2,.7,.2,1) both}
.guide-breadcrumb{display:flex;align-items:center;gap:9px;margin-bottom:22px;color:rgba(255,255,255,.72);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}
.guide-breadcrumb a{color:#ead58f;text-decoration:none}
.guide-kicker{display:inline-flex;align-items:center;gap:10px;color:#ead58f;font-size:11px;font-weight:900;letter-spacing:.22em;text-transform:uppercase}
.guide-kicker:before{content:"";width:34px;height:1px;background:#ead58f}
.guide-hero h1{font-family:Amiri,Georgia,serif;font-size:clamp(52px,7vw,82px);line-height:.92;margin:16px 0 18px;text-wrap:balance}
.guide-hero p{max-width:590px;margin:0;color:rgba(255,255,255,.82);font-size:17px;line-height:1.75}
.guide-hero-actions{display:flex;gap:12px;margin-top:28px}
.guide-primary,.guide-secondary{height:48px;display:inline-flex;align-items:center;justify-content:center;gap:9px;padding:0 18px;border-radius:999px;font-size:13px;font-weight:900;text-decoration:none;transition:.25s ease}
.guide-primary{background:#d0b157;color:#173825;box-shadow:0 12px 30px rgba(208,177,87,.22)}
.guide-primary:hover{background:#fff;transform:translateY(-3px)}
.guide-secondary{border:1px solid rgba(255,255,255,.34);background:rgba(255,255,255,.08);color:#fff;backdrop-filter:blur(10px)}
.guide-secondary:hover{background:rgba(255,255,255,.16);transform:translateY(-3px)}
.guide-shell{position:relative;z-index:5;width:min(1180px,calc(100% - 48px));margin:-44px auto 0;padding-bottom:96px}
.guide-picker{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:38px}
.guide-choice{position:relative;display:grid;grid-template-columns:118px 1fr 38px;align-items:center;min-height:134px;overflow:hidden;padding:8px 12px 8px 8px;border:1px solid rgba(255,255,255,.78);border-radius:18px;background:rgba(255,255,255,.96);box-shadow:0 18px 42px rgba(13,49,32,.16);text-align:left;cursor:pointer;transition:.3s cubic-bezier(.2,.7,.2,1)}
.guide-choice:hover{transform:translateY(-6px);box-shadow:0 24px 48px rgba(13,49,32,.22)}
.guide-choice.active{border-color:#d0b157;transform:translateY(-4px)}
.choice-media{position:relative;width:118px;height:118px;border-radius:13px;overflow:hidden}
.choice-media img{width:100%;height:100%;object-fit:cover;transition:.45s ease}
.guide-choice:hover .choice-media img{transform:scale(1.07)}
.choice-media:after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,transparent,rgba(9,44,28,.16))}
.choice-copy{min-width:0;padding-left:14px}
.choice-copy small{display:block;color:#9a8a58;font-size:9px;font-weight:900;letter-spacing:.16em;text-transform:uppercase;margin-bottom:6px}
.choice-copy strong{display:block;color:#173927;font-family:Amiri,Georgia,serif;font-size:23px;line-height:1.05}
.choice-copy span{display:block;margin-top:7px;color:#738079;font-size:12px;line-height:1.45}
.choice-arrow{width:38px;height:38px;border:1px solid #dde6df;border-radius:50%;display:grid;place-items:center;color:#1b5135;transition:.25s ease}
.guide-choice.active .choice-arrow{border-color:#1b5135;background:#1b5135;color:#fff;transform:rotate(45deg)}
.guide-overview{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:44px;align-items:center;margin:8px 0 54px;padding:42px;background:#fff;border:1px solid #e2e9e4;border-radius:22px;box-shadow:0 12px 36px rgba(20,66,43,.06)}
.guide-overview-copy small{color:#a18a4c;font-size:10px;font-weight:900;letter-spacing:.18em;text-transform:uppercase}
.guide-overview-copy h2{font-family:Amiri,Georgia,serif;font-size:44px;line-height:1.05;margin:9px 0 14px;color:#173927}
.guide-overview-copy p{max-width:650px;margin:0;color:#66776d;font-size:15px;line-height:1.8}
.guide-metrics{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:28px}
.guide-metric{padding:14px 10px;border-top:1px solid #e5ebe6;text-align:center}
.guide-metric strong{display:block;color:#1b5135;font-family:Amiri,Georgia,serif;font-size:24px}
.guide-metric span{color:#87938d;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}
.guide-overview-media{height:300px;position:relative;border-radius:16px;overflow:hidden}
.guide-overview-media img{width:100%;height:100%;object-fit:cover;transition:.7s ease}
.guide-overview:hover .guide-overview-media img{transform:scale(1.035)}
.guide-overview-media:after{content:"";position:absolute;inset:0;border:1px solid rgba(255,255,255,.22);border-radius:16px}
.guide-layout{display:grid;grid-template-columns:230px minmax(0,1fr);gap:30px;align-items:start}
.guide-toc{position:sticky;top:82px;border:1px solid #dde6df;border-radius:16px;background:#fff;padding:10px}
.guide-toc-title{padding:10px 12px 12px;color:#9a8a58;font-size:9px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}
.guide-toc button{width:100%;display:flex;align-items:center;gap:10px;padding:11px 10px;border:0;border-radius:10px;background:transparent;color:#6d7c74;font-size:12.5px;font-weight:750;text-align:left;cursor:pointer;transition:.22s ease}
.guide-toc button:hover,.guide-toc button.active{background:#edf4ef;color:#1b5135}
.toc-number{width:25px;height:25px;border-radius:50%;display:grid;place-items:center;background:#f4f7f4;color:#9a8a58;font-family:Amiri,Georgia,serif;font-size:13px}
.guide-content{min-width:0}
.guide-content-head{display:flex;align-items:end;justify-content:space-between;gap:20px;margin:2px 0 18px}
.guide-content-head h2{font-family:Amiri,Georgia,serif;font-size:38px;line-height:1;margin:0 0 7px;color:#173927}
.guide-content-head p{margin:0;color:#7b8981;font-size:13px}
.guide-search{width:260px;height:46px;display:flex;align-items:center;gap:9px;border:1px solid #dde6df;border-radius:12px;background:#fff;padding:0 13px}
.guide-search svg{width:17px;height:17px;color:#95a098}
.guide-search input{width:100%;border:0;outline:0;background:transparent;color:#173927;font:13px 'Outfit',sans-serif}
.guide-section{scroll-margin-top:180px;margin-bottom:16px;border:1px solid #dde6df;border-radius:16px;background:#fff;overflow:hidden;transition:.3s ease}
.guide-section:hover{border-color:#cfc9a7;box-shadow:0 12px 30px rgba(20,66,43,.06)}
.guide-section-button{width:100%;display:grid;grid-template-columns:54px 1fr 38px;align-items:center;gap:14px;padding:16px 18px;border:0;background:#fff;color:inherit;text-align:left;cursor:pointer}
.guide-section-number{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;border:1px solid #eadfb9;background:#fbf8ed;color:#a18a4c;font-family:Amiri,Georgia,serif;font-size:20px}
.guide-section-title h3{font-family:Amiri,Georgia,serif;font-size:21px;line-height:1.1;margin:0 0 5px;color:#173927}
.guide-section-title p{margin:0;color:#7b8981;font-size:12.5px;line-height:1.5}
.guide-section-toggle{width:38px;height:38px;border:1px solid #dde6df;border-radius:50%;display:grid;place-items:center;color:#1b5135;transition:.25s ease}
.guide-section.open .guide-section-toggle{transform:rotate(45deg);background:#1b5135;border-color:#1b5135;color:#fff}
.guide-section-body{max-height:0;overflow:hidden;transition:max-height .45s cubic-bezier(.2,.7,.2,1)}
.guide-section.open .guide-section-body{max-height:2400px}
.guide-articles{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 18px 18px 86px}
.guide-article{padding:16px;border-radius:12px;background:#f7f9f7;border-left:2px solid #d9c98d}
.guide-article h4{margin:0 0 7px;color:#173927;font-size:14px}
.guide-article p{margin:0;color:#6f7d75;font-size:12.5px;line-height:1.75}
.guide-empty{padding:60px;text-align:center;border:1px solid #dde6df;border-radius:16px;background:#fff;color:#7b8981}
.reveal{opacity:0;transform:translateY(24px);transition:opacity .75s ease,transform .75s cubic-bezier(.2,.7,.2,1)}
.reveal.in{opacity:1;transform:none}
@keyframes guideCinematic{from{transform:scale(1.02)}to{transform:scale(1.09)}}
@keyframes guideReveal{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
@media(max-width:980px){.guide-picker{grid-template-columns:1fr}.guide-choice{grid-template-columns:105px 1fr 38px;min-height:118px}.choice-media{width:105px;height:102px}.guide-layout{grid-template-columns:1fr}.guide-toc{position:relative;top:auto;display:flex;overflow-x:auto}.guide-toc-title{display:none}.guide-toc button{width:auto;white-space:nowrap}.guide-overview{grid-template-columns:1fr}.guide-overview-media{height:260px}}
@media(max-width:640px){.guide-page{padding-top:64px}.guide-hero{height:540px;min-height:540px}.guide-hero-inner{width:calc(100% - 32px);align-items:flex-end;padding-bottom:58px}.guide-hero h1{font-size:48px}.guide-hero p{font-size:15px}.guide-hero-actions{flex-wrap:wrap}.guide-shell{width:calc(100% - 28px);margin-top:-38px}.guide-picker{gap:8px;margin-bottom:28px}.guide-choice{grid-template-columns:78px 1fr 32px;min-height:96px;padding:7px 9px 7px 7px}.choice-media{width:78px;height:82px}.choice-copy{padding-left:10px}.choice-copy strong{font-size:19px}.choice-copy span{display:none}.choice-arrow{width:32px;height:32px}.guide-overview{padding:24px 18px;gap:24px}.guide-overview-copy h2{font-size:36px}.guide-metrics{gap:3px}.guide-metric strong{font-size:20px}.guide-overview-media{height:220px}.guide-content-head{align-items:flex-start;flex-direction:column}.guide-content-head h2{font-size:34px}.guide-search{width:100%}.guide-section-button{grid-template-columns:46px 1fr 32px;gap:10px;padding:13px}.guide-section-number{width:46px;height:46px}.guide-section-title h3{font-size:19px}.guide-section-toggle{width:32px;height:32px}.guide-articles{grid-template-columns:1fr;padding:0 13px 13px}.guide-toc button{font-size:11.5px}}
@media(prefers-reduced-motion:reduce){.guide-video,.guide-hero-copy,.reveal,.choice-media img{animation:none;transition:none}.reveal{opacity:1;transform:none}}
`;

export default function GuidePage() {
  const { categorySlug, subSlug } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [openSection, setOpenSection] = useState(subSlug || "");
  const [activeSection, setActiveSection] = useState(subSlug || "");
  const category = GUIDE_DATA.find((item) => item.slug === categorySlug) || GUIDE_DATA[0];
  const media = {
    "umrah-badal": { video: "/videos/umrah.mp4", poster: "/images/umrah1.jpg", image: "/images/umrah2.jpg" },
    "hajj-badal": { video: "/videos/hajj.mp4", poster: "/images/hajj1.jpg", image: "/images/hajj2.jpg" },
    donations: { video: "/videos/sadaqah.mp4", poster: "/images/Hajj%20Food%20Donation.jpg", image: "/images/Donate%20Iftar%20in%20Mecca.jpg" },
  }[category.slug];

  useEffect(() => {
    setQuery("");
    const initial = subSlug || category.sections[0]?.slug || "";
    setOpenSection(initial);
    setActiveSection(initial);
  }, [categorySlug, subSlug, category]);

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [categorySlug, query]);

  useEffect(() => {
    if (!subSlug) return;
    window.setTimeout(() => {
      document.getElementById(`guide-${subSlug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 180);
  }, [subSlug, categorySlug]);

  const visibleSections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return category.sections;
    return category.sections.filter((section) =>
      section.name.toLowerCase().includes(needle) ||
      section.about.toLowerCase().includes(needle) ||
      section.articles.some((article) =>
        article.title.toLowerCase().includes(needle) ||
        article.text.toLowerCase().includes(needle)
      )
    );
  }, [category, query]);

  const scrollToSection = (slug) => {
    setOpenSection(slug);
    setActiveSection(slug);
    document.getElementById(`guide-${slug}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main className="guide-page">
      <Navbar />
      <style>{styles}</style>

      <section className="guide-hero">
        <video className="guide-video" autoPlay muted loop playsInline poster={media.poster} key={media.video}>
          <source src={media.video} type="video/mp4" />
        </video>
        <div className="guide-hero-overlay" />
        <div className="guide-hero-grain" />
        <div className="guide-hero-inner">
          <div className="guide-hero-copy">
            <div className="guide-breadcrumb"><a href="/">Home</a><span>/</span><span>Guides</span></div>
            <span className="guide-kicker">{category.eyebrow}</span>
            <h1>{category.name}</h1>
            <p>{category.heroLine}<br />{category.overview}</p>
            <div className="guide-hero-actions">
              <a className="guide-primary" href="/services">Explore packages
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <button className="guide-secondary" type="button" onClick={() => scrollToSection(category.sections[0].slug)}>Read the guide</button>
            </div>
          </div>
        </div>
      </section>

      <div className="guide-shell">
        <nav className="guide-picker" aria-label="Choose a guide">
          {GUIDE_DATA.map((item) => {
            const itemImage = item.slug === "umrah-badal"
              ? "/images/umrah1.jpg"
              : item.slug === "hajj-badal"
                ? "/images/hajj1.jpg"
                : "/images/Hajj%20Food%20Donation.jpg";
            return (
              <button
                type="button"
                key={item.slug}
                className={`guide-choice ${category.slug === item.slug ? "active" : ""}`}
                onClick={() => navigate(`/guide/${item.slug}`)}
              >
                <span className="choice-media"><img src={itemImage} alt="" /></span>
                <span className="choice-copy">
                  <small>{item.eyebrow}</small>
                  <strong>{item.name}</strong>
                  <span>{item.desc}</span>
                </span>
                <span className="choice-arrow" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                </span>
              </button>
            );
          })}
        </nav>

        <section className="guide-overview reveal">
          <div className="guide-overview-copy">
            <small>Complete guide</small>
            <h2>{category.name} at a glance</h2>
            <p>{category.overview}</p>
            <div className="guide-metrics">
              <div className="guide-metric"><strong>{category.sections.length}</strong><span>Guides</span></div>
              <div className="guide-metric"><strong>100%</strong><span>Documented</span></div>
              <div className="guide-metric"><strong>24/7</strong><span>Tracking</span></div>
            </div>
          </div>
          <div className="guide-overview-media"><img src={media.image} alt={`${category.name} in Makkah`} /></div>
        </section>

        <div className="guide-layout">
          <aside className="guide-toc" aria-label="Guide sections">
            <div className="guide-toc-title">On this page</div>
            {category.sections.map((section, index) => (
              <button
                type="button"
                key={section.slug}
                className={activeSection === section.slug ? "active" : ""}
                onClick={() => scrollToSection(section.slug)}
              >
                <span className="toc-number">{String(index + 1).padStart(2, "0")}</span>
                {section.name}
              </button>
            ))}
          </aside>

          <div className="guide-content">
            <div className="guide-content-head">
              <div><h2>Detailed guide</h2><p>{visibleSections.length} topics in this guide</p></div>
              <label className="guide-search">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${category.name}`} />
              </label>
            </div>

            {visibleSections.length === 0 ? (
              <div className="guide-empty">No matching topics found. Try another search.</div>
            ) : visibleSections.map((section, sectionIndex) => (
              <section id={`guide-${section.slug}`} key={section.slug} className={`guide-section reveal ${openSection === section.slug ? "open" : ""}`}>
                <button
                  type="button"
                  className="guide-section-button"
                  onClick={() => {
                    setOpenSection(openSection === section.slug ? "" : section.slug);
                    setActiveSection(section.slug);
                  }}
                >
                  <span className="guide-section-number">{String(sectionIndex + 1).padStart(2, "0")}</span>
                  <span className="guide-section-title"><h3>{section.name}</h3><p>{section.about}</p></span>
                  <span className="guide-section-toggle" aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                  </span>
                </button>
                <div className="guide-section-body">
                  <div className="guide-articles">
                    {section.articles.map((article) => (
                      <article className="guide-article" key={article.title}>
                        <h4>{article.title}</h4>
                        <p>{article.text}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}