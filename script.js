// Import PDF.js (using import because script tag is type=module)
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';

// Set workerSrc (essential for PDF.js)
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

const reciterSelect = document.getElementById('reciter-select');
const surahSelect = document.getElementById('surah-select');
const audioPlayer = document.getElementById('audio-player');
const langButtons = document.querySelectorAll('.lang-button');
const translatableElements = document.querySelectorAll('[data-lang-key]');
const sidebarNavButtons = document.querySelectorAll('.nav-button');
const contentSections = document.querySelectorAll('.content-section');
const skipBackwardButton = document.getElementById('skip-backward');
const skipForwardButton = document.getElementById('skip-forward');
const readableSection = document.getElementById('readable-section');
const readablePlaceholder = readableSection.querySelector('[data-lang-key="readablePlaceholder"]');
const surahButtonsContainer = document.getElementById('surah-buttons-container');
const rewayahSelectorContainer = document.getElementById('rewayah-selector-container');
const rewayahButtonsContainer = document.getElementById('rewayah-buttons-container');
const validationMessageElement = document.getElementById('rewayah-validation-message');
const surahTextDisplayContainer = document.getElementById('surah-text-display-container');
const surahTextDisplay = document.getElementById('surah-text-display');
const backToSurahSelectButton = document.getElementById('back-to-surah-select');
const prevSurahButton = document.getElementById('prev-surah');
const nextSurahButton = document.getElementById('next-surah');
const surahNavigationHeader = document.querySelector('.surah-navigation-header');
// const pdfViewerEn = document.getElementById('pdf-viewer-en'); // REMOVED iframe ref

// ADDED: PDF.js related elements
const pdfViewerContainer = document.getElementById('pdf-viewer-container');
const pdfCanvas = document.getElementById('pdf-canvas');
const pdfCtx = pdfCanvas ? pdfCanvas.getContext('2d') : null;
const pdfPrevButton = document.getElementById('pdf-prev');
const pdfNextButton = document.getElementById('pdf-next');
const pdfPageCountSpan = document.getElementById('pdf-page-count');
const pdfPageInput = document.getElementById('pdf-page-input');
const pdfGoToPageButton = document.getElementById('pdf-go-to-page');
const customTocList = document.getElementById('custom-toc-list');
const pdfDownloadButton = document.getElementById('pdf-download');
const glossaryButton = document.getElementById('glossary-button'); // ADDED: Glossary button
const tocHeader = document.getElementById('toc-header');         // ADDED: TOC Header

// ADDED: Mobile TOC Elements
const hamburgerTocButton = document.getElementById('hamburger-toc'); // <<< CHANGED: Select new button
const tocSidebar = document.getElementById('custom-toc-sidebar'); // Already defined, reusing
const tocOverlay = document.getElementById('toc-overlay');
// END ADDITION

// ADDED: PDF.js state variables
let pdfDoc = null;
let pdfPageNum = 1;
let pdfPageRendering = false;
let pdfPageNumPending = null;
const pdfScale = 1.5; // Adjust scale as needed
const mainPdfUrl = 'Written/All-Surah-en.pdf';
const glossaryPdfUrl = 'Written/Quran-Glossary.pdf';
let currentPdfUrl = mainPdfUrl; // Track current PDF

// ADDED: Rate limiting state
let isDownloadButtonDisabled = false;
const downloadCooldown = 10000; // 10 seconds cooldown

let quranData = {}; // <<< ADDED: Single object for all data
let selectedRewayahId = 'Qaloon'; // Default to Qaloon rewayah
let currentSurahOrder = null; // ADDED: Track displayed Surah order

// <<< ADDED: Reciter Data (matches folder names in Media/) --->
const reciters = [
    { id: 'Ahmed-Alajami', name: 'Ahmed Al-Ajmi', name_ar: 'أحمد العجمي' },
    { id: 'Maher-Almeaqaly', name: 'Maher Al-Muaiqly', name_ar: 'ماهر المعيقلي' },
    { id: 'Saad-Al-Ghamdi', name: 'Saad Al-Ghamdi', name_ar: 'سعد الغامدي' },
    { id: 'Yasir-Aldosary', name: 'Yasir Ad-Dussary', name_ar: 'ياسر الدوسري' }
];
// <<< END ADDITION --->

// Rewayah Data (Still needed for populating dropdown? Keep for now)
// You might want to get this list dynamically from quranData.rewayaat keys later
const rewayah = [
    { id: 'Qaloon', name_ar: 'رواية قالون عن نافع' },
    { id: 'Bazzi', name_ar: 'رواية البزي عن ابن كثير' },
    { id: 'Doori', name_ar: 'رواية الدوري عن ابي عمرو' },
    { id: 'Hafs', name_ar: 'رواية حفص عن عاصم' },
    { id: 'Qunbul', name_ar: 'رواية قنبل عن ابن كثير' },
    { id: 'Shouba', name_ar: 'رواية شعبة عن عاصم' },
    { id: 'Soosi', name_ar: 'رواية السوسي عن ابي عمرو' },
    { id: 'Warsh', name_ar: 'رواية ورش عن نافع' }
];

// Map Rewayah ID to CSS font class
const rewayahFontMap = {
    'Bazzi': 'font-bazzi',
    'Doori': 'font-doori',
    'Hafs': 'font-hafs',
    'Qaloon': 'font-qaloon',
    'Qunbul': 'font-qunbul',
    'Shouba': 'font-shouba',
    'Soosi': 'font-soosi',
    'Warsh': 'font-warsh'
};

// <<< ADDED: Function to fetch the combined Quran data --->
async function fetchQuranData() {
    try {
        const response = await fetch('quran_data.json'); // Fetch the new merged file
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        quranData = await response.json();
        console.log("Quran data fetched successfully:");
        // Call functions that depend on quranData
        populateSurahs(currentLanguage); // Needs quranData.surahs
        // updateReadableSectionVisibility() indirectly calls populateReadableSurahButtons which needs quranData.surahs
        // displaySurahText needs quranData.rewayaat and quranData.surahs
        // Initial call to populate happens in DOMContentLoaded after fetch
    } catch (error) {
        console.error("Could not fetch Quran data:", error);
        alert("Error loading essential Quran data. The application might not work correctly.");
    }
}
// <<< END ADDITION --->

// --- Language Content ---
const translations = {
    en: {
        title: "Quran Player",
        selectReciter: "Select Reciter:",
        selectSurah: "Select Surah:",
        selectRewayah: "Select Rewayah:",
        sections: "Sections",
        audible: "Audible",
        readable: "Readable",
        readableContentTitle: "Readable Quran Content",
        readablePlaceholder: "This section will display the text of the selected Surah. (Functionality to be added)",
        reciterPlaceholder: " Select Reciter ",
        surahPlaceholder: " Select Surah ",
        rewayahPlaceholder: " Select Rewayah ",
        rewayahValidationMsg: "Please select a Rewayah first.",
        backButton: "Back"
    },
    ar: {
        title: "مُشغل القرآن الكريم",
        selectReciter: "اختر القارئ:",
        selectSurah: "اختر السورة:",
        selectRewayah: "اختر الرواية:",
        sections: "الأقسام",
        audible: " مسموع 🔉",
        readable: "مكتوب 📖",
        readableContentTitle: "القرآن الكريم للقراءة",
        readablePlaceholder: "هذا القسم سيعرض نص السورة المختارة. (سيتم إضافة الوظائف لاحقًا)",
        reciterPlaceholder: " اختر القارئ ",
        surahPlaceholder: " اختر السورة ",
        rewayahPlaceholder: " اختر الرواية ",
        rewayahValidationMsg: "يرجى اختيار الرواية أولاً.",
        backButton: "رجوع"
    }
};

// Determine initial language based on browser settings
function getInitialLanguage() {
    const browserLang = (navigator.languages && navigator.languages[0]) || navigator.language;
    const primaryLang = browserLang.split('-')[0].toLowerCase(); // Get 'ar' from 'ar-SA' or 'ar'
    return primaryLang === 'ar' ? 'ar' : 'en'; // Default to English if not Arabic
}

let currentLanguage = getInitialLanguage();

// --- Functions ---

function populateReciters(lang) {
    const currentReciterValue = reciterSelect.value; // Store current selection
    reciterSelect.innerHTML = ''; // Clear existing options

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = ""; // No value for placeholder
    placeholderOption.textContent = translations[lang].reciterPlaceholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true; // Make it the default selected
    reciterSelect.appendChild(placeholderOption);

    // Add actual reciters
    // <<< MODIFIED: Use the new reciters array --->
    reciters.forEach(reciter => {
        const option = document.createElement('option');
        option.value = reciter.id; // Use the ID (folder name) as the value
        option.textContent = lang === 'ar' ? reciter.name_ar : reciter.name; // Use appropriate name based on lang
        reciterSelect.appendChild(option);
    });
    // <<< END MODIFICATION --->

    // Restore previous selection if it wasn't the placeholder
    if (currentReciterValue && currentReciterValue !== "") {
        reciterSelect.value = currentReciterValue;
    } else {
         reciterSelect.value = ""; // Ensure placeholder is selected if no valid previous selection
    }
}

function populateSurahs(lang) {
    const currentSurahValue = surahSelect.value; // Store current selection
    surahSelect.innerHTML = ''; // Clear existing options

    // Add placeholder option
    const placeholderOption = document.createElement('option');
    placeholderOption.value = ""; // No value for placeholder
    placeholderOption.textContent = translations[lang].surahPlaceholder;
    placeholderOption.disabled = true;
    placeholderOption.selected = true; // Make it the default selected
    surahSelect.appendChild(placeholderOption);

    // Add actual Surahs from the new data structure
    // Use quranData.surahs instead of surahData
    if (!quranData.surahs) {
        console.error("quranData.surahs not available for populating Surah select.");
        return;
    }
    quranData.surahs.forEach(surah => {
        const option = document.createElement('option');
        option.value = surah.order;
        const name = lang === 'ar' ? surah.name_ar : surah.name_en;
        const displayName = lang === 'ar' && name.startsWith("سورة ") ? name.substring(5) : name;
        option.textContent = `${surah.order}. ${displayName}`;
        surahSelect.appendChild(option);
    });

    // Restore previous selection if it wasn't the placeholder
     if (currentSurahValue && currentSurahValue !== "") {
        surahSelect.value = currentSurahValue;
    } else {
        surahSelect.value = ""; // Ensure placeholder is selected
    }
}

// --- ADDED: Function to populate Rewayah Buttons ---
function populateRewayahButtons() {
    if (!rewayahButtonsContainer) return;
    rewayahButtonsContainer.innerHTML = ''; // Clear existing buttons

    rewayah.forEach(r => {
        const button = document.createElement('button');
        button.classList.add('rewayah-button');
        button.dataset.rewayahId = r.id;
        button.textContent = r.name_ar; // Use Arabic name as requested

        // Set initial active state if this button matches the currently selected Rewayah
        // or if it's Qaloon and no rewayah is selected
        if (r.id === selectedRewayahId || (!selectedRewayahId && r.id === 'Qaloon')) {
            button.classList.add('active');
            selectedRewayahId = r.id; // Ensure selectedRewayahId is set
        }

        button.addEventListener('click', () => {
            // Update selected Rewayah
            selectedRewayahId = r.id;
            console.log(`Rewayah button selected: ${selectedRewayahId}`);

            // Update button active states
            rewayahButtonsContainer.querySelectorAll('.rewayah-button').forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            // Hide validation message on selection
            if (validationMessageElement) {
                validationMessageElement.classList.add('hidden');
                validationMessageElement.textContent = '';
            }
        });

        rewayahButtonsContainer.appendChild(button);
    });
}
// --- END ADDITION ---

function updateAudioSource() {
    const selectedReciter = reciterSelect.value;
    const selectedSurah = surahSelect.value;
    const baseMediaUrl = 'https://tamzeni.com/Quran/Media/'; // <<< ADD THIS LINE (REPLACE URL)

    // Check if a valid reciter is selected (not the placeholder)
    if (selectedReciter && selectedSurah) {

        const paddedSurah = selectedSurah.toString().padStart(3, '0');
        // const audioSrc = `Media/${selectedReciter}/${paddedSurah}.mp3`; // <<< COMMENT OUT TO USE HOSTED MEDIA
        const audioSrc = `${baseMediaUrl}${selectedReciter}/${paddedSurah}.mp3`; // <<< COMMENT IN TO USE LOCAL MEDIA

        console.log("Attempting to load audio:", audioSrc); // For debugging

        audioPlayer.src = audioSrc;

    } else {
        audioPlayer.src = ''; // Clear src if selection is incomplete or placeholder selected
        console.log("Audio source cleared due to incomplete selection.");
    }
}

// Function to display the Surah selection UI
function showSurahSelectionUI() {
    if (currentLanguage === 'ar') { // Only if Arabic
        if (readablePlaceholder) readablePlaceholder.classList.add('hidden');
        if (rewayahSelectorContainer) rewayahSelectorContainer.classList.remove('hidden');
        if (surahButtonsContainer) surahButtonsContainer.classList.remove('hidden');
        if (surahTextDisplayContainer) surahTextDisplayContainer.classList.add('hidden');
        populateReadableSurahButtons(); // Repopulate Surah buttons
        populateRewayahButtons(); // Populate Rewayah buttons
        if (validationMessageElement) {
            validationMessageElement.classList.add('hidden');
            validationMessageElement.textContent = '';
        }
        if (surahNavigationHeader) surahNavigationHeader.classList.add('hidden');
        if (pdfViewerContainer) pdfViewerContainer.classList.add('hidden');
    } else {
        // Handle non-Arabic case (might show placeholder or PDF viewer)
        updateReadableSectionVisibility();
    }
    if (backToSurahSelectButton) backToSurahSelectButton.classList.add('hidden');
}

// Function to display the Surah text UI
function showSurahTextUI() {
    if (readablePlaceholder) readablePlaceholder.classList.add('hidden');
    if (rewayahSelectorContainer) rewayahSelectorContainer.classList.add('hidden');
    if (surahButtonsContainer) surahButtonsContainer.classList.add('hidden');
    if (surahTextDisplayContainer) surahTextDisplayContainer.classList.remove('hidden');
    if (pdfViewerContainer) pdfViewerContainer.classList.add('hidden');

    // Show/hide nav header and individual buttons
    if (surahNavigationHeader) {
        surahNavigationHeader.classList.remove('hidden');
        if (prevSurahButton && nextSurahButton) {
            if (currentSurahOrder > 1) { prevSurahButton.classList.remove('hidden'); } else { prevSurahButton.classList.add('hidden'); }
            if (currentSurahOrder < 114) { nextSurahButton.classList.remove('hidden'); } else { nextSurahButton.classList.add('hidden'); }
            backToSurahSelectButton.classList.remove('hidden');
        }
    }
}

// Add this function after the existing functions
function updateNavigationButtons(currentSurahOrder) {
    console.log(`[NavUpdate] Called for Surah Order: ${currentSurahOrder}, Language: ${currentLanguage}`); // <<< LOGGING

    const prevSurahOrder = Math.max(1, parseInt(currentSurahOrder) - 1);
    const nextSurahOrder = Math.min(114, parseInt(currentSurahOrder) + 1);
    console.log(`[NavUpdate] Prev Order: ${prevSurahOrder}, Next Order: ${nextSurahOrder}`); // <<< LOGGING

    // Get surah names
    const prevSurah = quranData.surahs.find(s => s.order === prevSurahOrder);
    const nextSurah = quranData.surahs.find(s => s.order === nextSurahOrder);
    console.log('[NavUpdate] Found Prev Surah:', prevSurah); // <<< LOGGING
    console.log('[NavUpdate] Found Next Surah:', nextSurah); // <<< LOGGING

    // Update previous button
    const prevNameSpan = prevSurahButton.querySelector('.surah-name');
    console.log('[NavUpdate] Prev name span element:', prevNameSpan); // <<< LOGGING
    if (prevNameSpan) {
        if (prevSurah) {
            const name = currentLanguage === 'ar' ? prevSurah.name_ar : prevSurah.name_en;
            const prefix = currentLanguage === 'ar' ? 'سورة ' : '';
            const textToSet = `${prefix}${name}`;
            console.log(`[NavUpdate] Setting Prev text to: "${textToSet}"`); // <<< LOGGING
            prevNameSpan.textContent = textToSet;
        } else {
            console.log('[NavUpdate] Clearing Prev text.'); // <<< LOGGING
            prevNameSpan.textContent = '';
        }
    }
    prevSurahButton.disabled = currentSurahOrder <= 1;
    if (currentSurahOrder > 1) { prevSurahButton.classList.remove('hidden'); } else { prevSurahButton.classList.add('hidden'); }

    // Update next button
    const nextNameSpan = nextSurahButton.querySelector('.surah-name');
    console.log('[NavUpdate] Next name span element:', nextNameSpan); // <<< LOGGING
    if (nextNameSpan) {
        if (nextSurah) {
            const name = currentLanguage === 'ar' ? nextSurah.name_ar : nextSurah.name_en;
            const prefix = currentLanguage === 'ar' ? 'سورة ' : '';
            const textToSet = `${prefix}${name}`;
            console.log(`[NavUpdate] Setting Next text to: "${textToSet}"`); // <<< LOGGING
            nextNameSpan.textContent = textToSet;
        } else {
            console.log('[NavUpdate] Clearing Next text.'); // <<< LOGGING
            nextNameSpan.textContent = '';
        }
    }
    nextSurahButton.disabled = currentSurahOrder >= 114;
    if (currentSurahOrder < 114) { nextSurahButton.classList.remove('hidden'); } else { nextSurahButton.classList.add('hidden'); }
    console.log('[NavUpdate] Finished updating buttons.'); // <<< LOGGING
}

// Modify the displaySurahText function to include the navigation update
async function displaySurahText(rewayahId, surahOrder) {
    console.log(`Attempting to display Surah ${surahOrder} for Rewayah ${rewayahId}`);
    
    // --- ADDED: Update current Surah tracker ---
    currentSurahOrder = parseInt(surahOrder, 10); // Ensure it's a number
    // --- END ADDITION ---

    const loadingKey = currentLanguage === 'ar' ? 'جاري التحميل...' : 'Loading...';
    surahTextDisplay.textContent = loadingKey; // Show loading indicator

    const basmalaDisplayElement = document.getElementById('basmala-display');
    const surahTitleDisplayElement = document.getElementById('surah-display-title');

    basmalaDisplayElement.classList.add('hidden');
    surahTitleDisplayElement.classList.add('hidden');

    // Ensure combined data is loaded
    if (!quranData || !quranData.surahs || !quranData.rewayaat) {
        console.error("Quran data (quranData) not fully loaded yet.");
        surahTextDisplay.textContent = "Error: Essential data not loaded.";
        showSurahTextUI();
        return;
    }

    // Find the general Surah data (for title)
    const generalSurahInfo = quranData.surahs.find(s => s.order == surahOrder); // Use == for potential type mismatch
    // Get Rewayah specific data
    const rewayahData = quranData.rewayaat[rewayahId];
    const rewayahSurahInfo = rewayahData ? rewayahData.surah_info[surahOrder] : null;

    if (!generalSurahInfo || !rewayahData || !rewayahSurahInfo) {
        console.error(`Data not found for Rewayah ${rewayahId} or Surah ${surahOrder} in quranData.`);
        surahTextDisplay.textContent = `Error: Could not find data for Surah ${surahOrder} in Rewayah ${rewayahId}.`;
        showSurahTextUI();
        return;
    }

    // Extract data from the new structure
    const surahTitle = generalSurahInfo.name_ar; // Title from general Surah data
    const hasBasmalaFlag = rewayahSurahInfo.has_basmala; // Flag from Rewayah-specific info
    const verseCount = rewayahSurahInfo.verse_count; // Verse count from Rewayah-specific info
    const specificBasmalaText = rewayahData.basmala_text; // Basmala text for this Rewayah
    const filePath = `${rewayahData.path}/${surahOrder}.txt`; // Path from Rewayah data
    const rewayahFontClass = rewayahFontMap[rewayahId] || '';

    // --- Title and Basmala Display Logic ---
    // 1. Handle Basmala display
    if (hasBasmalaFlag) { 
        if (specificBasmalaText) {
            basmalaDisplayElement.textContent = specificBasmalaText;
            basmalaDisplayElement.className = 'basmala-display'; // Reset classes
            if (rewayahFontClass) {
                basmalaDisplayElement.classList.add(rewayahFontClass);
            }
            basmalaDisplayElement.classList.remove('hidden');
        } else {
            basmalaDisplayElement.classList.add('hidden');
        }
    } else {
        basmalaDisplayElement.classList.add('hidden');
    }

    // 2. Handle Title display
    surahTitleDisplayElement.textContent = `${surahTitle} (${verseCount} ${currentLanguage === 'ar' ? 'آيات' : 'verses'})`;
    surahTitleDisplayElement.classList.remove('hidden');
    // --- End Display Logic ---

    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for ${filePath}`);
        }
        const text = await response.text();

        // Apply font class to the MAIN text container
        surahTextDisplayContainer.className = 'surah-text-display-container'; // Reset classes
        if (rewayahFontClass) {
            surahTextDisplayContainer.classList.add(rewayahFontClass);
        }

        // Display ONLY the Surah text
        surahTextDisplay.textContent = text.trim();
        surahTextDisplay.lang = 'ar';
        surahTextDisplay.dir = 'rtl';

        // Update navigation
        updateNavigationButtons(surahOrder);
        
        // Show the navigation header
        if (surahNavigationHeader) {
            surahNavigationHeader.classList.remove('hidden');
        }

        showSurahTextUI(); // Switch to the text view (will handle nav button visibility)

    } catch (error) {
        console.error(`Could not fetch or display Surah text from ${filePath}:`, error);
        surahTextDisplay.textContent = `Error loading Surah ${surahOrder}. Please try again.`;
        surahTitleDisplayElement.classList.add('hidden'); 
        basmalaDisplayElement.classList.add('hidden');
        // Hide nav header on error
        if (surahNavigationHeader) {
            surahNavigationHeader.classList.add('hidden');
        }
        // No need to call showSurahTextUI here, as the container is already visible
        // and we just hid the header elements
    }
}
// --- END MODIFICATION ---

// Function to populate Surah buttons in the readable section
function populateReadableSurahButtons() {
    if (!surahButtonsContainer) return;
    surahButtonsContainer.innerHTML = '';

    // Use quranData.surahs
    if (!quranData.surahs) {
        console.error("quranData.surahs not available for populating Surah buttons.");
        return;
    }
    quranData.surahs.forEach(surah => {
        const button = document.createElement('button');
        button.classList.add('surah-button');
        button.dataset.surahOrder = surah.order;
        button.textContent = `${surah.order}. سورة ${surah.name_ar}`;
        
        button.addEventListener('click', () => {
            const surahOrder = button.dataset.surahOrder;
            if (validationMessageElement) validationMessageElement.classList.add('hidden');
            validationMessageElement.textContent = '';

            if (!selectedRewayahId) {
                validationMessageElement.textContent = translations[currentLanguage].rewayahValidationMsg;
                if (validationMessageElement) validationMessageElement.classList.remove('hidden');
                return;
            }
            console.log(`Clicked Surah: ${surahOrder} with Rewayah: ${selectedRewayahId}`);
            displaySurahText(selectedRewayahId, surahOrder);
        });
        
        surahButtonsContainer.appendChild(button);
    });
}

// Function to update the readable section visibility
function updateReadableSectionVisibility() {
    if (!readableSection) return;

    const isReadableActive = !readableSection.classList.contains('hidden');
    const isTextDisplayed = surahTextDisplayContainer && !surahTextDisplayContainer.classList.contains('hidden');
    const isPdfDisplayed = pdfViewerContainer && !pdfViewerContainer.classList.contains('hidden');

    if (isReadableActive) {
        if (currentLanguage === 'en') {
            setupEnglishReadableView();
        } else { // Arabic
            if (isTextDisplayed) {
                showSurahTextUI(); // If text was shown, keep showing it
            } else {
                showSurahSelectionUI(); // Otherwise show selection UI
            }
        }
    } else { // Readable section is not active
        // Hide everything related to the readable section
        if (readablePlaceholder) readablePlaceholder.classList.remove('hidden');
        if (rewayahSelectorContainer) rewayahSelectorContainer.classList.add('hidden');
        if (surahButtonsContainer) surahButtonsContainer.classList.add('hidden');
        if (surahTextDisplayContainer) surahTextDisplayContainer.classList.add('hidden');
        if (pdfViewerContainer) pdfViewerContainer.classList.add('hidden');
        // Optionally clear dynamic content if needed
        if (surahButtonsContainer) surahButtonsContainer.innerHTML = '';
        if (rewayahButtonsContainer) rewayahButtonsContainer.innerHTML = '';
    }
}

// Function to set up English readable view (PDF.js)
function setupEnglishReadableView() {
    if (!readableSection || !pdfViewerContainer) return;
    console.log("Setting up English PDF view");

    // Hide Arabic specific elements
    if (rewayahSelectorContainer) rewayahSelectorContainer.classList.add('hidden');
    if (surahButtonsContainer) surahButtonsContainer.classList.add('hidden');
    if (surahTextDisplayContainer) surahTextDisplayContainer.classList.add('hidden');
    if (readablePlaceholder) readablePlaceholder.classList.add('hidden');

    // Show PDF viewer container
    pdfViewerContainer.classList.remove('hidden');

    // Load the currently selected PDF document (or default)
    loadPdfDocument(currentPdfUrl); 
}

// --- ADDED: PDF.js Rendering Functions ---
async function renderPdfPage(num) {
    if (!pdfDoc || pdfPageRendering || !pdfCtx) {
        return; // Exit if no doc, already rendering, or no canvas context
    }
    pdfPageRendering = true;

    // Update UI page input field
    if(pdfPageInput) pdfPageInput.value = num;

    try {
        // Fetch the page
        const page = await pdfDoc.getPage(num);
        console.log('Page loaded');

        const viewport = page.getViewport({ scale: pdfScale });
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;

        // Render PDF page into canvas context
        const renderContext = {
            canvasContext: pdfCtx,
            viewport: viewport
        };
        const renderTask = page.render(renderContext);

        await renderTask.promise;
        console.log('Page rendered');
        pdfPageRendering = false;

        // Handle pending page render request
        if (pdfPageNumPending !== null) {
            renderPdfPage(pdfPageNumPending);
            pdfPageNumPending = null;
        }

        // Update button states
        pdfPrevButton.disabled = num <= 1;
        pdfNextButton.disabled = num >= pdfDoc.numPages;

    } catch (err) {
        console.error('Error rendering page:', err);
        pdfPageRendering = false; // Ensure rendering flag is reset on error
        // Optionally display an error message to the user
    }
}

function queueRenderPage(num) {
    if (pdfPageRendering) {
        pdfPageNumPending = num;
    } else {
        renderPdfPage(num);
    }
}

function onPrevPage() {
    if (pdfPageNum <= 1) {
        return;
    }
    pdfPageNum--;
    queueRenderPage(pdfPageNum);
}

function onNextPage() {
    if (pdfPageNum >= pdfDoc.numPages) {
        return;
    }
    pdfPageNum++;
    queueRenderPage(pdfPageNum);
}

async function loadPdfDocument(url) {

    
    console.log(`Loading PDF from: ${url}`);
    currentPdfUrl = url; // Update the tracker
    pdfDoc = null; // Reset doc object

    // Update UI before loading
    if (pdfPageInput) pdfPageInput.value = 'Loading...';
    if (pdfPageCountSpan) pdfPageCountSpan.textContent = '-';
    if (customTocList) customTocList.innerHTML = '<li>Loading...</li>'; // Clear/update TOC list
    if (pdfPrevButton) pdfPrevButton.disabled = true;
    if (pdfNextButton) pdfNextButton.disabled = true;
    if (pdfGoToPageButton) pdfGoToPageButton.disabled = true;
    if (pdfPageInput) pdfPageInput.disabled = true;

    // Update sidebar active states and Download button
    if (url === mainPdfUrl) {
        if (glossaryButton) glossaryButton.classList.remove('active');
        if (tocHeader) tocHeader.classList.add('active');
        if (pdfDownloadButton) {
            pdfDownloadButton.classList.remove('hidden');
            pdfDownloadButton.textContent = 'Download Entire Quran in English (PDF)';
            pdfDownloadButton.onclick = () => handlePdfDownload(mainPdfUrl); // Set specific handler
        }
    } else if (url === glossaryPdfUrl) {
        if (glossaryButton) glossaryButton.classList.add('active');
        if (tocHeader) tocHeader.classList.remove('active');
        if (pdfDownloadButton) {
            pdfDownloadButton.classList.remove('hidden');
            pdfDownloadButton.textContent = 'Download Quran Glossary (PDF)';
            pdfDownloadButton.onclick = () => handlePdfDownload(glossaryPdfUrl); // Set specific handler
        }
    } else {
        // Hide download button if it's some other PDF?
        if (pdfDownloadButton) pdfDownloadButton.classList.add('hidden'); 
    }

    try {
        // Asynchronously load the PDF
        const loadingTask = pdfjsLib.getDocument({ url: url });
        pdfDoc = await loadingTask.promise;
        console.log('PDF loaded');

        pdfPageCountSpan.textContent = pdfDoc.numPages;
        if (pdfPageInput) pdfPageInput.max = pdfDoc.numPages; // Set max for input
        if (pdfGoToPageButton) pdfGoToPageButton.disabled = false;
        if (pdfPageInput) pdfPageInput.disabled = false;

        // Initial page rendering
        pdfPageNum = 1; // Reset to first page on load
        renderPdfPage(pdfPageNum); // Render will enable prev/next buttons

        // Load and Populate TOC ONLY for the main PDF
        if (url === mainPdfUrl) {
            const outline = await pdfDoc.getOutline();
            console.log("Outline:", outline);
            populateCustomToc(outline);
        } else {
            // Clear TOC for glossary or other PDFs
            if (customTocList) customTocList.innerHTML = '';
        }

    } catch (err) {
        console.error('Error during PDF loading:', err);
        alert(`Failed to load PDF document: ${url}`);
        if (customTocList) customTocList.innerHTML = '<li>Error loading content</li>';
         if (pdfPageInput) pdfPageInput.value = '-';
         if (pdfPageCountSpan) pdfPageCountSpan.textContent = '-';
    }
}

// --- ADDED: Function to populate Custom TOC sidebar ---
function populateCustomToc(outline, parentElement = customTocList) {
    if (!parentElement) return;
    // Clear existing list items only at the top level
    if (parentElement === customTocList) {
        parentElement.innerHTML = ''; // Clear before populating
    }

    if (!outline || outline.length === 0) {
         if (parentElement === customTocList) { // Only show if top level is empty
             parentElement.innerHTML = '<li>No Table of Contents found.</li>';
         }
        return;
    }

    outline.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = item.title;
        a.href = '#'; // Prevent default link behavior

        // Get destination page index (0-based)
        const destRef = Array.isArray(item.dest) ? item.dest[0] : item.dest;
        
        // Make sure destRef is valid before proceeding
        if (destRef) { 
            // Pass the potentially corrected destRef here
            pdfDoc.getPageIndex(destRef).then(pageIndex => { 
                // Add +2 to potentially compensate for observed off-by-one error
                const targetPageNum = pageIndex + 2; 
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    // Ensure main PDF is loaded before navigating
                    if (currentPdfUrl !== mainPdfUrl) {
                        loadPdfDocument(mainPdfUrl).then(() => {
                            // Need to wait for PDF to load before setting page
                            pdfPageNum = targetPageNum;
                            queueRenderPage(pdfPageNum);
                            // ADDED: Close mobile TOC after navigating
                            closeMobileToc(); 
                        });
                    } else {
                        pdfPageNum = targetPageNum;
                        queueRenderPage(pdfPageNum);
                        // ADDED: Close mobile TOC after navigating
                        closeMobileToc(); 
                    }
                });
            }).catch(err => {
                console.error('Error getting page index for bookmark:', item.title, err);
                // Make the link non-functional if destination fails
                a.classList.add('toc-link-disabled');
                a.title = 'Could not link this item';
            });
        } else {
            // Handle cases where destination might be invalid/null
             console.warn('Invalid destination for bookmark:', item.title);
             a.classList.add('toc-link-disabled');
             a.title = 'Invalid bookmark destination';
        }

        li.appendChild(a);
        parentElement.appendChild(li);

        // Recursively handle nested items
        if (item.items && item.items.length > 0) {
            const sublist = document.createElement('ul');
            li.appendChild(sublist);
            populateCustomToc(item.items, sublist);
        }
    });
}
// --- END Custom TOC Function ---

// --- ADDED: Mobile TOC Helper Functions ---
function openMobileToc() {
    if (tocSidebar && tocOverlay) {
        tocSidebar.classList.add('toc-mobile-visible');
        tocOverlay.classList.add('visible');
    }
}

function closeMobileToc() {
    if (tocSidebar && tocOverlay) {
        tocSidebar.classList.remove('toc-mobile-visible');
        tocOverlay.classList.remove('visible');
    }
}
// --- END ADDITION ---

// --- END PDF.js Rendering Functions ---

function switchLanguage(lang) {
    if (currentLanguage === lang) return; // No change needed

    currentLanguage = lang;

    // Update HTML lang and dir
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

    // Update text content for all translatable elements
    translatableElements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang] && translations[lang][key]) {
            // Special handling for readable placeholder
            if (el === readablePlaceholder && lang === 'ar' && !readableSection.classList.contains('hidden')) {
                 // Don't update placeholder text if Arabic and readable section is active (buttons will show)
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    // Update Reciter dropdown language
    populateReciters(lang);
    // Update Surah dropdown language
    populateSurahs(lang); // Uses quranData internally now

    // Update button active state
    langButtons.forEach(button => {
        if (button.getAttribute('data-lang') === lang) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update readable section display (buttons vs placeholder vs text vs PDF)
    const isReadableActive = !readableSection.classList.contains('hidden');
    if (isReadableActive) {
        if (lang === 'en') {
            setupEnglishReadableView();
        } else { // lang === 'ar'
             // If text was previously shown, go back to selection, else update normally
    if (!surahTextDisplayContainer.classList.contains('hidden')) {
                 showSurahSelectionUI();
    } else {
                 updateReadableSectionVisibility(); // Will call showSurahSelectionUI for Arabic
            }
        }
    } else {
         // If readable section isn't active, just update the placeholder text if visible
        if (!readablePlaceholder.classList.contains('hidden') && translations[lang].readablePlaceholder) {
            readablePlaceholder.textContent = translations[lang].readablePlaceholder;
        }
         if (pdfViewerContainer) pdfViewerContainer.classList.add('hidden'); // Ensure PDF viewer is hidden if section inactive
    }
}

function switchSection(sectionId) {
    // Hide all sections
    contentSections.forEach(section => {
        section.classList.add('hidden');
    });

    // Show the target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.remove('hidden');
    }

    // Update active button state in sidebar
    sidebarNavButtons.forEach(button => {
        if (button.getAttribute('data-section') === sectionId) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update readable section display after switching
    // updateReadableSectionVisibility(); // REMOVED old call

    // ADDED: Conditional update based on language for readable section
    if (sectionId === 'readable-section') {
        if (currentLanguage === 'en') {
            setupEnglishReadableView();
        } else { // lang === 'ar'
            // Show selection UI when switching TO readable section in Arabic
            showSurahSelectionUI(); 
        }
    } else {
        // If switching AWAY from readable section, ensure PDF viewer is hidden
        if (pdfViewerContainer) pdfViewerContainer.classList.add('hidden');
         // Hide other readable elements if needed (handled by existing logic)
    updateReadableSectionVisibility();
    }
    // END ADDITION
}

function skipTime(seconds) {
    if (!audioPlayer.readyState) return; // Don't skip if player not ready

    const newTime = audioPlayer.currentTime + seconds;
    // Clamp the new time between 0 and the duration
    audioPlayer.currentTime = Math.max(0, Math.min(newTime, audioPlayer.duration));
}

// --- Event Listeners ---

reciterSelect.addEventListener('change', updateAudioSource);
surahSelect.addEventListener('change', updateAudioSource);

langButtons.forEach(button => {
    button.addEventListener('click', () => {
        const lang = button.getAttribute('data-lang');
        switchLanguage(lang);
    });
});

// Add listeners for sidebar navigation
sidebarNavButtons.forEach(button => {
    button.addEventListener('click', () => {
        const sectionId = button.getAttribute('data-section');
        switchSection(sectionId);
    });
});

// Add listeners for skip buttons
skipBackwardButton.addEventListener('click', () => {
    skipTime(-10); // Skip back 10 seconds
});

skipForwardButton.addEventListener('click', () => {
    skipTime(10); // Skip forward 10 seconds
});

backToSurahSelectButton.addEventListener('click', () => {
    showSurahSelectionUI();
    // Clear the displayed text and font class
    if (surahTextDisplay) surahTextDisplay.textContent = '';
    if (surahTextDisplayContainer) {
    surahTextDisplayContainer.className = Object.values(rewayahFontMap).reduce((acc, val) => acc.replace(val, ''), surahTextDisplayContainer.className).trim();
    }
    currentSurahOrder = null; // Reset tracker
});

// --- ADDED: Event Listeners for Surah Navigation ---
if (prevSurahButton) {
    prevSurahButton.addEventListener('click', () => {
        if (currentSurahOrder && currentSurahOrder > 1) {
            const prevOrder = currentSurahOrder - 1;
            if (selectedRewayahId) { // Ensure a rewayah is selected
                displaySurahText(selectedRewayahId, prevOrder);
            } else {
                console.error("Cannot navigate: Rewayah not selected.");
            }
        }
    });
}

if (nextSurahButton) {
    nextSurahButton.addEventListener('click', () => {
        if (currentSurahOrder && currentSurahOrder < 114) {
            const nextOrder = currentSurahOrder + 1;
            if (selectedRewayahId) { // Ensure a rewayah is selected
                displaySurahText(selectedRewayahId, nextOrder);
            } else {
                console.error("Cannot navigate: Rewayah not selected.");
            }
        }
    });
}
// --- END ADDITION ---

// --- ADDED: PDF.js Navigation Listeners ---
if (pdfPrevButton) {
    pdfPrevButton.addEventListener('click', onPrevPage);
}
if (pdfNextButton) {
    pdfNextButton.addEventListener('click', onNextPage);
}
if (pdfGoToPageButton) {
    console.log("Attaching listener to Go button"); // DEBUG
    pdfGoToPageButton.addEventListener('click', goToPage);
} else {
    console.warn("Go button not found, listener not attached"); // DEBUG
}
// Add listener for Enter key in the input field
if (pdfPageInput) {
    console.log("Attaching listener to Page input (keypress)"); // DEBUG
    pdfPageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            console.log("Enter key pressed in page input"); // DEBUG
            e.preventDefault(); // Prevent potential form submission
            goToPage();
        }
    });
} else {
    console.warn("Page input not found, keypress listener not attached"); // DEBUG
}

// ADDED: Download Button Listener
if (pdfDownloadButton) {
    console.log("Attaching listener to Download button"); // DEBUG
    pdfDownloadButton.addEventListener('click', handlePdfDownload);
} else {
    console.warn("Download button not found, listener not attached"); // DEBUG
}

// ADDED: Glossary Button Listener
if (glossaryButton) {
    console.log("Attaching listener to Glossary button"); // DEBUG
    glossaryButton.addEventListener('click', () => {
        if (currentPdfUrl !== glossaryPdfUrl) { // Only load if not already viewing
            loadPdfDocument(glossaryPdfUrl);
        }
    });
} else {
    console.warn("Glossary button not found, listener not attached"); // DEBUG
}

// ADDED: TOC Header (Surah List) Listener
if (tocHeader) {
    console.log("Attaching listener to TOC Header (Surah List)"); // DEBUG
    tocHeader.addEventListener('click', () => {
        if (currentPdfUrl !== mainPdfUrl) { // Only load if not already viewing main PDF
            loadPdfDocument(mainPdfUrl);
        }
    });
} else {
    console.warn("TOC Header (Surah List) not found, listener not attached"); // DEBUG
}

// --- ADDED: Mobile TOC Event Listeners ---
if (hamburgerTocButton) {
    hamburgerTocButton.addEventListener('click', () => {
        // Check if sidebar is currently visible
        if (tocSidebar && tocSidebar.classList.contains('toc-mobile-visible')) {
            closeMobileToc();
        } else {
            openMobileToc();
        }
    });
}

if (tocOverlay) {
    tocOverlay.addEventListener('click', closeMobileToc); // Close when clicking overlay
}
// --- END ADDITION ---

// --- Initialization ---

document.addEventListener('DOMContentLoaded', async () => {
    // Set initial lang/dir based on detection *before* populating/setting text
    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'ar' ? 'rtl' : 'ltr';

    // Populate reciters immediately
    populateReciters(currentLanguage);

    // Fetch the SINGLE combined data file
    await fetchQuranData(); // <<< CHANGED: Call the new fetch function

    // Now that data is fetched, populate other elements that depend on it
    // Populate Surahs for audio player select (already called in fetchQuranData callback)
    // Populate Rewayah selector (static for now)
    // populateRewayahSelect(currentLanguage); // Called by showSurahSelectionUI when needed
    
    // Set initial language button state
    langButtons.forEach(button => {
        if (button.getAttribute('data-lang') === currentLanguage) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Ensure initial label text is set correctly
    translatableElements.forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[currentLanguage] && translations[currentLanguage][key]) {
            if (el.id === 'back-to-surah-select') {
                el.textContent = translations[currentLanguage][key];
            } else if (el === readablePlaceholder && currentLanguage === 'ar') {
                // Skip direct text set
            } else {
                el.textContent = translations[currentLanguage][key];
            }
        }
    });

    // Set the initial active section
    const initialActiveButton = document.querySelector('.nav-button.active');
    const initialSectionId = initialActiveButton ? initialActiveButton.getAttribute('data-section') : 'audible-section';
    switchSection(initialSectionId);
}); 

// ADDED: Function to handle Go To Page button click
function goToPage() {
    console.log("goToPage function called"); // DEBUG
    if (!pdfDoc || !pdfPageInput) {
        console.log("goToPage aborted: pdfDoc or pdfPageInput missing"); // DEBUG
        return;
    }
    
    const requestedValue = pdfPageInput.value;
    console.log(`Input value: ${requestedValue}`); // DEBUG
    const requestedPage = parseInt(requestedValue, 10);
    console.log(`Parsed page number: ${requestedPage}`); // DEBUG

    if (
        !isNaN(requestedPage) &&
        requestedPage >= 1 &&
        requestedPage <= pdfDoc.numPages
    ) {
        console.log("Page number is valid"); // DEBUG
        if (requestedPage !== pdfPageNum) {
            console.log(`Requesting page ${requestedPage}`); // DEBUG
            pdfPageNum = requestedPage;
            queueRenderPage(pdfPageNum);
        } else {
            console.log("Requested page is same as current page"); // DEBUG
        }
    } else {
        // Invalid page number
        console.warn(`Invalid page number requested: ${requestedValue}, Total pages: ${pdfDoc.numPages}`); // DEBUG
        pdfPageInput.value = pdfPageNum; // Revert to current page number
    }
}

// ADDED: Function to handle PDF download click
function handlePdfDownload(urlToDownload) {
    if (isDownloadButtonDisabled) {
        console.log("Download button is on cooldown.");
        return;
    }
    
    console.log(`Initiating download for: ${urlToDownload}`);
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = urlToDownload;
    
    // Extract filename or set a default
    const filename = urlToDownload.substring(urlToDownload.lastIndexOf('/') + 1) || "download.pdf";
    link.download = filename; 
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Disable button and set cooldown
    if(pdfDownloadButton) pdfDownloadButton.disabled = true;
    isDownloadButtonDisabled = true;
    console.log(`Download button disabled for ${downloadCooldown / 1000} seconds.`);

    setTimeout(() => {
        if(pdfDownloadButton) pdfDownloadButton.disabled = false;
        isDownloadButtonDisabled = false;
        console.log("Download button re-enabled.");
    }, downloadCooldown);
} 