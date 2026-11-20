/* =====================================================================
   LUDO <GO> — YOUR CONTENT
   ---------------------------------------------------------------------
   This is the only file you need to edit to change what the site says.
   Replace anything in [brackets] with your real information, keep the
   "quotation marks", save, then refresh the browser (F5).

   The 8 sections appear in a circle on the map, in the order below,
   starting at the top and going clockwise.
   ===================================================================== */

window.PORTFOLIO = {

  /* ---------- You ---------- */
  name: "Ludovic Lachance",       // shown in the top bar, start screen and About Me
  shortName: "Ludovic",          // the name tag above the banker on the map
  photo: "files/profile.jpg",     // your profile photo (leave "" to show the cartoon banker instead)
  resumePdf: "files/resume.pdf",  // your CV, opened by the RESUME (PDF) button in About Me
  title: "",                     // optional line under your name in About Me (leave "" for none)
  about: "Hi, I’m Ludovic, a second-year Finance and Accounting Co-op student at the University of Ottawa, who loves digging into businesses and figuring out what makes them worth investing in. I’m especially interested in accounting, equity research, corporate banking, fintech and consulting, but I’m open to exploring a wide range of roles across accounting and finance. I’m currently seeking internship and co-op opportunities for Summer 2027. On this site, you’ll find the stock pitches I’ve built alongside my teams, my case competition work, entrepreneurial projects and professional experience. Outside of school and work, you’ll usually find me playing volleyball or basketball, doing CrossFit, or planning my next trip. Music is a big part of my life too: I love playing guitar, and there’s almost always some house music or dubstep in the background. I’m always up for new challenges and conversations, so don’t hesitate to reach out!",
  badges: ["Accounting", "Equity Research", "Corporate Banking", "Fintech", "Consulting"],

  /* ---------- The 8 sections ----------
     fkey  : the little key label shown on the map (F1, F2 ...)
     code  : short terminal-style code shown on the map
     blurb : one short line under the name on the map
  */
  sections: [

    /* 1. About Me */
    { id: "about", type: "about", fkey: "F1", code: "ABOUT", label: "About Me", blurb: "Who I am" },

    /* 2. Pitches (the list itself is further down, under "pitches") */
    { id: "pitches", type: "pitches", fkey: "F2", code: "PITCH", label: "Pitches", blurb: "Stock pitches",
      intro: "Equity research pitches built with my teammates in the Telfer Finance Society Investment Group (TFSIG), Natural Resources Coverage Group." },

    /* 3. Case Competitions */
    {
      id: "cases", type: "entries", fkey: "F3", code: "COMP", label: "Case Competitions", blurb: "Competitions & results",
      intro: "",
      items: [
        { title: "TCU x uOREC 2026", org: "", date: "April 2026", result: "1st Place · $1,000", text: "",
          bullets: [
            "Real estate case competition hosted by the University of Ottawa Real Estate Club (uOREC) in partnership with TCU Development, an Ottawa-based real estate development company",
            "Led a full investment property analysis with my team, including financial modelling, and pitched our recommendation to the judges, taking 1st place and a $1,000 prize"
          ],
          skills: ["Financial Modelling", "Real Estate Analysis", "Valuation", "Pitching"], link: "" },
        { title: "The CPA Way Case Competition 2026", org: "", date: "October 2026", result: "3rd Place · $500", text: "",
          bullets: [
            "CPA Ontario case competition for first- and second-year undergraduates, where teams applied The CPA Way framework to assess the ethics of a real-life business situation",
            "Placed 3rd out of 77 teams and 366 students from across Ontario, earning a $500 prize"
          ],
          skills: ["Ethical Analysis", "Critical Thinking", "Problem Solving", "Business Communication"], link: "" },
        { title: "Omnium Financier 2026", org: "Personal Finance event", date: "February 2026", result: "", text: "",
          bullets: [
            "Represented the University of Ottawa at Canada’s largest interuniversity finance and accounting competition, hosted by Université Laval with over 400 students from 11 universities",
            "Built a complete personal financial plan for a client case, from analyzing their situation to making tailored recommendations, and presented it to a panel of professional judges"
          ],
          skills: ["Personal Financial Planning", "Financial Analysis", "Client Advisory", "Public Speaking"], link: "" },
        { title: "Telfer Internal Case Competition", org: "", date: "November 2025", result: "2nd Place", text: "",
          bullets: [
            "Telfer’s internal case competition, where teams of three analyze a business case and present their solution to a panel of industry judges",
            "Tackled a human resources case for Shopify, developing people-focused recommendations for the company"
          ],
          skills: ["HR Strategy", "Problem Solving", "Teamwork", "Presentation Skills"], link: "" },
        { title: "Koppel Cup 2025", org: "", date: "November 2025", result: "Semi-Finalists", text: "",
          bullets: [
            "Telfer’s first-semester case challenge, bringing together over 1,000 new BCom students to analyze a Canadian company and propose innovative solutions",
            "Built recommendations for Purple Potties and presented them to the company’s owner and a panel of professional judges, advancing to the semi-finals"
          ],
          skills: ["Business Strategy", "Creative Problem Solving", "Client Presentation", "Teamwork"], link: "" },
        { title: "Défi 48", org: "High school competition", date: "June 2024", result: "", text: "",
          bullets: [
            "48-hour high school entrepreneurship challenge where teams launched and ran their own revenue-generating initiative",
            "Designed and ran a raffle system with my team, raising a total of $450 in revenue within the 48 hours"
          ],
          skills: ["Entrepreneurship", "Sales", "Working Under Pressure", "Teamwork"], link: "" }
      ]
    },

    /* 4. Entrepreneurship Experience */
    {
      id: "ventures", type: "entries", fkey: "F4", code: "VENT", label: "Entrepreneurship", blurb: "What I've built",
      intro: "",
      // text: a blank line ("\n\n") starts a new paragraph · image: optional photo, e.g. "files/photo.jpg"
      items: [
        { title: "Grime to Green — Car Detailing", org: "Founder · Ottawa, ON", date: "May 2024 – Aug 2025", result: "",
          text: "Grime to Green was an Ottawa-based car detailing business offering detailing services tailored to each client’s needs. In just over a year, it grew into a profitable operation, generating more than $15,000 in revenue while maintaining operating margins above 75%.\n\nThe business served over 100 clients and built a steady stream of repeat business and referrals by consistently delivering spotless results. Running it meant hiring and managing a team of three employees, overseeing scheduling and quality control, and tracking revenue, expenses and profitability to guide its growth.",
          bullets: [], skills: ["Financial Planning", "Team Management", "Operations Management", "Client Service"], link: "" },
        { title: "Canadian Volleyball League (CVL)", org: "Director of Finance · Ottawa, ON", date: "Jun 2026 – Present", result: "",
          text: "The Canadian Volleyball League is an Ottawa-based volleyball organization. We currently run competitive coed and men’s tournaments, such as the Summer Coed Cup and the Winter Coed Championship, that bring athletes, fans and supporters together, and we’re looking to expand into a full league in the long run.\n\nAs Director of Finance, I help plan event budgets and logistics, using Excel to track expenses and find ways to cut costs. I also helped organize a summer tournament that generated up to $6,600 in sales.",
          bullets: [], skills: ["Budgeting", "Event Planning", "Cost Optimization"], link: "https://www.canadavolleyballleague.ca/", linkLabel: "Visit website" }
      ]
    },

    /* 5. Professional Experience */
    {
      id: "experience", type: "entries", fkey: "F5", code: "EXP", label: "Professional Experience", blurb: "Where I've worked",
      intro: "",
      items: [
        { title: "Store Sales Associate", org: "Running Room · Part-time · Ottawa, ON", date: "Aug 2026 – Present", result: "", text: "",
          bullets: [
            "Advising customers on product options and pricing, strengthening client communication and need-based sales skills",
            "Processing transactions accurately and supporting inventory and merchandising activities in a fast-paced retail environment"
          ],
          skills: ["Client Relationships", "Needs-Based Selling", "Attention to Detail", "Inventory Management"], link: "" },
        { title: "Coach", org: "CrossFit Actus · Part-time · Ottawa, ON", date: "May 2026 – Oct 2026", result: "", text: "",
          bullets: [
            "Assisted in running CrossFit classes of 1–10 people, demonstrating movements, correcting form and keeping each session on schedule",
            "Adapted workouts to each member’s fitness level and goals, creating a safe, motivating environment that kept members engaged and coming back"
          ],
          skills: ["Coaching & Mentoring", "Public Speaking", "Client Relationships", "Adaptability"], link: "" },
        { title: "Camp Area Supervisor", org: "YMCA Canada · Full-time summer contract · Ottawa, ON", date: "Jun 2026 – Aug 2026", result: "", text: "",
          bullets: [
            "Supervised and supported a team of camp counselors, overseeing daily programming, scheduling and safety across an assigned camp area",
            "Served as a key point of contact for parents and staff, resolving issues quickly to ensure a safe, positive experience for every camper"
          ],
          skills: ["Team Leadership", "Problem Solving", "Planning & Scheduling", "Decision-Making"], link: "" },
        { title: "Camp Counselor", org: "YMCA Canada · Full-time summer contracts · Ottawa, ON", date: "Jun 2024 – Aug 2024 · Jun 2025 – Aug 2025", result: "", text: "",
          bullets: [
            "Led daily activities for groups of campers over two summer terms, delivering engaging programs that built teamwork, confidence and inclusion",
            "Ensured camper safety and well-being at all times, communicating regularly with parents and collaborating closely with fellow counselors"
          ],
          skills: ["Communication", "Teamwork", "Accountability", "Adaptability"], link: "" },
        { title: "Line Cook", org: "McDonald’s · Part-time · Ottawa, ON", date: "Jan 2025 – May 2025", result: "", text: "",
          bullets: [
            "Prepared orders quickly and accurately in a high-volume kitchen, maintaining strict food safety and quality standards during peak hours",
            "Collaborated with a fast-paced team to keep service times low, adapting to shifting priorities while keeping a clean, organized station"
          ],
          skills: ["Working Under Pressure", "Time Management", "Process Efficiency", "Collaboration"], link: "" },
        { title: "Store Clerk", org: "Bulk Barn · Part-time · Ottawa, ON", date: "May 2023 – Oct 2023", result: "", text: "",
          bullets: [
            "Restocked shelves and bulk bins and kept the store clean and organized, ensuring a smooth and pleasant shopping experience for customers",
            "Assisted customers in finding products and answering their questions, building strong customer service, communication and time-management skills"
          ],
          skills: ["Customer Service", "Organization", "Reliability"], link: "" }
      ]
    },

    /* 6. Extracurriculars */
    {
      id: "extracurriculars", type: "entries", fkey: "F6", code: "EXTRA", label: "Extracurriculars", blurb: "Clubs & leadership",
      intro: "",
      items: [
        { title: "Entrepreneurship Coach", org: "Place à la jeunesse", date: "Nov 2026", result: "", text: "",
          bullets: [
            "Coached teams of 2–4 high school students through an entrepreneurship competition, guiding them as they developed their business ideas and stepping in whenever they needed help"
          ], skills: ["Mentoring", "Coaching", "Communication", "Entrepreneurship"], link: "" },
        { title: "Director of Academia", org: "University of Ottawa Consulting Association (UOCA)", date: "May 2026 – Present", result: "", text: "",
          bullets: [
            "Led the development of consulting-focused workshops and educational resources to strengthen members' problem-solving and analytical skills",
            "Coordinated with executives, industry professionals, and student leaders to deliver academic programming focused on consulting frameworks, case competitions, and career readiness",
            "Managed the club’s academic strategy and training initiatives, ensuring members had structured opportunities to develop presentation, research, and business analysis skills"
          ], skills: ["Leadership", "Program Development", "Stakeholder Coordination", "Public Speaking"], link: "" },
        { title: "Junior Analyst", org: "TFS Investment Group", date: "Sep 2025 – Present", result: "", text: "",
          bullets: [
            "Conducted financial analysis and equity research on publicly traded companies, building valuation models and presenting investment recommendations to portfolio managers for Duke Energy (NYSE:DUK) and Linde PLC (NASDAQ:LIN)",
            "Collaborated with analysts and portfolio managers to monitor portfolio performance, analyze market trends, and evaluate investment opportunities for Tourmaline (TSE:TOU) and Ivanhoe (TSE:IVN)",
            "Applied financial modelling techniques including comparables company analysis, relative valuation, and three-statement modelling"
          ], skills: ["Equity Research", "Financial Modelling", "Valuation", "Market Analysis"], link: "" },
        { title: "External Relations Coordinator", org: "Enactus uOttawa", date: "May 2025 – Apr 2026", result: "", text: "",
          bullets: [
            "Prepared and submitted grant applications to secure funding for Enactus uOttawa’s social entrepreneurship projects, tailoring each proposal to the funder’s criteria",
            "Built relationships with corporate partners, sponsors and community organizations, coordinating outreach to strengthen the team’s funding and visibility"
          ], skills: ["Grant Writing", "Partnership Development", "Outreach", "Written Communication"], link: "" },
        { title: "First Year Representative", org: "CPA Ontario: University of Ottawa", date: "Sep 2025 – Dec 2025", result: "", text: "",
          bullets: [
            "Increased student engagement by promoting professional-development, networking, and CPA-focused events across campus",
            "Collaborated with CPA Ontario representatives and campus leaders to strengthen awareness of the CPA designation and accounting career pathways"
          ], skills: ["Event Promotion", "Networking", "Relationship Building", "Communication"], link: "" }
      ]
    },

    /* 7. Skills */
    {
      id: "skills", type: "skills", fkey: "F7", code: "SKIL", label: "Skills", blurb: "Toolkit",
      intro: "The toolkit I’ve built through my studies, the investment group, case competitions and work.",
      groups: [
        { name: "Finance & Accounting", items: ["Financial Modelling", "Three-Statement Modelling", "Comparable Company Analysis", "Relative Valuation", "Equity Research", "Financial Analysis", "Budgeting & Cost Optimization"] },
        { name: "Sector Coverage",      items: ["Natural Resources (Energy & Mining)", "Utilities", "Industrial Gases"] },
        { name: "Tools & Platforms",    items: ["Bloomberg", "Capital IQ", "FactSet", "Microsoft Excel", "Microsoft PowerPoint", "Microsoft Office 365"] },
        { name: "Programming",          items: ["HTML", "CSS", "JavaScript"] },
        { name: "Professional",         items: ["Pitching & Public Speaking", "Client Relationships", "Team Leadership", "Business Communication", "Problem Solving", "Grant Writing"] },
        { name: "Certifications",       items: ["Bloomberg Market Concepts (BMC)", "Standard First Aid CPR-C/AED", "CrossFit Level 1"] },
        { name: "Languages",            items: ["French", "English"] }
      ]
    },

    /* 8. Socials */
    {
      id: "socials", type: "socials", fkey: "F8", code: "SOC", label: "Socials", blurb: "Get in touch",
      intro: "I am always up for a chat, feel free to reach out through one of the following:",
      // kind: "email" | "linkedin" | "github" | "website" | "other"   (leave url "" to show it as "coming soon")
      links: [
        { kind: "email",    label: "Email",    url: "llach097@uottawa.ca" },   // just the address
        { kind: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com/in/ludoviclachance/" },   // full link
        { kind: "github",   label: "GitHub",   url: "https://github.com/yorludo" }
      ]
    }
  ],

  /* ---------- Your pitches (shown inside the Pitches section) ----------
     call : "Buy", "Hold" or "Sell" turns green / amber / red automatically
     team / role : shown on the pitch page so visitors know it was a group effort
     pdf  : path to the full pitch PDF in the files folder ("" = none yet)
     Copy a whole { ... } block to add another pitch.
  */
  pitches: [
    {
      id: "lin", ticker: "LIN", exchange: "NASDAQ", company: "Linde plc", sector: "Industrial Gases",
      jurisdiction: "Global (Americas · EMEA · APAC)",
      call: "Buy", target: "$520.56", date: "February 23, 2026",
      team: "TFSIG Natural Resources Coverage Group · team of 4", role: "Junior Analyst",
      thesis: "Linde is one of the three global leaders in industrial gases, with a defensive business model built on 15–20 year take-or-pay contracts and cost pass-through agreements that protect margins through commodity cycles. Over 62% of sales are defensive, and a $10B project backlog plus structural demand from semiconductors, AI infrastructure and healthcare support steady, above-peer earnings growth.",
      metrics: [
        { label: "Price at pitch", value: "$496.51" }, { label: "Upside", value: "4.85%" },
        { label: "Market cap", value: "$233.9B" }, { label: "Dividend yield", value: "1.24%" },
        { label: "Revenue 2026E", value: "$36.7B" }, { label: "EV / EBITDA 2026E", value: "13.0x" },
        { label: "P/E 2026E", value: "21.3x" }, { label: "WACC", value: "6.75%" }
      ],
      points: [
        "Thesis I — Demographic tailwinds: a growing, ageing population drives long-term demand for medical oxygen, food preservation and cold-chain gases.",
        "Thesis II — Defensive growth: long-term take-or-pay contracts, cost pass-throughs and an oligopolistic market (top players hold ~80% share) give Linde pricing power and protected margins.",
        "Thesis III — Structural demand from AI adoption (semiconductor fabs, data-centre cooling) and health-conscious consumer trends.",
        "Valuation — blended DCF (TGR 25%, exit multiple 60%) and comparables (15%), giving a $520.56 target.",
        "Key risks — capital-intensive project overruns, hydrogen competition and U.S. tariffs, mitigated by long-term contracts and a diversified global footprint."
      ],
      catalysts: [
        { date: "2026", text: "Adjusted EPS guidance of $17.40–$17.90, roughly 6–9% growth year over year" },
        { date: "Ongoing", text: "Conversion of the $10B project backlog into contracted revenue" },
        { date: "Ongoing", text: "AI-driven semiconductor fab construction lifting demand for high-purity gases" }
      ],
      pdf: "files/linde-pitch.pdf"
    },
    {
      id: "duk", ticker: "DUK", exchange: "NYSE", company: "Duke Energy Corp.", sector: "Regulated Utilities",
      jurisdiction: "U.S. Southeast & Midwest",
      call: "Buy", target: "$129.88", date: "December 1, 2025",
      team: "TFSIG Natural Resources Coverage Group · team of 6", role: "First Year Analyst",
      thesis: "Duke Energy is a regulated U.S. utility headquartered in Charlotte, with 55,139 MW of generating capacity across the Southeast and Midwest. Its industry-leading $95–105B 2026–2030 capex plan turns regulator-mandated infrastructure spending into a growing rate base, supporting a reaffirmed 5–7% long-term EPS growth rate, while data centres, reshoring and population migration accelerate load growth.",
      metrics: [
        { label: "Price at pitch", value: "$122.80" }, { label: "Total return", value: "5.76%" },
        { label: "Market cap", value: "$96.3B" }, { label: "Dividend yield", value: "3.4%" },
        { label: "Revenue 2025E", value: "$31.1B" }, { label: "EV / EBITDA 2025E", value: "11.75x" },
        { label: "P/E 2025E", value: "20.10x" }, { label: "WACC", value: "5.02%" }
      ],
      points: [
        "Thesis I — Industry-leading capex plan: $95–105B over 2026–2030, the largest among U.S. utilities, mostly regulator-mandated projects with high cost-recovery visibility; Q3 EPS rose 11%.",
        "Thesis II — Clean energy transition and accelerating load growth: 5 GW of new natural gas by 2029, 1,500 MW of new solar per year in the Carolinas from 2027, and licence renewals for all 11 nuclear units.",
        "Valuation — DCF exit multiple (5- and 10-year, 20% each) and comparables (60%), giving a $129.88 target.",
        "Key risks — fuel and nuclear costs, new EPA rules and reliance on state approvals, mitigated by decoupling, integrated resource planning and cost-recovery mechanisms."
      ],
      catalysts: [
        { date: "Near term", text: "Approved rate cases: $768M Carolinas increase at a 10% ROE and $385M of incremental Indiana revenue at a 9.75% ROE" },
        { date: "Ongoing", text: "Customer growth and electrification expanding the regulated revenue base" },
        { date: "Ongoing", text: "Portfolio simplification: divesting Commercial Renewables and non-core joint ventures to focus on regulated assets" }
      ],
      pdf: "files/duke-energy-pitch.pdf"
    }
  ]
};
