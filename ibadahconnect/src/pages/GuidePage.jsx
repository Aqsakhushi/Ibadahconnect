/* ==========================================================================
   IbadahConnect — Hajj & Umrah Guide (3-Level: Hub → Category → Subcategory)
   --------------------------------------------------------------------------
   ROUTE SETUP (App.jsx mein yeh 3 lines add karo):

   import GuidePage from "./pages/GuidePage";
   <Route path="/guide" element={<GuidePage />} />
   <Route path="/guide/:categorySlug" element={<GuidePage />} />
   <Route path="/guide/:categorySlug/:subSlug" element={<GuidePage />} />

   Header/Footer mein link:  <Link to="/guide">Guide</Link>
   ========================================================================== */

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

/* ============================== DATA ==================================== */

const GUIDE_DATA = [
  {
    slug: "planning-preparation",
    name: "Planning & Preparation",
    icon: "📝",
    articles: 19,
    gradient: "linear-gradient(135deg,#0e7a4f 0%,#0a5536 100%)",
    tint: "#e7f5ee",
    chip: "#0d6b44",
    desc: "A successful Hajj or Umrah begins with thoughtful planning and preparation. Discover the essential steps to take before you depart.",
    subcategories: [
      {
        slug: "travel-agents", name: "Travel Agents", icon: "🏢", articles: 2, views: "5.2K", comments: 11,
        about: "How to find, verify and book with a trustworthy Umrah & Hajj travel agent — and how to avoid scams.",
        list: [
          { t: "How to Choose a Reliable Umrah Travel Agent", e: "From checking government registration to reading verified reviews, here is a complete framework to pick an agent you can trust with your journey.", r: "6 min read" },
          { t: "Red Flags When Booking Hajj & Umrah Packages", e: "Suspiciously cheap packages, no written contract, cash-only payments — learn the warning signs before you pay any advance.", r: "5 min read" },
        ],
      },
      {
        slug: "documents", name: "Documents", icon: "📄", articles: 1, views: "5.5K", comments: 6,
        about: "Every document you need — passports, visas, certificates — organised into one simple checklist.",
        list: [
          { t: "Complete Document Checklist for Umrah 2026", e: "Passport validity, photographs, vaccination certificates, Mahram documents for women — the exact paperwork you need before applying.", r: "7 min read" },
        ],
      },
      {
        slug: "health-medication", name: "Health & Medication", icon: "💊", articles: 2, views: "6.4K", comments: 14,
        about: "Stay healthy on your journey — medicines, first-aid kits and managing health conditions in the Haramain.",
        list: [
          { t: "Carrying Prescription Medicines to Saudi Arabia", e: "Which medicines are restricted, how to get a doctor's letter, and the right way to pack your medicines for air travel.", r: "5 min read" },
          { t: "Build the Perfect Pilgrim First-Aid Kit", e: "From blister patches for your shoes to ORS for the heat — a practical kit list used by experienced pilgrims.", r: "4 min read" },
        ],
      },
      { slug: "vaccinations", name: "Vaccinations", icon: "💉", articles: 0, views: "4.5K", comments: 4, about: "Required and recommended vaccines — MenACWY, flu, COVID-19 — and the certificate rules for your visa." },
      {
        slug: "physical-fitness", name: "Physical Fitness", icon: "🏃", articles: 13, views: "6.8K", comments: 7,
        about: "Tawaf and Sa'i can mean 8–10 km of walking daily. Prepare your body weeks before you travel.",
        list: [
          { t: "8-Week Walking Plan Before Your Umrah", e: "Build stamina gradually with this simple week-by-week walking plan designed around your daily routine.", r: "6 min read" },
          { t: "Simple Home Exercises for Pilgrims Over 50", e: "Low-impact strength and balance exercises that prepare your knees and back for the physical demands of the Haramain.", r: "7 min read" },
          { t: "Staying Hydrated & Beating the Makkah Heat", e: "How much water to drink, electrolyte tips, and the best times to perform rituals in extreme temperatures.", r: "5 min read" },
        ],
      },
      { slug: "baggage", name: "Baggage", icon: "🧳", articles: 0, views: "5.5K", comments: 5, about: "Airline baggage allowances, Zamzam water rules and smart packing strategies for pilgrims." },
      { slug: "money-banking", name: "Money & Banking", icon: "💰", articles: 0, views: "4.8K", comments: 4, about: "Currency exchange, cards that work in Saudi Arabia, daily budgets and carrying money safely." },
      {
        slug: "clothing", name: "Clothing", icon: "🧥", articles: 5, views: "5.5K", comments: 4,
        about: "What to pack for every season, footwear rules and comfortable modest clothing for the journey.",
        list: [
          { t: "Ultimate Packing List: Clothes for Umrah", e: "Layering strategy for changing temperatures, how many Ihram sets to bring, and laundry tips during your trip.", r: "6 min read" },
          { t: "What Should Women Wear for Umrah & Hajj?", e: "Comfortable, modest clothing choices, footwear rules inside Haram, and abaya fabric that survives the heat.", r: "5 min read" },
        ],
      },
      {
        slug: "ihram", name: "Ihram", icon: "🤍", articles: 9, views: "7.8K", comments: 19,
        about: "The sacred state — how to wear it, its prohibitions, and the common mistakes to avoid.",
        list: [
          { t: "How to Wear Ihram for Men — Step by Step", e: "The exact wrapping technique for the izar and rida, plus a video-style breakdown you can practice at home.", r: "8 min read" },
          { t: "Ihram Rules for Women: A Simple Guide", e: "There is no special Ihram dress for women — here is what qualifies as proper Ihram clothing for sisters.", r: "5 min read" },
          { t: "9 Common Ihram Mistakes and How to Avoid Them", e: "Covering the face, using perfume, stitching violations — the prohibitions of Ihram explained with their expiations.", r: "7 min read" },
        ],
      },
      {
        slug: "mental-spiritual-preparation", name: "Mental & Spiritual Preparation", icon: "🤲", articles: 2, views: "5.5K", comments: 4,
        about: "A pilgrimage is a journey of the heart — prepare your mind and soul before your body travels.",
        list: [
          { t: "Preparing Your Heart Before You Travel", e: "Practical steps to shift from a tourist mindset to a pilgrim mindset — forgiving debts, settling disputes and making intentions.", r: "6 min read" },
          { t: "Learn the Talbiyah with Meaning", e: "The complete Talbiyah with word-by-word translation so you can recite it with understanding and presence of heart.", r: "4 min read" },
        ],
      },
    ],
  },
  {
    slug: "travel",
    name: "Travel",
    icon: "✈️",
    articles: 8,
    gradient: "linear-gradient(135deg,#0369a1 0%,#0c4a6e 100%)",
    tint: "#e5f2fa",
    chip: "#0369a1",
    desc: "Flights, visas, trains and getting around — everything about the journey to the Holy Cities of Makkah and Madinah.",
    subcategories: [
      {
        slug: "flights-airports", name: "Flights & Airports", icon: "🛫", articles: 3, views: "5.4K", comments: 8,
        about: "Airlines, routes, fares by season and navigating Jeddah & Madinah airports on arrival.",
        list: [
          { t: "Direct Flights to Jeddah & Madinah from Pakistan", e: "Airlines, average fares by season, and the smartest day of the week to book for cheaper Umrah travel.", r: "6 min read" },
          { t: "Navigating Jeddah Airport on Arrival", e: "Immigration, SIM cards, currency exchange and transport options — exactly what to do after landing.", r: "5 min read" },
          { t: "Which Airport Should You Land At?", e: "Jeddah vs Madinah airport — how your arrival city changes your itinerary and saves you travel time.", r: "4 min read" },
        ],
      },
      {
        slug: "visa-documentation", name: "Visa & Documentation", icon: "🛂", articles: 2, views: "4.9K", comments: 6,
        about: "Umrah visas, visit visas and the new Nusuk platform — which visa type fits your trip.",
        list: [
          { t: "Umrah Visa vs Saudi Visit Visa — What Changed", e: "The new Nusuk platform, e-visa options for eligible countries, and which visa type fits your trip.", r: "7 min read" },
          { t: "Step-by-Step Umrah Visa Application Guide", e: "Documents required, processing time, fees and common reasons for visa rejection.", r: "6 min read" },
        ],
      },
      {
        slug: "transportation", name: "Transportation", icon: "🚄", articles: 2, views: "5.1K", comments: 5,
        about: "The Haramain train, buses, taxis and ride apps — moving between and inside the Holy Cities.",
        list: [
          { t: "Haramain High-Speed Railway: Complete Guide", e: "Booking tickets online, luggage rules, and how the 35-minute Makkah–Madinah train changes your itinerary.", r: "6 min read" },
          { t: "Getting Around Makkah & Madinah", e: "Buses, taxis and ride apps — realistic costs and the easiest ways to move between hotel and Haram.", r: "5 min read" },
        ],
      },
      {
        slug: "luggage-packing-tips", name: "Luggage & Packing Tips", icon: "🎒", articles: 1, views: "4.6K", comments: 3,
        about: "Pack light, pack smart — the luggage strategies experienced pilgrims actually use.",
        list: [
          { t: "Smart Packing for a 10-Day Umrah Trip", e: "Carry-on essentials, Zamzam allowance rules, and the one-bag strategy experienced pilgrims swear by.", r: "6 min read" },
        ],
      },
    ],
  },
  {
    slug: "umrah",
    name: "Umrah",
    icon: "🌙",
    articles: 26,
    gradient: "linear-gradient(135deg,#6d28d9 0%,#4c1d95 100%)",
    tint: "#f1eafd",
    chip: "#6d28d9",
    desc: "Complete Umrah guidance — step-by-step rituals, authentic duas, beginners' guides and the mistakes to avoid.",
    subcategories: [
      {
        slug: "umrah-rituals", name: "Umrah Rituals", icon: "🕋", articles: 8, views: "9.2K", comments: 21,
        about: "Ihram, Tawaf, Sa'i and Halq — every ritual of Umrah explained in correct order.",
        list: [
          { t: "Umrah Step by Step: The Complete Guide", e: "From Ihram at the Miqat to Halq — every stage of Umrah in order, with duas for each step.", r: "12 min read" },
          { t: "How to Perform Tawaf Correctly", e: "Starting point, direction, Raml, and what to do if you lose count during your circuits.", r: "8 min read" },
          { t: "Sa'i Between Safa and Marwah Explained", e: "The history, the green light markers, and the correct dua for each round.", r: "7 min read" },
        ],
      },
      {
        slug: "umrah-duas-prayers", name: "Umrah Duas & Prayers", icon: "🤲", articles: 6, views: "8.1K", comments: 17,
        about: "Authentic duas for the Miqat, Tawaf, Multazam, Maqam Ibrahim and every moment in between.",
        list: [
          { t: "Duas for Every Step of Umrah", e: "Authentic duas at the Miqat, during Tawaf, between the corners, at Multazam and after Sa'i.", r: "9 min read" },
          { t: "Duas at Multazam & Maqam Ibrahim", e: "The spots most beloved for supplication inside the Haram and the etiquette of praying there.", r: "5 min read" },
        ],
      },
      {
        slug: "umrah-for-beginners", name: "Umrah for Beginners", icon: "🌱", articles: 5, views: "7.6K", comments: 12,
        about: "First time going for Umrah? Start here — costs, timing and exactly what to expect.",
        list: [
          { t: "First Time Umrah: Complete Beginner Guide", e: "Everything first-timers need — costs, timing, what to expect inside the Haram and how to stay calm.", r: "10 min read" },
          { t: "Umrah Checklist for First-Timers", e: "Printable checklist covering documents, apps, medicines, money and spiritual prep.", r: "5 min read" },
        ],
      },
      {
        slug: "common-mistakes-umrah", name: "Common Mistakes in Umrah", icon: "⚠️", articles: 4, views: "6.9K", comments: 9,
        about: "Errors that can affect your Umrah — and the correct way the scholars explain.",
        list: [
          { t: "10 Mistakes Pilgrims Make During Umrah", e: "From rushing Tawaf to skipping Niyyah — avoid these errors that can affect your Umrah.", r: "8 min read" },
        ],
      },
      {
        slug: "umrah-with-family", name: "Umrah with Family", icon: "👨‍👩‍👧", articles: 3, views: "5.8K", comments: 7,
        about: "Performing Umrah with children and elderly parents — pacing, logistics and practical tips.",
        list: [
          { t: "Performing Umrah with Children: Practical Tips", e: "Stroller rules, lost-child plans, and the best prayer times for families with kids.", r: "6 min read" },
          { t: "Umrah Guide for Elderly Parents", e: "Wheelchair services, accessible Tawaf floors and pacing rituals for older pilgrims.", r: "7 min read" },
        ],
      },
    ],
  },
  {
    slug: "hajj",
    name: "Hajj",
    icon: "🐪",
    articles: 46,
    gradient: "linear-gradient(135deg,#b45309 0%,#78350f 100%)",
    tint: "#fdf1e2",
    chip: "#b45309",
    desc: "The journey of a lifetime — day-by-day Hajj rituals, the Day of Arafah, Jamarat and step-by-step guides.",
    subcategories: [
      {
        slug: "hajj-rituals", name: "Hajj Rituals", icon: "🕋", articles: 12, views: "11.2K", comments: 28,
        about: "Ihram, Tashreeq, Jamarat and farewell Tawaf — the complete ritual sequence of Hajj.",
        list: [
          { t: "Hajj Rituals Day by Day Explained", e: "From 8th Dhul Hijjah to the farewell Tawaf — the complete Hajj sequence with the logic behind each ritual.", r: "15 min read" },
          { t: "Stoning the Jamarat: Complete Guide", e: "Timings, the pebble counting rules, and how to stay safe in the crowds at the Jamaraat bridge.", r: "8 min read" },
        ],
      },
      {
        slug: "hajj-step-by-step", name: "Hajj Step-by-Step", icon: "🗓️", articles: 9, views: "10.1K", comments: 24,
        about: "A dated, day-by-day timeline of Hajj so you always know exactly what comes next.",
        list: [
          { t: "Hajj 2026: Step-by-Step Timeline", e: "A dated timeline of every Hajj day with checklists so you always know what comes next.", r: "12 min read" },
          { t: "8th Dhul Hijjah: The Day of Tarwiyah", e: "What pilgrims do on the first official day of Hajj and the sunnahs of this day.", r: "6 min read" },
        ],
      },
      {
        slug: "tawaf-and-sai", name: "Tawaf & Sa'i", icon: "🔄", articles: 7, views: "8.7K", comments: 18,
        about: "The rulings of Tawaf and Sa'i in Hajj — and how they differ from Umrah.",
        list: [
          { t: "Tawaf al-Ifadah Explained", e: "The obligatory Tawaf of Hajj, its timing window and the rulings people most often confuse.", r: "7 min read" },
          { t: "Sa'i in Hajj vs Umrah — Key Differences", e: "Intention, clothing and timing differences between the two Sa'i explained simply.", r: "5 min read" },
        ],
      },
      {
        slug: "hajj-for-beginners", name: "Hajj for Beginners", icon: "🌱", articles: 7, views: "7.9K", comments: 11,
        about: "An honest preview of your first Hajj — crowds, heat, emotions and how to prepare.",
        list: [
          { t: "First Hajj: What to Expect — A Reality Check", e: "Crowds, heat, sleep and emotions — an honest preview so you arrive mentally ready.", r: "9 min read" },
        ],
      },
      {
        slug: "day-of-arafah", name: "Day of Arafah", icon: "⛰️", articles: 6, views: "9.4K", comments: 15,
        about: "The greatest day of Hajj — standing at Arafah, its duas and its virtues.",
        list: [
          { t: "The Day of Arafah: What Pilgrims Do", e: "The greatest day of Hajj — standing at Arafah, the khutbah, and combined prayers explained.", r: "8 min read" },
          { t: "Best Duas to Recite on the Day of Arafah", e: "The recommended adhkar and the famous dua the Prophet ﷺ recited on this day.", r: "6 min read" },
        ],
      },
      {
        slug: "common-mistakes-hajj", name: "Common Mistakes in Hajj", icon: "⚠️", articles: 5, views: "6.8K", comments: 10,
        about: "Violations, missed rituals and the fidyah (expiation) rules that apply to each.",
        list: [
          { t: "Common Hajj Mistakes and Their Expiation", e: "Violations of Ihram, missed rituals and the fidyah rules that apply to each one.", r: "9 min read" },
        ],
      },
    ],
  },
  {
    slug: "makkah",
    name: "Makkah",
    icon: "🕋",
    articles: 82,
    gradient: "linear-gradient(135deg,#374151 0%,#111827 100%)",
    tint: "#f3f4f6",
    chip: "#374151",
    desc: "Masjid al-Haram, Tawaf, Zamzam and the sacred sites around the Holy City of Makkah.",
    subcategories: [
      {
        slug: "historical-places-makkah", name: "Historical Places in Makkah", icon: "🏛️", articles: 18, views: "10.6K", comments: 26,
        about: "Cave Hira, Cave Thawr, Mina, Arafah and the blessed mountains that witnessed revelation.",
        list: [
          { t: "Jabal al-Noor & Cave Hira: Visitor Guide", e: "The story of the first revelation and what to expect if you climb the mountain of light.", r: "8 min read" },
          { t: "Mina, Arafah & Muzdalifah: Ziyarat Guide", e: "Visit the sacred sites outside Hajj season — what you can see and how to get there.", r: "7 min read" },
          { t: "Cave Thawr: The Story of the Hijrah", e: "Where the Prophet ﷺ hid during migration — history and hiking tips.", r: "6 min read" },
        ],
      },
      {
        slug: "masjid-al-haram", name: "Masjid al-Haram", icon: "🕌", articles: 15, views: "12.4K", comments: 32,
        about: "Gates, floors, women's areas and the complete layout of the largest mosque in the world.",
        list: [
          { t: "Complete Guide to Masjid al-Haram", e: "Gates, floors, shuttle routes and the layout of the largest mosque in the world.", r: "12 min read" },
          { t: "Women's Prayer Areas in Masjid al-Haram", e: "Best spots, timings and practical tips for sisters visiting the Haram.", r: "6 min read" },
        ],
      },
      {
        slug: "hotels-stay-makkah", name: "Hotels & Stay in Makkah", icon: "🏨", articles: 11, views: "6.4K", comments: 12,
        about: "Where to stay near the Haram — areas, price ranges and hotel reviews by pilgrims.",
        list: [
          { t: "Best Areas to Stay Near the Haram", e: "Ajyad, Misfalah, Aziziyah — comparing walking distance, price and comfort.", r: "7 min read" },
        ],
      },
      {
        slug: "tawaf-guide", name: "Tawaf Guide", icon: "🔄", articles: 9, views: "9.8K", comments: 22,
        about: "Master Tawaf — gates, upper floors, peak timings and etiquette inside the Mataf.",
        list: [
          { t: "Which Gate of Haram Is Best for Tawaf?", e: "Strategic gates and entry tips to start your Tawaf without the worst crowds.", r: "5 min read" },
          { t: "Tawaf on Upper Floors & Roof: Pros and Cons", e: "When the Mataf is too crowded, the upper floors offer a peaceful alternative.", r: "6 min read" },
        ],
      },
      {
        slug: "food-shopping-makkah", name: "Food & Shopping in Makkah", icon: "🍽️", articles: 8, views: "5.9K", comments: 9,
        about: "Budget eats near the Haram, date markets, perfumes and the best shopping streets.",
        list: [
          { t: "Best Budget Food Near Masjid al-Haram", e: "From Pakistani restaurants to Saudi classics — filling meals under 15 SAR.", r: "6 min read" },
        ],
      },
      {
        slug: "zamzam-water", name: "Zamzam Water", icon: "💧", articles: 6, views: "7.2K", comments: 14,
        about: "The history, virtues and practical rules of the blessed water of Zamzam.",
        list: [
          { t: "The History & Virtues of Zamzam Water", e: "The story of Hajar and Ismail, and why this water is unlike any other.", r: "6 min read" },
          { t: "How to Take Zamzam Home Legally", e: "Airport rules, 5-litre sealed bottles and the right way to pack Zamzam.", r: "4 min read" },
        ],
      },
      {
        slug: "makkah-ziyarat-tours", name: "Makkah Ziyarat & Tours", icon: "🚌", articles: 10, views: "7.1K", comments: 13,
        about: "One-day Ziyarat routes, private transport costs and DIY touring tips in Makkah.",
        list: [
          { t: "Makkah Ziyarat List: Complete Route", e: "All the major sites in one day's route with approximate costs of private transport.", r: "8 min read" },
        ],
      },
      {
        slug: "jeddah-airport-to-makkah", name: "Jeddah Airport to Makkah", icon: "🚕", articles: 5, views: "5.1K", comments: 8,
        about: "Train, taxi or bus — every transport option from Jeddah airport to the Haram.",
        list: [
          { t: "Jeddah Airport to Makkah: All Transport Options", e: "Train, taxi, bus — speeds, costs and which option suits families best.", r: "6 min read" },
        ],
      },
    ],
  },
  {
    slug: "madinah",
    name: "Madinah",
    icon: "🕌",
    articles: 83,
    gradient: "linear-gradient(135deg,#15803d 0%,#14532d 100%)",
    tint: "#e8f6ee",
    chip: "#15803d",
    desc: "Masjid an-Nabawi, Riyadul Jannah, historical sites and the peaceful city of the Prophet ﷺ.",
    subcategories: [
      {
        slug: "historical-places-madinah", name: "Historical Places in Madinah", icon: "🏛️", articles: 20, views: "11.1K", comments: 28,
        about: "Quba, Uhud, Jannat al-Baqi and the blessed landmarks of the Prophet's city.",
        list: [
          { t: "Quba Mosque: Virtues & Visit Guide", e: "The first mosque in Islam and the sunnah of entering Madinah through it.", r: "6 min read" },
          { t: "Uhud Mountain: The Story & Ziyarat", e: "The battle, the martyrs and how to visit Uhud respectfully.", r: "7 min read" },
          { t: "Jannat al-Baqi: History & Visiting Rules", e: "The graveyard that holds the family of the Prophet ﷺ — timings and etiquette.", r: "6 min read" },
        ],
      },
      {
        slug: "masjid-an-nabawi", name: "Masjid an-Nabawi", icon: "🕌", articles: 16, views: "12.8K", comments: 35,
        about: "Gates, the Green Dome, courtyards and prayer inside the Prophet's Mosque ﷺ.",
        list: [
          { t: "Complete Guide to Masjid an-Nabawi", e: "Gates, the Green Dome, expanding courtyards and prayer inside the Prophet's Mosque.", r: "12 min read" },
          { t: "Best Times to Visit Masjid an-Nabawi", e: "Between peak seasons, after Fajr, or late night — finding calm in the Prophet's city.", r: "5 min read" },
        ],
      },
      {
        slug: "riyadul-jannah", name: "Riyadul Jannah", icon: "🌿", articles: 8, views: "9.6K", comments: 21,
        about: "The garden between the Prophet's ﷺ house and minbar — its virtues and how to enter it.",
        list: [
          { t: "Riyadul Jannah: Garden of Paradise Guide", e: "The area between the Prophet's ﷺ house and minbar — its virtues and how to identify it.", r: "7 min read" },
        ],
      },
      {
        slug: "rawdah-booking-guide", name: "Rawdah Booking Guide", icon: "🎫", articles: 7, views: "8.9K", comments: 19,
        about: "Step-by-step Nusuk permits for Rawdah and Riyadul Jannah — timings, QR codes and tips.",
        list: [
          { t: "Step-by-Step Rawdah Permit via Nusuk App", e: "Book your free slot, QR code rules and what happens if you miss your window.", r: "8 min read" },
          { t: "Rawdah Visit for Women: Updated Timings", e: "The dedicated hours for sisters and how the permit system works for them.", r: "5 min read" },
        ],
      },
      {
        slug: "hotels-stay-madinah", name: "Hotels & Stay in Madinah", icon: "🏨", articles: 12, views: "6.8K", comments: 13,
        about: "Hotels near Masjid an-Nabawi — walking distances, prices and pilgrim reviews.",
        list: [
          { t: "Hotels Walking Distance to Masjid an-Nabawi", e: "The central area hotels worth every rupee for easy prayer access.", r: "6 min read" },
        ],
      },
      {
        slug: "food-shopping-madinah", name: "Food & Shopping in Madinah", icon: "🍽️", articles: 9, views: "6.1K", comments: 10,
        about: "Dates markets, souvenirs and the best food streets around the Prophet's Mosque.",
        list: [
          { t: "Dates Market Guide: Ajwa & Beyond", e: "Where to buy authentic Ajwa, fair prices per kilo, and other Madinah specialties.", r: "6 min read" },
        ],
      },
      {
        slug: "ziyarat-tours", name: "Ziyarat Tours", icon: "🚌", articles: 11, views: "7.4K", comments: 15,
        about: "Complete Ziyarat routes of Madinah — guided tours vs exploring on your own.",
        list: [
          { t: "Complete Madinah Ziyarat List", e: "Every major site with history, transport tips and a one-day DIY route.", r: "9 min read" },
          { t: "DIY Ziyarat vs Guided Tour: Which Is Better?", e: "Costs, flexibility and what a guide actually adds to your Madinah trip.", r: "5 min read" },
        ],
      },
    ],
  },
];

const TOTAL_ARTICLES = GUIDE_DATA.reduce((s, c) => s + c.articles, 0);

/* ============================== STYLES ================================== */

const GuideStyles = () => (
  <style>{`
    .gc-wrap{min-height:100vh;background:#f4f8f6;padding-bottom:90px}
    .gc-hero{position:relative;overflow:hidden;background:linear-gradient(135deg,#0a4d32 0%,#0d6b44 55%,#12855a 100%);color:#fff;padding:62px 24px 88px;text-align:center}
    .gc-hero::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 25%,rgba(255,255,255,.09) 0,transparent 42%),radial-gradient(circle at 85% 75%,rgba(255,255,255,.07) 0,transparent 42%)}
    .gc-hero.small{padding:44px 24px 78px}
    .gc-hero-emoji{font-size:52px;line-height:1;margin-bottom:14px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25))}
    .gc-eyebrow{display:inline-block;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.28);color:#ffe9a8;padding:6px 16px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;margin-bottom:16px}
    .gc-title{font-size:40px;font-weight:800;margin:0 0 12px;letter-spacing:-.5px}
    .gc-subtitle{max-width:660px;margin:0 auto;font-size:15.5px;line-height:1.75;color:rgba(255,255,255,.88)}
    .gc-hero-stats{display:flex;gap:10px;justify-content:center;margin-top:26px;flex-wrap:wrap}
    .gc-stat-chip{background:rgba(255,255,255,.12);border:1px solid rgba(255,255,255,.24);padding:8px 18px;border-radius:999px;font-size:13px;font-weight:700}
    .gc-body{max-width:1120px;margin:-50px auto 0;padding:0 20px;position:relative;z-index:2}
    .gc-search{display:flex;align-items:center;gap:10px;background:#fff;border:1px solid #dbe7e1;border-radius:16px;padding:14px 18px;box-shadow:0 14px 34px rgba(10,77,50,.12);margin-bottom:34px}
    .gc-search-icon{font-size:16px;opacity:.7}
    .gc-search input{flex:1;border:0;outline:0;font-size:15px;background:transparent;color:#14342a}
    .gc-search input::placeholder{color:#9db3a8}
    .gc-sec-head{margin:0 0 18px}
    .gc-sec-title{font-size:22px;font-weight:800;color:#123528;margin:0 0 6px}
    .gc-sec-sub{font-size:14px;color:#5b7268;margin:0}
    .gc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:22px}
    .gc-cat-card{background:#fff;border:1px solid #e3ede8;border-radius:20px;overflow:hidden;cursor:pointer;transition:all .25s ease;box-shadow:0 4px 14px rgba(10,77,50,.06);display:flex;flex-direction:column}
    .gc-cat-card:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(10,77,50,.16)}
    .gc-cat-top{height:96px;display:flex;align-items:center;justify-content:space-between;padding:0 22px;color:#fff;flex-shrink:0}
    .gc-cat-ico{width:56px;height:56px;border-radius:16px;background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.32);display:flex;align-items:center;justify-content:center;font-size:28px}
    .gc-cat-count{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.32);padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;white-space:nowrap}
    .gc-cat-body{padding:18px 22px 20px;display:flex;flex-direction:column;flex:1}
    .gc-cat-name{font-size:18px;font-weight:800;color:#123528;margin:0 0 8px}
    .gc-cat-desc{font-size:13.5px;line-height:1.65;color:#5b7268;margin:0 0 16px;flex:1}
    .gc-cat-foot{display:flex;align-items:center;justify-content:space-between}
    .gc-cat-view{font-size:13px;font-weight:750;color:#0d6b44}
    .gc-arrow{width:34px;height:34px;border-radius:50%;background:#e7f5ee;color:#0d6b44;display:flex;align-items:center;justify-content:center;font-weight:800;transition:all .25s ease}
    .gc-cat-card:hover .gc-arrow{background:#0d6b44;color:#fff;transform:translateX(4px)}
    .gc-sub-card{background:#fff;border:1px solid #e3ede8;border-radius:18px;padding:20px;cursor:pointer;transition:all .22s ease;display:flex;flex-direction:column;gap:14px;box-shadow:0 3px 10px rgba(10,77,50,.05)}
    .gc-sub-card:hover{transform:translateY(-4px);border-color:#bcd9cb;box-shadow:0 14px 30px rgba(10,77,50,.13)}
    .gc-sub-head{display:flex;align-items:center;gap:13px}
    .gc-sub-ico{width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:23px;flex-shrink:0}
    .gc-sub-name{font-size:15.5px;font-weight:750;color:#123528;margin:0;line-height:1.35}
    .gc-sub-about{font-size:13px;line-height:1.6;color:#6b8177;margin:0;flex:1}
    .gc-sub-meta{display:flex;gap:8px;flex-wrap:wrap}
    .gc-pill{font-size:11.5px;font-weight:750;padding:5px 11px;border-radius:999px;background:#f0f6f3;color:#41594f;border:1px solid #e0ebe5;white-space:nowrap}
    .gc-pill.green{background:#e7f5ee;border-color:#cfe8db;color:#0d6b44}
    .gc-pill.gold{background:#fdf6e3;border-color:#f0e3bb;color:#8a6d1a}
    .gc-pill.red{background:#fdeeee;border-color:#f3d4d4;color:#a34444}
    .gc-crumbs{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:13px;margin-bottom:24px;color:#6b8177}
    .gc-crumb{cursor:pointer;color:#0d6b44;font-weight:700;background:none;border:0;padding:0;font-size:13px}
    .gc-crumb:hover{text-decoration:underline}
    .gc-crumb.current{color:#8fa39a;font-weight:500;cursor:default}
    .gc-sep{color:#c3d4cc}
    .gc-stats-row{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:34px}
    .gc-stat-box{background:#fff;border:1px solid #e3ede8;border-radius:16px;padding:18px 20px;text-align:center;box-shadow:0 3px 10px rgba(10,77,50,.05)}
    .gc-stat-num{font-size:26px;font-weight:800;color:#0d6b44;margin:0 0 4px}
    .gc-stat-label{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#8fa39a;margin:0}
    .gc-art-list{display:flex;flex-direction:column;gap:12px}
    .gc-art-card{background:#fff;border:1px solid #e3ede8;border-radius:16px;padding:18px 20px;cursor:pointer;transition:all .2s ease;box-shadow:0 2px 8px rgba(10,77,50,.05)}
    .gc-art-card:hover{border-color:#bcd9cb}
    .gc-art-top{display:flex;align-items:flex-start;gap:14px;justify-content:space-between}
    .gc-art-title{font-size:15.5px;font-weight:750;color:#123528;margin:0 0 6px;line-height:1.45}
    .gc-art-meta{display:flex;gap:14px;font-size:12px;color:#7a8f85;flex-wrap:wrap}
    .gc-art-chevron{color:#9db3a8;font-size:15px;transition:transform .25s ease;flex-shrink:0;margin-top:3px}
    .gc-art-card.open .gc-art-chevron{transform:rotate(180deg)}
    .gc-art-excerpt{max-height:0;overflow:hidden;transition:all .3s ease;font-size:13.5px;line-height:1.75;color:#5b7268}
    .gc-art-card.open .gc-art-excerpt{max-height:260px;margin-top:12px;padding-top:12px;border-top:1px dashed #e0ebe5}
    .gc-more-row{margin-top:16px;text-align:center;font-size:13px;font-weight:700;color:#0d6b44;background:#e7f5ee;border:1px dashed #bcd9cb;border-radius:12px;padding:13px}
    .gc-empty{background:#fff;border:1px dashed #d4e2da;border-radius:18px;padding:56px 24px;text-align:center}
    .gc-empty-emoji{font-size:44px;margin-bottom:12px}
    .gc-empty-title{font-size:17px;font-weight:800;color:#123528;margin:0 0 8px}
    .gc-empty-sub{font-size:13.5px;color:#7a8f85;margin:0 0 20px}
    .gc-back-btn{display:inline-block;background:#0d6b44;color:#fff;border:0;border-radius:12px;padding:11px 22px;font-size:13.5px;font-weight:750;cursor:pointer}
    .gc-back-btn:hover{background:#0a5536}
    .gc-back-btn.ghost{background:#fff;color:#0d6b44;border:1.5px solid #bcd9cb}
    .gc-notfound{max-width:520px;margin:60px auto;background:#fff;border:1px solid #e3ede8;border-radius:22px;padding:52px 32px;text-align:center;box-shadow:0 8px 26px rgba(10,77,50,.08)}
    .gc-btn-row{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .gc-note{margin-top:26px;background:#fffdf4;border:1px solid #f0e3bb;border-radius:14px;padding:14px 18px;font-size:12.5px;line-height:1.65;color:#8a6d1a}
    @media(max-width:640px){
      .gc-title{font-size:29px}
      .gc-hero{padding:46px 18px 80px}
      .gc-grid{grid-template-columns:1fr}
      .gc-stats-row{grid-template-columns:1fr;gap:10px}
      .gc-body{padding:0 14px}
    }
  `}</style>
);

/* ============================== HELPERS ================================= */

const fmt = (n) => (n === 1 ? "1 Article" : n + " Articles");

function Crumbs({ items }) {
  const nav = useNavigate();
  return (
    <div className="gc-crumbs">
      {items.map((it, i) =>
        it.to ? (
          <React.Fragment key={i}>
            <button className="gc-crumb" onClick={() => nav(it.to)}>{it.label}</button>
            <span className="gc-sep">›</span>
          </React.Fragment>
        ) : (
          <span className="gc-crumb current" key={i}>{it.label}</span>
        )
      )}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="gc-search">
      <span className="gc-search-icon">🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      {value && <button className="gc-crumb" onClick={() => onChange("")}>✕</button>}
    </div>
  );
}

/* ============================== PAGES =================================== */

function GuideHub() {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const query = q.toLowerCase().trim();
  const cats = GUIDE_DATA.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      c.subcategories.some((s) => s.name.toLowerCase().includes(query))
  );
  return (
    <>
      <div className="gc-hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="gc-hero-emoji">🕋</div>
          <span className="gc-eyebrow">IbadahConnect Knowledge Base</span>
          <h1 className="gc-title">Hajj &amp; Umrah Guide</h1>
          <p className="gc-subtitle">
            Your complete guide to performing Hajj and Umrah — learn the key rituals, requirements,
            and preparations for the journey of a lifetime.
          </p>
          <div className="gc-hero-stats">
            <span className="gc-stat-chip">📖 {TOTAL_ARTICLES} Articles</span>
            <span className="gc-stat-chip">🗂️ {GUIDE_DATA.length} Categories</span>
            <span className="gc-stat-chip">💚 Free Forever</span>
          </div>
        </div>
      </div>
      <div className="gc-body">
        <SearchBar value={q} onChange={setQ} placeholder="Search categories & topics… e.g. Ihram, Visa, Tawaf" />
        <div className="gc-sec-head">
          <h2 className="gc-sec-title">Browse by Category</h2>
          <p className="gc-sec-sub">Choose a category to explore its complete list of topics and articles.</p>
        </div>
        {cats.length === 0 ? (
          <div className="gc-empty">
            <div className="gc-empty-emoji">🔍</div>
            <h3 className="gc-empty-title">No categories found</h3>
            <p className="gc-empty-sub">Try a different keyword — like "Ihram", "Visa" or "Tawaf".</p>
            <button className="gc-back-btn" onClick={() => setQ("")}>Clear Search</button>
          </div>
        ) : (
          <div className="gc-grid">
            {cats.map((cat) => (
              <div className="gc-cat-card" key={cat.slug} onClick={() => nav("/guide/" + cat.slug)}>
                <div className="gc-cat-top" style={{ background: cat.gradient }}>
                  <div className="gc-cat-ico">{cat.icon}</div>
                  <span className="gc-cat-count">{fmt(cat.articles)}</span>
                </div>
                <div className="gc-cat-body">
                  <h3 className="gc-cat-name">{cat.name}</h3>
                  <p className="gc-cat-desc">{cat.desc}</p>
                  <div className="gc-cat-foot">
                    <span className="gc-cat-view">Explore Guide</span>
                    <span className="gc-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CategoryPage({ cat }) {
  const [q, setQ] = useState("");
  const nav = useNavigate();
  const query = q.toLowerCase().trim();
  const subs = cat.subcategories.filter((s) => !query || s.name.toLowerCase().includes(query));
  return (
    <>
      <div className="gc-hero small">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="gc-hero-emoji">{cat.icon}</div>
          <span className="gc-eyebrow">Hajj &amp; Umrah Guide</span>
          <h1 className="gc-title" style={{ fontSize: 34 }}>{cat.name}</h1>
          <p className="gc-subtitle">{cat.desc}</p>
          <div className="gc-hero-stats">
            <span className="gc-stat-chip">📖 {fmt(cat.articles)}</span>
            <span className="gc-stat-chip">🗂️ {cat.subcategories.length} Topics</span>
          </div>
        </div>
      </div>
      <div className="gc-body">
        <Crumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Guide", to: "/guide" },
            { label: cat.name },
          ]}
        />
        <SearchBar value={q} onChange={setQ} placeholder={"Search topics in " + cat.name + "…"} />
        <div className="gc-sec-head">
          <h2 className="gc-sec-title">Topics in {cat.name}</h2>
          <p className="gc-sec-sub">Select a topic to read its articles.</p>
        </div>
        {subs.length === 0 ? (
          <div className="gc-empty">
            <div className="gc-empty-emoji">🔍</div>
            <h3 className="gc-empty-title">No topics found</h3>
            <p className="gc-empty-sub">Try a different keyword.</p>
            <button className="gc-back-btn" onClick={() => setQ("")}>Clear Search</button>
          </div>
        ) : (
          <div className="gc-grid" style={{ gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))" }}>
            {subs.map((sub) => (
              <div
                className="gc-sub-card"
                key={sub.slug}
                onClick={() => nav("/guide/" + cat.slug + "/" + sub.slug)}
              >
                <div className="gc-sub-head">
                  <div className="gc-sub-ico" style={{ background: cat.tint }}>{sub.icon}</div>
                  <h3 className="gc-sub-name">{sub.name}</h3>
                </div>
                <p className="gc-sub-about">{sub.about}</p>
                <div className="gc-sub-meta">
                  <span className={"gc-pill " + (sub.articles > 0 ? "green" : "red")}>
                    {sub.articles === 0 ? "Coming Soon" : fmt(sub.articles)}
                  </span>
                  <span className="gc-pill">👁️ {sub.views} views</span>
                  <span className="gc-pill gold">💬 {sub.comments} comments</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function SubCategoryPage({ cat, sub }) {
  const [openId, setOpenId] = useState(-1);
  return (
    <>
      <div className="gc-hero small">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="gc-hero-emoji">{sub.icon}</div>
          <span className="gc-eyebrow">{cat.name}</span>
          <h1 className="gc-title" style={{ fontSize: 32 }}>{sub.name}</h1>
          <p className="gc-subtitle">{sub.about}</p>
          <div className="gc-hero-stats">
            <span className="gc-stat-chip">📖 {fmt(sub.articles)}</span>
            <span className="gc-stat-chip">👁️ {sub.views} views</span>
            <span className="gc-stat-chip">💬 {sub.comments} comments</span>
          </div>
        </div>
      </div>
      <div className="gc-body">
        <Crumbs
          items={[
            { label: "Home", to: "/" },
            { label: "Guide", to: "/guide" },
            { label: cat.name, to: "/guide/" + cat.slug },
            { label: sub.name },
          ]}
        />
        <div className="gc-sec-head">
          <h2 className="gc-sec-title">Articles</h2>
          <p className="gc-sec-sub">Click any article to preview it. Full reader view is coming soon.</p>
        </div>
        {sub.articles === 0 || !sub.list || sub.list.length === 0 ? (
          <div className="gc-empty">
            <div className="gc-empty-emoji">🕌</div>
            <h3 className="gc-empty-title">Articles coming soon, InshaAllah</h3>
            <p className="gc-empty-sub">
              Our team is preparing authentic, well-researched articles for this topic. Meanwhile,
              explore other topics in {cat.name}.
            </p>
            <div className="gc-btn-row">
              <button className="gc-back-btn" onClick={() => window.history.back()}>← Go Back</button>
              <button className="gc-back-btn ghost" onClick={() => window.location.assign("/guide/" + cat.slug)}>
                View {cat.name}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="gc-art-list">
              {sub.list.map((a, i) => (
                <div
                  className={"gc-art-card" + (openId === i ? " open" : "")}
                  key={i}
                  onClick={() => setOpenId(openId === i ? -1 : i)}
                >
                  <div className="gc-art-top">
                    <div>
                      <h3 className="gc-art-title">{a.t}</h3>
                      <div className="gc-art-meta">
                        <span>📖 {sub.name}</span>
                        <span>👁️ {sub.views} views</span>
                        <span>💬 {sub.comments} comments</span>
                        <span>⏱️ {a.r}</span>
                      </div>
                    </div>
                    <span className="gc-art-chevron">▼</span>
                  </div>
                  <div className="gc-art-excerpt">{a.e}</div>
                </div>
              ))}
            </div>
            {sub.articles > sub.list.length && (
              <div className="gc-more-row">
                + {sub.articles - sub.list.length} more articles coming soon, InshaAllah
              </div>
            )}
            <div className="gc-note">
              💡 IbadahConnect Guide articles are reviewed for authenticity. For fiqh-related
              questions specific to your situation, please consult a qualified scholar.
            </div>
          </>
        )}
      </div>
    </>
  );
}

function NotFound({ msg }) {
  const nav = useNavigate();
  return (
    <div className="gc-notfound">
      <div className="gc-empty-emoji">🧭</div>
      <h2 className="gc-empty-title">{msg || "Page not found"}</h2>
      <p className="gc-empty-sub">The guide page you are looking for does not exist.</p>
      <div className="gc-btn-row">
        <button className="gc-back-btn" onClick={() => nav("/guide")}>← Back to Guide</button>
        <button className="gc-back-btn ghost" onClick={() => nav("/")}>Go Home</button>
      </div>
    </div>
  );
}

/* ============================ SMART ROUTER ============================== */

export default function GuidePage() {
  const { categorySlug, subSlug } = useParams();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "auto" : "auto" });
  }, [categorySlug, subSlug]);

  let content = null;
  if (!categorySlug) {
    content = <GuideHub />;
  } else {
    const cat = GUIDE_DATA.find((c) => c.slug === categorySlug);
    if (!cat) {
      content = <NotFound msg="Category not found" />;
    } else if (!subSlug) {
      content = <CategoryPage cat={cat} />;
    } else {
      const sub = cat.subcategories.find((s) => s.slug === subSlug);
      content = sub ? <SubCategoryPage cat={cat} sub={sub} /> : <NotFound msg="Topic not found" />;
    }
  }

  return (
    <div className="gc-wrap">
      <GuideStyles />
      {content}
    </div>
  );
}