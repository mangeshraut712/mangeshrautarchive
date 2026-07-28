/**
 * Blessing Media Modal Module
 * Lyrics card (Listen + Translate) + Play on YouTube — no embedded player.
 */

const BLESSING_CONFIG = {
  ganesh: {
    title: 'Shree Ganapati Aarti',
    subtitle: 'Sukhkarta Dukhharta · Shendur Lal Chadhayo',
    watchUrl: 'https://www.youtube.com/watch?v=w0W8Wh-8UCg',
    badge: 'Ganapati Bappa Morya',
    image: {
      fallback: 'assets/images/ganesh.png',
      srcset: 'assets/images/ganesh.webp 1x, assets/images/ganesh-desktop.webp 2x',
    },
    lyrics: [
      'सुखकर्ता दुखहर्ता वार्ता विघ्नाची।',
      'दुर्गी पूर्वी प्रेम कृपा जयाची॥',
      'सर्वांगी सुंदर उटी शेंदुराची।',
      'कंठी झळके माळ मोत्यांची॥',
      'जय देव जय देव जय मंगलमूर्ती।',
      'दर्शनमात्रे मन कामना पूर्ती॥',
      'रत्नखचित फरा तुज गौरीकुमरा।',
      'चंदनाची उटी कुमकुम केशरा॥',
      'हीरे जडित मुकुट शोभतो बरा।',
      'रुणझुणती नूपुरे चरणी घागरिया॥',
      'जय देव जय देव जय मंगलमूर्ती।',
      'दर्शनमात्रे मन कामना पूर्ती॥',
      'लंबोदर पीतांबर फणिवरबंधना।',
      'सरल सोंड वक्रतुंड त्रिनयना॥',
      'दास रामाचा वाट पाहे सदना।',
      'संकटी पावावे निर्वाणी रक्षावे सुरवरवंदना॥',
      'जय देव जय देव जय मंगलमूर्ती।',
      'दर्शनमात्रे मन कामना पूर्ती॥',
      'शेंदूर लाल चढायो अच्छा गजमुखको।',
      'दोंदिल लाल बिराजे सुत गौरिहरको॥',
      'हाथ लिए गुडलड्डू साईं सुरवरको।',
      'महिमा कहत सदा अग्रगण्य पदको॥',
      'जय देव जय देव जय मंगलमूर्ती।',
      'दर्शनमात्रे मन कामना पूर्ती॥',
    ],
  },
  hanuman: {
    title: 'Shree Hanuman Chalisa',
    subtitle: 'Gulshan Kumar · Hariharan · T-Series',
    watchUrl: 'https://www.youtube.com/watch?v=AETFvQonfV8',
    badge: 'Jai Bajrangbali',
    image: {
      fallback: 'assets/images/hanuman.png',
      srcset: 'assets/images/hanuman.webp 1x, assets/images/hanuman-desktop.webp 2x',
    },
    lyrics: [
      'श्रीगुरु चरन सरोज रज निज मनु मुकुरु सुधारि।',
      'बरनउँ रघुबर बिमल जसु जो दायकु फल चारि॥',
      'बुद्धिहीन तनु जानिके सुमिरौं पवन-कुमार।',
      'बल बुधि बिद्या देहु मोहिं हरहु कलेस बिकार॥',
      'जय हनुमान ज्ञान गुन सागर। जय कपीस तिहुँ लोक उजागर॥',
      'राम दूत अतुलित बल धामा। अंजनि-पुत्र पवनसुत नामा॥',
      'महाबीर बिक्रम बजरंगी। कुमति निवार सुमति के संगी॥',
      'कंचन बरन बिराज सुबेसा। कानन कुंडल कुंचित केसा॥',
      'हाथ बज्र औ ध्वजा बिराजै। काँधे मूँज जनेउ साजै॥',
      'शंकर सुवन केसरी नंदन। तेज प्रताप महा जग बंदन॥',
      'बिद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥',
      'प्रभु चरित्र सुनिबे को रसिया। राम लखन सीता मन बसिया॥',
      'सूक्ष्म रूप धरि सियहिं दिखावा। बिकट रूप धरि लंक जरावा॥',
      'भीम रूप धरि असुर संहारे। रामचंद्र के काज संवारे॥',
      'लाय सजीवन लखन जियाये। श्रीरघुबीर हरषि उर लाये॥',
      'रघुपति कीन्ही बहुत बड़ाई। तुम मम प्रिय भरतहि सम भाई॥',
      'सहस बदन तुम्हरो जस गावैं। अस कहि श्रीपति कंठ लगावैं॥',
      'सनकादिक ब्रह्मादि मुनीसा। नारद सारद सहित अहीसा॥',
      'जम कुबेर दिगपाल जहाँ ते। कबि कोबिद कहि सके कहाँ ते॥',
      'तुम उपकार सुग्रीवहिं कीन्हा। राम मिलाय राज पद दीन्हा॥',
      'तुम्हरो मंत्र बिभीषन माना। लंकेश्वर भए सब जग जाना॥',
      'जुग सहस्र जोजन पर भानू। लील्यो ताहि मधुर फल जानू॥',
      'प्रभु मुद्रिका मेलि मुख माहीं। जलधि लाँघि गये अचरज नाहीं॥',
      'दुर्गम काज जगत के जेते। सुगम अनुग्रह तुम्हरे तेते॥',
      'राम दुआरे तुम रखवारे। होत न आज्ञा बिनु पैसारे॥',
      'सब सुख लहै तुम्हारी सरना। तुम रक्षक काहू को डरना॥',
      'आपन तेज सम्हारो आपै। तीनों लोक हाँक तें काँपै॥',
      'भूत पिसाच निकट नहिं आवै। महाबीर जब नाम सुनावै॥',
      'नासै रोग हरै सब पीरा। जपत निरंतर हनुमत बीरा॥',
      'संकट तें हनुमान छुड़ावै। मन क्रम बचन ध्यान जो लावै॥',
      'सब पर राम तपस्वी राजा। तिन के काज सकल तुम साजा॥',
      'और मनोरथ जो कोई लावै। सोइ अमित जीवन फल पावै॥',
      'चारों जुग परताप तुम्हारा। है परसिद्ध जगत उजियारा॥',
      'साधु संत के तुम रखवारे। असुर निकंदन राम दुलारे॥',
      'अष्टसिद्धि नौ निधि के दाता। अस बर दीन्ह जानकी माता॥',
      'राम रसायन तुम्हरे पासा। सदा रहो रघुपति के दासा॥',
      'तुम्हरे भजन राम को पावै। जनम जनम के दुख बिसरावै॥',
      'अंत काल रघुबर पुर जाई। जहाँ जन्म हरिभक्त कहाई॥',
      'और देवता चित्त न धरई। हनुमत सेइ सर्ब सुख करई॥',
      'संकट कटै मिटै सब पीरा। जो सुमिरै हनुमत बलबीरा॥',
      'जय जय जय हनुमान गोसाईं। कृपा करहु गुरुदेव की नाईं॥',
      'जो सत बार पाठ कर कोई। छूटहि बंदि महा सुख होई॥',
      'जो यह पढ़ै हनुमान चालीसा। होय सिद्धि साखी गौरीसा॥',
      'तुलसीदास सदा हरि चेरा। कीजै नाथ हृदय महँ डेरा॥',
      'पवनतनय संकट हरन मंगल मूरति रूप।',
      'राम लखन सीता सहित हृदय बसहु सुर भूप॥',
    ],
  },
};

let activeModalEl = null;
let activeKeyHandler = null;
let closeTimerId = null;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stopSpeechIfNeeded() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function removeActiveModalImmediately() {
  if (closeTimerId) {
    clearTimeout(closeTimerId);
    closeTimerId = null;
  }
  if (activeKeyHandler) {
    document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  stopSpeechIfNeeded();

  document.querySelectorAll('.blessing-modal-overlay').forEach(el => el.remove());

  activeModalEl = null;
  document.body.style.overflow = '';
}

function renderLyrics(lines) {
  return lines
    .map(line => `<p class="blessing-lyric-line highlight-target">${escapeHtml(line)}</p>`)
    .join('');
}

export function initBlessingMediaModal() {
  if (typeof document === 'undefined' || document._blessingMediaModalInitialized) return;
  document._blessingMediaModalInitialized = true;

  document.addEventListener('click', e => {
    const trigger = e.target.closest('.blessing-avatar-trigger');
    if (!trigger) return;

    const key = trigger.dataset.blessing;
    if (key && BLESSING_CONFIG[key]) {
      e.preventDefault();
      openBlessingModal(key);
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.blessing-avatar-trigger');
    if (!trigger) return;

    const key = trigger.dataset.blessing;
    if (key && BLESSING_CONFIG[key]) {
      e.preventDefault();
      openBlessingModal(key);
    }
  });
}

export function openBlessingModal(key) {
  const config = BLESSING_CONFIG[key];
  if (!config) return;

  removeActiveModalImmediately();

  const overlay = document.createElement('div');
  overlay.className = 'blessing-modal-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', config.title);

  overlay.innerHTML = `
    <div class="blessing-modal-card">
      <div class="blessing-modal-header">
        <div class="blessing-modal-title-wrap">
          <span class="blessing-badge">${escapeHtml(config.badge)}</span>
          <h3 class="blessing-modal-title">${escapeHtml(config.title)}</h3>
          <p class="blessing-modal-subtitle">${escapeHtml(config.subtitle)}</p>
        </div>
        <button type="button" class="blessing-modal-close" aria-label="Close">
          <i class="fas fa-times" aria-hidden="true"></i>
        </button>
      </div>

      <div class="blessing-modal-body">
        <div class="blessing-player-visualizer">
          <img
            src="${escapeHtml(config.image.fallback)}"
            srcset="${escapeHtml(config.image.srcset)}"
            sizes="64px"
            width="64"
            height="64"
            alt=""
            class="blessing-player-avatar"
            loading="eager"
            decoding="async"
          >
          <div class="blessing-player-info">
            <p class="blessing-player-tag">Devotional lyrics</p>
            <h4 class="blessing-player-track-title">${escapeHtml(config.title)}</h4>
            <p class="blessing-player-track-sub">${escapeHtml(config.subtitle)}</p>
          </div>
        </div>

        <article class="blessing-lyrics-card">
          <div class="blessing-lyrics-header">
            <h4 class="blessing-lyrics-title">Lyrics</h4>
          </div>
          <div class="blessing-lyrics-body" lang="hi">
            ${renderLyrics(config.lyrics)}
          </div>
        </article>
      </div>

      <div class="blessing-modal-footer">
        <a href="${escapeHtml(config.watchUrl)}" target="_blank" rel="noopener noreferrer" class="blessing-modal-yt-btn">
          <i class="fab fa-youtube" aria-hidden="true"></i>
          <span>Play on YouTube</span>
        </a>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  activeModalEl = overlay;
  document.body.style.overflow = 'hidden';

  import('./card-content-accessibility.js')
    .then(({ rescanCardContentAccessibility }) => {
      rescanCardContentAccessibility(overlay);
    })
    .catch(() => {});

  requestAnimationFrame(() => {
    overlay.classList.add('is-visible');
  });

  const closeBtn = overlay.querySelector('.blessing-modal-close');
  const handleClose = () => closeBlessingModal();

  closeBtn?.addEventListener('click', handleClose);
  overlay.addEventListener('click', e => {
    if (e.target === overlay) handleClose();
  });

  const handleKeyDown = e => {
    if (e.key === 'Escape') handleClose();
  };
  activeKeyHandler = handleKeyDown;
  document.addEventListener('keydown', handleKeyDown);
  closeBtn?.focus({ preventScroll: true });
}

export function closeBlessingModal() {
  if (!activeModalEl) {
    removeActiveModalImmediately();
    return;
  }

  const current = activeModalEl;
  activeModalEl = null;
  current.classList.remove('is-visible');
  stopSpeechIfNeeded();

  if (activeKeyHandler) {
    document.removeEventListener('keydown', activeKeyHandler);
    activeKeyHandler = null;
  }

  if (closeTimerId) clearTimeout(closeTimerId);
  closeTimerId = setTimeout(() => {
    current.remove();
    closeTimerId = null;
    if (!activeModalEl) document.body.style.overflow = '';
  }, 220);
}

if (typeof window !== 'undefined') {
  window.openBlessingModal = openBlessingModal;
  window.closeBlessingModal = closeBlessingModal;
}

initBlessingMediaModal();
