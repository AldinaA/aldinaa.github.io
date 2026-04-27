const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

const menuToggle = document.getElementById("menu-toggle");
const mainNav = document.getElementById("main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    mainNav.classList.toggle("open");
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("open");
    });
  });
}

const revealElements = document.querySelectorAll(".reveal");
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealElements.forEach((el) => observer.observe(el));
} else {
  revealElements.forEach((el) => el.classList.add("show"));
}

const publicationsContainer = document.getElementById("publications-list");
const yearFilter = document.getElementById("year-filter");
const yearMenu = document.getElementById("pub-year-menu");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parsePublications(text) {
  const lines = text.split(/\r?\n/);
  const publications = [];
  let current = null;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (/^\d+\.\s+/.test(trimmed)) {
      if (current) publications.push(current);
      current = trimmed;
      return;
    }

    if (current && trimmed && !/^[A-Za-z].*:$/.test(trimmed)) {
      current += ` ${trimmed}`;
    }
  });

  if (current) publications.push(current);

  return publications.map((entry) => {
    const yearMatch = entry.match(/(19|20)\d{2}/);
    const year = yearMatch ? yearMatch[0] : "Unknown";

    const markdownLinks = [...entry.matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map(
      (m) => m[1]
    );
    const rawLinks = [...entry.matchAll(/\bhttps?:\/\/[^\s)]+/g)].map((m) => m[0]);
    const allLinks = [...new Set([...markdownLinks, ...rawLinks])].filter(
      (url) => !url.includes("doi.org/")
    );
    const doiLinks = [...new Set([...markdownLinks, ...rawLinks])].filter((url) =>
      url.includes("doi.org/")
    );

    const cleanedText = entry
      .replace(/\[(.*?)\]\((https?:\/\/[^)\s]+)\)/g, "$1")
      .replace(/\((https?:\/\/[^)\s]+)\)/g, "")
      .replace(/\bhttps?:\/\/[^\s)]+/g, "")
      .replace(/\s{2,}/g, " ")
      .trim();

    const searchQuery = encodeURIComponent(cleanedText.slice(0, 220));
    const fallbackLinks = [
      `https://scholar.google.com/scholar?q=${searchQuery}`,
      `https://www.google.com/search?q=${searchQuery}`
    ];

    const links = allLinks.length || doiLinks.length ? [...doiLinks, ...allLinks] : fallbackLinks;
    return { year, text: cleanedText, links };
  });
}

function renderPublications(publications, selectedYear) {
  if (!publicationsContainer) return;
  const list = publications.filter((item) =>
    selectedYear === "all" ? true : item.year === selectedYear
  );

  if (!list.length) {
    publicationsContainer.innerHTML = `<p class="muted">No publications found for this year.</p>`;
    return;
  }

  publicationsContainer.innerHTML = list
    .map((item) => {
      const safeText = escapeHtml(item.text);
      const linksHtml = item.links
        .slice(0, 3)
        .map((url, idx) => {
          const label = idx === 0 ? "Primary link" : idx === 1 ? "Alt link" : "Search";
          return `<a href="${url}" target="_blank" rel="noreferrer">${label}</a>`;
        })
        .join("");
      return `
        <article class="pub-item">
          <p class="pub-meta">${item.year}</p>
          <p>${safeText}</p>
          <div class="pub-links">${linksHtml}</div>
        </article>
      `;
    })
    .join("");
}

function setupYearControls(years, publications) {
  if (!yearFilter || !yearMenu) return;
  years.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    yearFilter.appendChild(option);
  });

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "year-chip active";
  allButton.dataset.year = "all";
  allButton.textContent = "All";
  yearMenu.appendChild(allButton);

  years.forEach((year) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "year-chip";
    button.dataset.year = year;
    button.textContent = year;
    yearMenu.appendChild(button);
  });

  yearFilter.addEventListener("change", (event) => {
    const selectedYear = event.target.value;
    yearMenu.querySelectorAll(".year-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.year === selectedYear);
    });
    renderPublications(publications, selectedYear);
  });

  yearMenu.addEventListener("click", (event) => {
    const target = event.target;
    if (!target || !target.dataset || !target.dataset.year) return;
    const selectedYear = target.dataset.year;
    yearFilter.value = selectedYear;
    yearMenu.querySelectorAll(".year-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.year === selectedYear);
    });
    renderPublications(publications, selectedYear);
  });
}

if (publicationsContainer && yearFilter && yearMenu) {
  const publications = Array.isArray(window.PUBLICATIONS_DATA)
    ? window.PUBLICATIONS_DATA
    : [];

  if (!publications.length) {
    publicationsContainer.innerHTML =
      `<p class="muted">Publication data is currently unavailable.</p>`;
  } else {
    const years = [...new Set(publications.map((p) => p.year))]
      .filter((year) => year !== "Unknown")
      .sort((a, b) => Number(b) - Number(a));
    setupYearControls(years, publications);
    renderPublications(publications, "all");
  }
}

function pickTitleSegment(text) {
  const manualOverrides = [
    {
      match: "Web Application for Monitoring the Scientific Activity of Employees at Sunp",
      title: "Web Application for Monitoring the Scientific Activity of Employees at Sunp"
    },
    {
      match: "Software Security Analysis, Metrics, and Test Design Considerations",
      title: "Software Security Analysis, Metrics, and Test Design Considerations"
    },
    {
      match: "Applying Native XML Databases in Advanced E-Government Systems",
      title: "Applying Native XML Databases in Advanced E-Government Systems"
    },
    {
      match: "N-gram analiza tekstualnih dokumenata na srpskom jeziku",
      title: "N-gram analiza tekstualnih dokumenata na srpskom jeziku"
    },
    {
      match: "Korišćenje izvornih i proširenih XML baza podataka u sistemu e-Uprave",
      title: "Korišćenje izvornih i proširenih XML baza podataka u sistemu e-Uprave"
    },
    {
      match: "Normalizacija tekstualnih dokumenata na srpskom jeziku u cilju efikasnijeg pretraživanja dokumenata u sistemima e-Uprave",
      title:
        "Normalizacija tekstualnih dokumenata na srpskom jeziku u cilju efikasnijeg pretraživanja dokumenata u sistemima e-Uprave"
    },
    {
      match: "One Solution of Searching Text Documents in Serbian Language",
      title: "One Solution of Searching Text Documents in Serbian Language"
    },
    {
      match: "Similarity Search in Text Data for Serbian Language",
      title: "Similarity Search in Text Data for Serbian Language"
    },
    {
      match: "The Network-based Business Process",
      title: "The Network-based Business Process"
    },
    {
      match: "M-Government Application Intended to Search Documents Written in Serbian Language",
      title: "M-Government Application Intended to Search Documents Written in Serbian Language"
    },
    {
      match: "Using tags for business process enrichment",
      title: "Using tags for business process enrichment"
    },
    {
      match: "Enhancing local economic development using collective intelligence",
      title: "Enhancing local economic development using collective intelligence"
    },
    {
      match: "Creating Domain Dictionaries for Serbian Language",
      title: "Creating Domain Dictionaries for Serbian Language"
    },
    {
      match: "Supporting M-Health Through Android Application for Storing Anamnesis Data",
      title: "Supporting M-Health Through Android Application for Storing Anamnesis Data"
    },
    {
      match: "Medis upitnik - primena mobilnog računarstva u medicini",
      title: "Medis upitnik - primena mobilnog računarstva u medicini"
    },
    {
      match: "Automatsko kreiranje tezaurusa na srpskom jeziku",
      title: "Automatsko kreiranje tezaurusa na srpskom jeziku"
    },
    {
      match: "Real-time shadows in OpenGL caused by the presence of multiple light sources",
      title: "Real-time shadows in OpenGL caused by the presence of multiple light sources"
    },
    {
      match: "Sentiment Analysis of Twitter for the Serbian Language",
      title: "Sentiment Analysis of Twitter for the Serbian Language"
    },
    {
      match: "Processing of Negation in Sentiment Analysis for the Serbian Language",
      title: "Processing of Negation in Sentiment Analysis for the Serbian Language"
    },
    {
      match: "Značaj mobilnog poslovanja u pametnim gradovima",
      title: "Značaj mobilnog poslovanja u pametnim gradovima"
    },
    {
      match: "Koncept efikasnog parkiranja u pametnim gradovima",
      title: "Koncept efikasnog parkiranja u pametnim gradovima"
    },
    {
      match: "Towards the lexical resources for sentiment-reach informal texts",
      title: "Towards the lexical resources for sentiment-reach informal texts – the Serbian language case"
    },
    {
      match: "Healthcare in Smart Cities – Privacy and Security Issues",
      title: "Healthcare in Smart Cities – Privacy and Security Issues"
    },
    {
      match: "Značaj e-Zdravstva u konceptu pametnih gradova",
      title: "Značaj e-Zdravstva u konceptu pametnih gradova"
    },
    {
      match: "Transportation in Smart Cities - Tracking and improving driving comfort",
      title: "Transportation in Smart Cities - Tracking and improving driving comfort"
    },
    {
      match: "Smart Transportation in the Service of Improving Healthcare in Smart Cities",
      title: "Smart Transportation in the Service of Improving Healthcare in Smart Cities"
    },
    {
      match: "Towards Context-Aware Smart Healthcare Platform",
      title: "Towards Context-Aware Smart Healthcare Platform"
    },
    {
      match: "Kontekstno-svesna platforma pametnog zdravstva zasnovana na IoT i Crowdsourcing-u",
      title: "Kontekstno-svesna platforma pametnog zdravstva zasnovana na IoT i Crowdsourcing-u"
    },
    {
      match: "Primena crowdsourcing-a u detekciji psiholoških problema",
      title: "Primena crowdsourcing-a u detekciji psiholoških problema"
    },
    {
      match: "Normalization of Medical Records Written in Serbian",
      title: "Normalization of Medical Records Written in Serbian"
    },
    {
      match: "Automation of Psychological Testing of Stressful Situations in the Serbian",
      title: "Automation of Psychological Testing of Stressful Situations in the Serbian"
    },
    {
      match: "Automated labeling of terms in medical reports in Serbian",
      title: "Automated labeling of terms in medical reports in Serbian"
    },
    {
      match: "Normalization of Health Records in the Serbian Language with the Aim of Smart Health Services Realization",
      title: "Normalization of Health Records in the Serbian Language with the Aim of Smart Health Services Realization"
    },
    {
      match: "Creating Resources for Marking Diagnoses in Electronic Health Reports in Serbian",
      title: "Creating Resources for Marking Diagnoses in Electronic Health Reports in Serbian"
    },
    {
      match: "Interaktivna softverska platforma za realizaciju javnih zdravstvenih servisa",
      title: "Interaktivna softverska platforma za realizaciju javnih zdravstvenih servisa"
    },
    {
      match: "Kreiranje resursa za obeležavanje dijagnoza u medicinskim izveštajima na srpskom jeziku",
      title: "Kreiranje resursa za obeležavanje dijagnoza u medicinskim izveštajima na srpskom jeziku"
    },
    {
      match: "OpenGL Specular Reflections Caused By Light Source Placed Below Shadowed Object",
      title: "OpenGL Specular Reflections Caused By Light Source Placed Below Shadowed Object"
    },
    {
      match: "Smart Health Services for Epidemic Control",
      title: "Smart Health Services for Epidemic Control"
    },
    {
      match: "Creating a Stop Word Dictionary in Serbian",
      title: "Creating a Stop Word Dictionary in Serbian"
    },
    {
      match: "Automatic Labeling of Diagnosis in Medical Reports in Serbian",
      title: "Automatic Labeling of Diagnosis in Medical Reports in Serbian"
    },
    {
      match: "Pregled resursa za obradu kliničkih tekstova na različitim prirodnim jezicima",
      title: "Pregled resursa za obradu kliničkih tekstova na različitim prirodnim jezicima"
    },
    {
      match: "Primena blokčejn tehnologije u cilju obezbeđivanja sigurnosti podataka u servisima pametnog zdravstva",
      title: "Primena blokčejn tehnologije u cilju obezbeđivanja sigurnosti podataka u servisima pametnog zdravstva"
    },
    {
      match: "Ensuring the Durability and Reliability of Data in Smart Health Services Using Blockchain Technologies",
      title: "Ensuring the Durability and Reliability of Data in Smart Health Services Using Blockchain Technologies"
    },
    {
      match: "Creating Smart Health Services Using Nlp Techniques",
      title: "Creating Smart Health Services Using Nlp Techniques"
    },
    {
      match: "Smart Health Services based on IoT and GIS",
      title: "Smart Health Services based on IoT and GIS"
    },
    {
      match: "The Tools and Resources for Clinical Text Processing",
      title: "The Tools and Resources for Clinical Text Processing"
    },
    {
      match: "Detection of postpartum depression-related posts: An analysis for Serbian",
      title: "Detection of postpartum depression-related posts: An analysis for Serbian"
    },
    {
      match: "ANALIZA GREŠAKA U MEDICINSKIM IZVEŠTAJIMA NA SRPSKOM JEZIKU U CILJU NJIHOVE AUTOMATSKE DETEKCIJE I KOREKCIJE",
      title: "ANALIZA GREŠAKA U MEDICINSKIM IZVEŠTAJIMA NA SRPSKOM JEZIKU U CILJU NJIHOVE AUTOMATSKE DETEKCIJE I KOREKCIJE"
    },
    {
      match: "METODA ZA OBRADU PREDIKATSKIH ISKAZA NA SRPSKOM JEZIKU",
      title: "METODA ZA OBRADU PREDIKATSKIH ISKAZA NA SRPSKOM JEZIKU"
    },
    {
      match: "A survey of resources and methods for natural language processing of Serbian language",
      title: "A survey of resources and methods for natural language processing of Serbian language"
    },
    {
      match: "Generative AI Tools in Web Design",
      title: "Generative AI Tools in Web Design"
    },
    {
      match: "Towards Citizen-Centered Smart Services: Research Insights from a Project",
      title: "Towards Citizen-Centered Smart Services: Research Insights from a Project"
    },
    {
      match: "Optimization of Kubernetes: Resource Allocation and Dynamic Scaling",
      title: "Optimization of Kubernetes: Resource Allocation and Dynamic Scaling"
    },
    {
      match: "Feature Selection for Biomedical Data Classification",
      title: "Feature Selection for Biomedical Data Classification"
    },
    {
      match: "Multimodal Intelligence for Medical Text Extraction: Benchmarking Vision LLMs Against Classic Methods",
      title: "Multimodal Intelligence for Medical Text Extraction: Benchmarking Vision LLMs Against Classic Methods"
    },
    {
      match: "THE PROCESSING OF QUANTIFICATION IN PREDICATE STATEMENTS IN THE SERBIAN LANGUAGE",
      title: "THE PROCESSING OF QUANTIFICATION IN PREDICATE STATEMENTS IN THE SERBIAN LANGUAGE"
    },
    {
      match: "PROCESSING OF MISSPELLINGS IN EHR-S IN SERBIAN",
      title: "PROCESSING OF MISSPELLINGS IN EHR-S IN SERBIAN"
    },
    {
      match: "The Use of ASR to Make Clinical Documentation in Serbian",
      title: "The Use of ASR to Make Clinical Documentation in Serbian"
    },
    {
      match: "Detection of Postpartum Depression-Related Posts: An Analysis for Serbian",
      title: "Detection of Postpartum Depression-Related Posts: An Analysis for Serbian"
    },
    {
      match: "Smart Health Services Based on IoT and GIS",
      title: "Smart Health Services Based on IoT and GIS"
    },
    {
      match: "Prepoznavanje imena na slikama lekarskih izveštaja na srpskom jeziku u cilju zaštite ličnih podataka",
      title: "Prepoznavanje imena na slikama lekarskih izveštaja na srpskom jeziku u cilju zaštite ličnih podataka"
    },
    {
      match: "Sistem za automatizaciju testova za proveru znanja baziran na transformaciji predikatskih iskaza",
      title: "Sistem za automatizaciju testova za proveru znanja baziran na transformaciji predikatskih iskaza"
    },
    {
      match: "Feature Extraction for Biomedical Data Classification",
      title: "Feature Extraction for Biomedical Data Classification"
    },
    {
      match: "Thrombophilia Prediction Using Machine Learning Algorithms",
      title: "Thrombophilia Prediction Using Machine Learning Algorithms"
    },
    {
      match: "Selecting critical features for biomedical data classification",
      title: "Selecting critical features for biomedical data classification"
    },
    {
      match: "АУТОМАТСКО ОЗНАЧАВАЊЕ МЕДИЦИНСКИХ ПОДАТАКА НА СРПСКОМ ЈЕЗИКУ ЗА ПОТРЕБЕ СЕРВИСА ПАМЕТНОГ ЗДРАВСТВА",
      title: "АУТОМАТСКО ОЗНАЧАВАЊЕ МЕДИЦИНСКИХ ПОДАТАКА НА СРПСКОМ ЈЕЗИКУ ЗА ПОТРЕБЕ СЕРВИСА ПАМЕТНОГ ЗДРАВСТВА"
    },
    {
      match: "КЛАСИФИКАЦИЈА БИОМЕДИЦИНСКИХ ПОДАТАКА У ЦИЉУ ПРЕДИКЦИЈЕ БОЛЕСТИ У ТРУДНОЋИ",
      title: "КЛАСИФИКАЦИЈА БИОМЕДИЦИНСКИХ ПОДАТАКА У ЦИЉУ ПРЕДИКЦИЈЕ БОЛЕСТИ У ТРУДНОЋИ"
    },
    {
      match: "Comparison of Feature Selection Methods for Biomedical Data Classification",
      title: "Comparison of Feature Selection Methods for Biomedical Data Classification"
    },
    {
      match: "Generative Artificial Intelligence as a Tool for Improving the Accuracy of Classification Models",
      title: "Generative Artificial Intelligence as a Tool for Improving the Accuracy of Classification Models"
    },
    {
      match: "PRIMENA DEVOPS METODOLOGIJE U AGILNOM RAZVOJU SOFTVERA",
      title: "PRIMENA DEVOPS METODOLOGIJE U AGILNOM RAZVOJU SOFTVERA"
    },
    {
      match: "Swarm Intelligence Methods in Feature Selection for Biomedical Data Classification",
      title: "Swarm Intelligence Methods in Feature Selection for Biomedical Data Classification"
    }
  ];
  const manual = manualOverrides.find((item) => text.includes(item.match));
  if (manual) return manual.title;

  const quoted = text.match(/"([^"]{6,220})"/);
  if (quoted) return quoted[1];

  const parts = text.split(",").map((part) => part.trim()).filter(Boolean);
  const venueLike = /conference|proceedings|symposium|journal|university|serbia|belgrade|beograd|kopaonik|vol\.?|pp\.?|icist|infoteh|yuinfo|sinteza|ieee|telfor|icetran|icest|logic|m\d+|isbn|doi|proceeding|international symposium|faculty/i;

  const isLikelyAuthorSegment = (part) => {
    const normalized = part.replace(/\./g, " ").replace(/\s+/g, " ").trim();
    const tokens = normalized.split(" ").filter(Boolean);
    if (tokens.length < 1 || tokens.length > 7) return false;
    return tokens.every((token) => {
      return (
        /^[A-ZČĆŽŠĐ][a-zčćžšđ'-]+$/.test(token) ||
        /^[A-ZČĆŽŠĐ]$/.test(token) ||
        /^[A-ZČĆŽŠĐ][a-zčćžšđ'-]+-[A-ZČĆŽŠĐ][a-zčćžšđ'-]+$/.test(token) ||
        /^&$/.test(token)
      );
    });
  };

  let authorRun = 0;
  for (let i = 0; i < parts.length; i += 1) {
    if (isLikelyAuthorSegment(parts[i])) {
      authorRun += 1;
    } else {
      break;
    }
  }

  const startIdx = Math.max(1, authorRun);
  for (let idx = startIdx; idx < parts.length; idx += 1) {
    const part = parts[idx];
    const words = part.split(/\s+/).filter(Boolean);
    const hasYear = /(19|20)\d{2}/.test(part);
    const looksLikeCode = /\bM\d+\b|ISBN|DOI/i.test(part);
    const looksAllCaps = /^[^a-z]*$/.test(part);

    if (hasYear || looksLikeCode || venueLike.test(part)) {
      // Once venue/meta starts, stop guessing to avoid wrong links.
      break;
    }

    const isCandidate =
      words.length >= 3 &&
      part.length >= 12 &&
      part.length <= 220 &&
      /[a-z]/.test(part) &&
      !looksAllCaps;

    if (isCandidate) {
      return part;
    }
  }

  return "";
}

function normalizePublicationText(text) {
  let value = String(text || "");
  value = value.replace(/\s+/g, " ").trim();
  value = value.replace(/\*\*DOI:\*\*/gi, "DOI:");
  value = value.replace(/\s+([,.;:])/g, "$1");
  value = value.replace(/\\+/g, "");
  value = value.replace(/DOI:\s*,/gi, "");
  value = value.replace(/DOI:\s*\./gi, ".");
  value = value.replace(/\s+,/g, ",");
  while (/[,\/*\s]$/.test(value)) {
    value = value.replace(/[,\/*\s]+$/, "");
  }
  if (value && !/[.!?]$/.test(value)) {
    value += ".";
  }
  return value;
}

function linkPublicationTitles() {
  const items = document.querySelectorAll("#publications .pub-static-list li");
  items.forEach((item) => {
    const textEl = item.querySelector("p");
    const sourceLinks = item.querySelectorAll(".pub-links a");
    if (!textEl || !sourceLinks.length) return;

    const primaryUrl = sourceLinks[0].getAttribute("href");
    if (!primaryUrl) return;

    const text = normalizePublicationText(textEl.textContent || "");
    textEl.textContent = text;
    const title = pickTitleSegment(text);
    if (!title) {
      const wrapper = item.querySelector(".pub-links");
      if (wrapper) wrapper.remove();
      return;
    }

    const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const titleRegex = new RegExp(escapedTitle);
    const linked = text.replace(
      titleRegex,
      `<a href="${primaryUrl}" target="_blank" rel="noreferrer">${title}</a>`
    );
    textEl.innerHTML = linked;

    const wrapper = item.querySelector(".pub-links");
    if (wrapper) wrapper.remove();
  });
}

linkPublicationTitles();

function setupPublicationRangeFilters() {
  const filters = document.querySelectorAll(".range-filter");
  const blocks = document.querySelectorAll("#publications .year-block");
  if (!filters.length || !blocks.length) return;

  const applyRange = (range) => {
    const [start, end] = range.split("-").map((x) => Number(x));
    blocks.forEach((block) => {
      const id = block.getAttribute("id") || "";
      const year = Number(id.replace("year-", ""));
      const visible = year >= start && year <= end;
      block.style.display = visible ? "" : "none";
    });
  };

  filters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const range = filter.getAttribute("data-range");
      if (!range) return;
      filters.forEach((btn) => btn.classList.remove("active"));
      filter.classList.add("active");
      applyRange(range);
    });
  });

  applyRange("2021-2025");
}

setupPublicationRangeFilters();
