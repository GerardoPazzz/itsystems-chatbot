const API_URL = '/api/chat';
const API_URL_SAP = '/api/sap/register';

const GUIAS_DRIVE = {
  'S4_MM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_SD_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_PM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_FI_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link',
  'S4_PP_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link'
};

const HINT_MESSAGES = {
  cursos: [
    "¿No sabes qué curso escoger? Pregúntale a nuestro agente de IA y te guiaremos paso a paso.",
    "Descubre el programa SAP ideal para ti. Cuéntanos tu experiencia y recibe una recomendación personalizada.",
    "Resuelve tus dudas sobre temarios, módulos y modalidades al instante. ¡Inicia el chat!"
  ],
  roles: [
    "¿Indeciso sobre tu ruta profesional? Cuéntanos tu perfil y la IA te sugerirá el rol SAP perfecto.",
    "Descubre las diferencias entre consultoría funcional y desarrollo técnico. ¡Pregúntanos!",
    "Conoce las proyecciones laborales de cada especialidad. Escribe tu duda y te orientaremos ahora mismo."
  ],
  registro: [
    "¿Tienes dudas sobre el proceso de registro? Nuestro agente de IA te guiará paso a paso.",
    "Completa tu registro fácilmente. Escribe tu pregunta y te ayudaremos al instante.",
    "Si necesitas ayuda con el formulario, nuestro agente de IA está aquí para asistirte."
  ]
};

function getRandomHintMessage(category) {
  const messages = HINT_MESSAGES[category] || HINT_MESSAGES.cursos;
  return messages[Math.floor(Math.random() * messages.length)];
}

const state = {
  sessionId: '',
  isTyping: false,
  limitReached: false,
  registrationMode: false,
  currentMenu: 'main',
  hasStartedChat: false
};

const welcomeMessage = "";

let COURSES = {};
let PROFILES = {};

async function loadCatalog() {
  try {
    const response = await fetch('/catalogo_cursos.json');
    if (!response.ok) throw new Error('Failed to load catalog');
    
    const data = await response.json();
    
    data.cursos.forEach(curso => {
      COURSES[curso.id] = {
        id: curso.id,
        name: curso.nombre,
        descripcion: curso.descripcion_front,
        shortDesc: curso.descripcion_front,
        modalidad: curso.modalidad,
        segmento: curso.segmento,
        precio: curso.precio.contado,
        precioCuotas: curso.precio.cuotas,
        dirigido: curso.dirigido,
        habilidades: curso.habilidades_adquiridas,
        accesoAula: curso.recursos.acceso_aula_virtual,
        accesoSap: curso.recursos.acceso_sap,
        prerrequisitos: curso.prerrequisitos_recomendados,
        temario: curso.temario
      };
    });
    
    data.perfiles.forEach(perfil => {
      PROFILES[perfil.id] = {
        id: perfil.id,
        name: perfil.nombre,
        descripcion: perfil.descripcion_front,
        shortDesc: perfil.descripcion_front,
        cursosObligatorios: perfil.cursos_obligatorios,
        cursosSugeridos: perfil.cursos_sugeridos,
        rutaSugerida: perfil.ruta_sugerida,
        justificacion: perfil.justificacion_ruta
      };
    });
    
    console.log(`Loaded ${Object.keys(COURSES).length} courses and ${Object.keys(PROFILES).length} profiles`);
  } catch (error) {
    console.error('Error loading catalog:', error);
  }
}

const decisionTree = {
  main: {
    options: [
      { id: 'cursos', label: 'Informacion de cursos' },
      { id: 'roles', label: 'Roles disponibles' },
      { id: 'asesor', label: 'Contactar con un asesor' },
      { id: 'registro', label: 'Quiero registrarme en SAP' }
    ]
  },
  cursos: {
    title: 'Nuestros Cursos SAP',
    response: 'Contamos con cursos tecnicos y funcionales en el ecosistema SAP. Cada curso te prepara para roles especificos en el mercado laboral.'
  },
  roles: {
    title: 'Perfiles Profesionales',
    response: 'Preparamos a nuestros estudiantes para roles de alta demanda en el mercado SAP.'
  },
  registro: {
    title: 'Registro en SAP',
    response: 'La integracion con el sistema de matriculas SAP estara disponible muy pronto. Te notificaremos cuando este lista.'
  }
};

function groupCoursesByName() {
  const grouped = {};
  Object.entries(COURSES).forEach(([id, course]) => {
    const segment = course.segmento || 'OTROS';
    if (!grouped[segment]) {
      grouped[segment] = {};
    }
    if (!grouped[segment][course.name]) {
      grouped[segment][course.name] = [];
    }
    grouped[segment][course.name].push({ id, ...course });
  });
  return grouped;
}

function normalizeProfileName(name) {
  const modalidadMatch = name.match(/\s*(Online|Virtual)\s*$/i);
  const modalidad = modalidadMatch ? modalidadMatch[1].toUpperCase() : 'VIRTUAL';
  const normalizedName = name.replace(/\s*(Online|Virtual)\s*$/i, '').trim();
  return { normalizedName, modalidad };
}

function groupProfilesByName() {
  const grouped = {};
  Object.entries(PROFILES).forEach(([id, profile]) => {
    const { normalizedName, modalidad } = normalizeProfileName(profile.name);
    if (!grouped[normalizedName]) {
      grouped[normalizedName] = [];
    }
    grouped[normalizedName].push({ id, ...profile, modalidad });
  });
  return grouped;
}

const MODALITY_ICONS = {
  'VIRTUAL': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  'ONLINE': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>'
};

function showModalitySubmenu(courseName, variants, isProfile = false) {
  elements.quickActions.innerHTML = '';

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = `${courseName} - Selecciona modalidad`;
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  variants.forEach(variant => {
    const btn = document.createElement('button');
    btn.className = 'sub-btn';
    const modalityKey = (variant.modalidad || 'VIRTUAL').toUpperCase();
    const iconSvg = MODALITY_ICONS[modalityKey] || '';
    btn.innerHTML = `<span class="segment-icon">${iconSvg}</span><span>${variant.modalidad}</span>`;
    btn.addEventListener('click', () => {
      if (isProfile) {
        showProfileDetail(variant.id);
      } else {
        showCourseDetail(variant.id);
      }
    });
    grid.appendChild(btn);
  });

  subMenu.appendChild(grid);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = isProfile ? '&larr; Volver a perfiles' : '&larr; Volver a cursos';
  backBtn.addEventListener('click', () => {
    if (isProfile) {
      renderQuickActions('roles');
    } else {
      renderQuickActions('cursos');
    }
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
}

const elements = {
  messagesContainer: document.getElementById('messages'),
  messageInput: document.getElementById('message-input'),
  sendButton: document.getElementById('send-btn'),
  typingIndicator: document.getElementById('typing-indicator'),
  limitModal: document.getElementById('limit-modal'),
  btnRestart: document.getElementById('btn-restart'),
  btnAdvisor: document.getElementById('btn-advisor'),
  quickActions: document.getElementById('quick-actions'),
  registrationModal: document.getElementById('registration-modal'),
  registrationForm: document.getElementById('registration-form'),
  btnCancelRegistration: document.getElementById('btn-cancel-registration'),
  welcomeScreen: document.getElementById('welcome-screen'),
  welcomeNav: document.querySelector('.welcome-nav'),
  inputArea: document.querySelector('.input-area')
};

async function init() {
  await loadCatalog();

  state.sessionId = crypto.randomUUID();
  state.limitReached = false;
  state.registrationMode = false;
  state.currentMenu = 'main';
  state.hasMessages = false;
  state.hasStartedChat = false;
  console.log('Session ID:', state.sessionId);

  setupNavPills();
  setupEventListeners();
  setupUsernameValidation();
  setupOnboarding();
  updateSendButtonVisibility();
}

function setupEventListeners() {
  elements.sendButton.addEventListener('click', handleSend);
  elements.messageInput.addEventListener('keydown', handleKeyDown);
  elements.messageInput.addEventListener('input', updateSendButtonVisibility);
  elements.btnRestart.addEventListener('click', handleRestart);
  elements.btnAdvisor.addEventListener('click', handleAdvisor);
  elements.registrationForm.addEventListener('submit', handleFormSubmit);
  elements.btnCancelRegistration.addEventListener('click', closeRegistrationModal);

  elements.registrationModal.addEventListener('click', (e) => {
    if (e.target === elements.registrationModal) {
      closeRegistrationModal();
    }
  });

  const hintModal = document.getElementById('onboarding-hint-modal');
  const closeHintBtn = document.getElementById('close-hint-modal');
  if (closeHintBtn && hintModal) {
    closeHintBtn.addEventListener('click', () => {
      hintModal.classList.add('hidden');
      focusToInput();
    });
    hintModal.addEventListener('click', (e) => {
      if (e.target === hintModal) {
        hintModal.classList.add('hidden');
        focusToInput();
      }
    });
  }
}

function setupNavPills() {
  const pills = document.querySelectorAll('.nav-pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      const action = pill.dataset.action;

      if (pill.classList.contains('active')) {
        if (state.hasMessages) {
          pill.classList.remove('active');
          state.currentMenu = 'main';
          elements.quickActions.classList.add('hidden');
          elements.quickActions.innerHTML = '';
        } else {
          resetToZeroState();
        }
        return;
      }

      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      handleNavPillClick(action);
    });
  });
}

function showOnboardingHintModal(category = 'cursos') {
  const hintModal = document.getElementById('onboarding-hint-modal');
  const messageText = document.getElementById('hint-message-text');
  if (hintModal) {
    if (messageText) {
      messageText.textContent = getRandomHintMessage(category);
    }
    hintModal.classList.remove('hidden');
  }
}

function focusToInput() {
  elements.messageInput.focus();
  elements.messageInput.classList.add('input-focused');
  setTimeout(() => {
    elements.messageInput.classList.remove('input-focused');
  }, 1500);
}

function setupOnboarding() {
  const onboardingContainer = document.getElementById('onboarding-container');
  if (!onboardingContainer) return;

  const buttons = onboardingContainer.querySelectorAll('.onboarding-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      handleOnboardingChoice(action);
    });
  });
}

function handleOnboardingChoice(action) {
  state.hasStartedChat = true;

  const onboardingContainer = document.getElementById('onboarding-container');

  if (onboardingContainer) {
    onboardingContainer.style.opacity = '0';
    onboardingContainer.style.transition = 'opacity 0.3s ease';
  }

  setTimeout(() => {
    if (onboardingContainer) {
      onboardingContainer.classList.add('hidden');
    }

    showChatMode();

    const choiceLabels = {
      'registro': 'Iniciar Registro',
      'cursos': 'Explorar Cursos',
      'roles': 'Ver Roles SAP'
    };

    renderMessage(choiceLabels[action] || action, 'user');

    showOnboardingHintModal(action);

    setTimeout(() => {
      switch(action) {
        case 'registro':
          openRegistrationModal();
          break;
        case 'cursos':
          renderQuickActions('cursos');
          break;
        case 'roles':
          renderQuickActions('roles');
          break;
      }
    }, 100);
  }, 300);
}

function handleNavPillClick(action) {
  elements.inputArea.classList.remove('hidden');
  hideWelcomeNav();
  
  switch(action) {
    case 'cursos':
      state.currentMenu = 'cursos';
      renderQuickActions('cursos');
      break;
    case 'roles':
      state.currentMenu = 'roles';
      renderQuickActions('roles');
      break;
    case 'asesor':
      state.currentMenu = 'asesor';
      showAdvisorInfo();
      break;
    case 'registro':
      state.currentMenu = 'registro';
      openRegistrationModal();
      break;
  }
}

function hideWelcome() {
  if (elements.welcomeScreen && !elements.welcomeScreen.classList.contains('hidden')) {
    elements.welcomeScreen.classList.add('hidden');
  }
}

function hideWelcomeNav() {
  if (elements.welcomeNav) {
    elements.welcomeNav.style.display = 'none';
  }
}

function showWelcomeNav() {
  if (elements.welcomeNav) {
    elements.welcomeNav.style.display = '';
  }
}

function showChatMode() {
  if (state.hasMessages) return;
  
  state.hasMessages = true;
  hideWelcome();
  
  elements.messagesContainer.classList.remove('hidden');
  elements.inputArea.classList.remove('hidden');
  
  scrollToBottom();
}

function resetToZeroState() {
  document.getElementById('messages').innerHTML = '';
  document.getElementById('quick-actions').classList.add('hidden');
  document.getElementById('quick-actions').innerHTML = '';
  elements.messageInput.value = '';

  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));

  state.hasMessages = false;
  state.hasStartedChat = false;
  state.registrationMode = false;
  state.currentMenu = 'main';

  if (elements.welcomeScreen) {
    elements.welcomeScreen.classList.remove('hidden');
  }

  const onboardingContainer = document.getElementById('onboarding-container');
  if (onboardingContainer) {
    onboardingContainer.classList.remove('hidden');
    onboardingContainer.style.opacity = '1';
  }

  showWelcomeNav();
  elements.messagesContainer.classList.add('hidden');
  elements.inputArea.classList.add('hidden');
}

function closeSubmenu(showHint = false, category = 'cursos') {
  const pills = document.querySelectorAll('.nav-pill');
  pills.forEach(p => p.classList.remove('active'));
  elements.quickActions.classList.add('hidden');
  elements.quickActions.innerHTML = '';
  state.currentMenu = 'main';
  if (showHint) {
    showOnboardingHintModal(category);
  }
}

function updateSendButtonVisibility() {
  const message = elements.messageInput.value.trim();
  const sendBtn = elements.sendButton;
  
  if (message && !state.isTyping && !state.registrationMode) {
    sendBtn.classList.add('visible');
  } else {
    sendBtn.classList.remove('visible');
  }
}

function showAdvisorInfo() {
  showChatMode();
  
  const whatsappMessage = encodeURIComponent('Hola, tengo una consulta sobre los cursos de SAP. ¿Podrían ayudarme?');
  
  const advisorMessage = `
    <p>¡Con gusto! Aquí tienes los datos para contactar con uno de nuestros asesores:</p>
    <ul>
      <li>Enviar un correo a: <a href="mailto:asesores@itsystems.com" class="message-link">asesores@itsystems.com</a></li>
      <li>WhatsApp: <a href="https://wa.me/51918029215?text=${whatsappMessage}" target="_blank" rel="noopener noreferrer" class="message-link whatsapp-link">+51 918 029 215</a></li>
      <li>Horario: Lunes a Viernes 9:00 AM - 6:00 PM</li>
    </ul>
    <p>Un asesor se comunicará contigo pronto. ¿Hay algo más en lo que pueda ayudarte?</p>
  `;
  renderMessage('Contactar con un asesor', 'user');
  const botMsg = document.createElement('div');
  botMsg.className = 'message bot';
  botMsg.innerHTML = `<div class="message-content">${advisorMessage}</div>`;
  elements.messagesContainer.appendChild(botMsg);
  scrollToBottom();
}



function resetToZeroState() {
  document.getElementById('messages').innerHTML = '';
  document.getElementById('quick-actions').classList.add('hidden');
  document.getElementById('quick-actions').innerHTML = '';
  elements.messageInput.value = '';
  
  document.querySelectorAll('.nav-pill').forEach(p => p.classList.remove('active'));
  
  state.registrationMode = false;
  state.currentMenu = 'main';
}



function handleKeyDown(event) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

const COURSE_SEGMENT_ICONS = {
  'SBO': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>',
  'S4 HANA': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V11l4-2 4 2 4-2v10M9 21v-5h6v5M9 9h.01M15 9h.01M9 13h.01M15 13h.01"/></svg>',
  'ECC': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 13h10"/></svg>',
  'HANA TECNICO': {
    'ABAP': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'ABAP RAP': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
    'SQL': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/></svg>',
    'HANA DATABASE': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5"/><path d="M21 12c0 1.66-4.03 3-9 3s-9-1.34-9-3"/></svg>',
    'BTP': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>',
    'BASIS': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    'FIORI': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>'
  },
  'PRODUCTIVIDAD': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
};

const ROLE_ICONS = {
  'consultor-sbo': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14"/></svg>',
  'consultor-sbo-online': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V7l7-4 7 4v14"/><rect x="14" y="12" width="6" height="5" rx="1"/></svg>',
  'consultor-s4hana': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V11l4-2 4 2 4-2v10"/><rect x="9" y="13" width="6" height="4"/></svg>',
  'consultor-s4hana-online': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M3 21h18M5 21V11l4-2 4 2 4-2v10"/><rect x="14" y="12" width="6" height="5" rx="1"/></svg>',
  'desarrollador-hana-online': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  'desarrollador-hana-virtual': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/><circle cx="18" cy="18" r="3"/></svg>',
  'administrador-hana-online': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5"/></svg>',
  'administrador-hana-virtual': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14c0 1.66-4.03 3-9 3s-9-1.34-9-3V5"/><circle cx="18" cy="18" r="3"/></svg>',
  'consultor-ecc': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2"/><path d="M7 8V6h10v2"/></svg>',
  'consultor-productividad': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06"/></svg>',
  'consultor-productividad-online': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="3"/><path d="M12 8v3"/></svg>',
  'consultor-tecnico-hibrido': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  'consultor-datos-empresariales': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  'consultor-automation-ai': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>'
};

function renderQuickActions(menuKey) {
  elements.quickActions.innerHTML = '';

  if (menuKey === 'main') {
    elements.quickActions.classList.add('hidden');
    return;
  }

  elements.quickActions.classList.remove('hidden');

  const menu = decisionTree[menuKey];
  if (!menu) return;

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = menu.title;
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  if (menuKey === 'cursos') {
    const groupedCourses = groupCoursesByName();
    Object.entries(groupedCourses).forEach(([segment, courses]) => {
      const segmentHeader = document.createElement('div');
      segmentHeader.className = 'segment-header';
      segmentHeader.textContent = segment;
      grid.appendChild(segmentHeader);

      Object.entries(courses).forEach(([name, variants]) => {
        const btn = document.createElement('button');
        btn.className = 'sub-btn';

        let iconSvg = '';
        if (COURSE_SEGMENT_ICONS[segment]) {
          if (typeof COURSE_SEGMENT_ICONS[segment] === 'object') {
            const subSegment = Object.keys(COURSE_SEGMENT_ICONS[segment]).find(key => name.includes(key));
            iconSvg = subSegment ? COURSE_SEGMENT_ICONS[segment][subSegment] : COURSE_SEGMENT_ICONS[segment]['ABAP'];
          } else {
            iconSvg = COURSE_SEGMENT_ICONS[segment];
          }
        }

        btn.innerHTML = `<span class="segment-icon">${iconSvg}</span><span>${name}</span>`;
        if (variants.length === 1) {
          btn.addEventListener('click', () => showCourseDetail(variants[0].id));
        } else {
          btn.addEventListener('click', () => showModalitySubmenu(name, variants, false));
        }
        grid.appendChild(btn);
      });
    });
  } else if (menuKey === 'roles') {
    const groupedProfiles = groupProfilesByName();
    Object.entries(groupedProfiles).forEach(([name, variants]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';

      const profileId = variants[0].id;
      const iconSvg = ROLE_ICONS[profileId] || '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>';

      btn.innerHTML = `<span class="segment-icon">${iconSvg}</span><span>${name}</span>`;
      if (variants.length === 1) {
        btn.addEventListener('click', () => showProfileDetail(variants[0].id));
      } else {
        btn.addEventListener('click', () => showModalitySubmenu(name, variants, true));
      }
      grid.appendChild(btn);
    });
  }

  subMenu.appendChild(grid);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Cerrar';
  backBtn.addEventListener('click', () => {
    if (state.hasMessages) {
      const category = state.currentMenu === 'roles' ? 'roles' : 'cursos';
      closeSubmenu(true, category);
    } else {
      resetToZeroState();
    }
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
  scrollToBottom();
}

function showCourseDetail(courseId) {
  const course = COURSES[courseId];
  if (!course) return;

  hideWelcome();
  closeSubmenu(false);
  renderMessage(course.name, 'user');

  const precioTexto = course.precio !== null ? `S/. ${course.precio.toLocaleString()}` : 'Consultar precio';
  const precioCuotasTexto = course.precioCuotas !== null ? `S/. ${course.precioCuotas.toLocaleString()}` : 'Consultar precio';
  const prerrequisitosTexto = course.prerrequisitos.length > 0
    ? course.prerrequisitos.map(id => COURSES[id]?.name || id).join(', ')
    : 'Ninguno';

  let temarioHtml = '';
  if (course.temario && course.temario.length > 0) {
    const temarioItems = course.temario.map((s, i) => {
      const temaNum = i + 1;
      const tituloCompleto = s.titulo.split('(')[0].trim();
      return `<li style="margin-bottom: 8px; line-height: 1.6;"><span style="color: var(--accent); font-weight: 500;">${temaNum}.</span> <span style="color: var(--text-secondary);">${tituloCompleto}</span></li>`;
    }).join('');
    temarioHtml = `<div style="margin-top: 12px; background: var(--bg-card); border: 1px solid var(--border-subtle); padding: 14px; border-radius: 8px;"><strong style="color: var(--text-secondary); font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 500;">Módulos o temario:</strong><ul style="margin: 8px 0 0 0; padding-left: 16px; list-style: none;">${temarioItems}</ul></div>`;
  } else {
    temarioHtml = `<p style="margin-top: 12px; color: var(--text-secondary);"><strong>Módulos o temario:</strong> <em>(Aún en planificación)</em></p>`;
  }

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${course.name}</strong> [${course.modalidad}]</p>
      <p>${course.descripcion}</p>
      <p><strong>Dirigido a:</strong> ${course.dirigido}</p>
      <p><strong>Habilidades:</strong> ${course.habilidades.slice(0, 3).join(', ')}.</p>
      <p><strong>Precio:</strong> ${precioTexto} (contado) | ${precioCuotasTexto} (cuotas)</p>
      <p><strong>Acceso:</strong> Aula virtual: ${course.accesoAula} | SAP: ${course.accesoSap}</p>
      <p><strong>Prerrequisitos:</strong> ${prerrequisitosTexto}</p>
      ${temarioHtml}
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();
}

function showProfileDetail(profileId) {
  const profile = PROFILES[profileId];
  if (!profile) return;

  hideWelcome();
  closeSubmenu(false);
  renderMessage(profile.name, 'user');

  const rutaNumerada = profile.rutaSugerida.map((id, i) => `${i + 1}. ${COURSES[id]?.name || id}`).join('\n');
  const obligatoriosNombres = profile.cursosObligatorios.map(id => COURSES[id]?.name || id).join(', ');

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${profile.name}</strong></p>
      <p>${profile.descripcion}</p>
      <p><strong>Cursos obligatorios:</strong> ${obligatoriosNombres}</p>
      <p><strong>Ruta sugerida:</strong></p>
      <pre style="margin: 10px 0;">${rutaNumerada}</pre>
      <p><strong>Justificacion:</strong> ${profile.justificacion}</p>
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();
}

function renderRegistrationMenu() {
  elements.quickActions.innerHTML = '';
  elements.quickActions.classList.remove('hidden');

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = 'Registro en SAP';
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  const enterUserBtn = document.createElement('button');
  enterUserBtn.className = 'sub-btn';
  enterUserBtn.textContent = 'Ingresar usuario';
  enterUserBtn.addEventListener('click', () => enableRegistrationMode());
  grid.appendChild(enterUserBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    resetToZeroState();
  });

  subMenu.appendChild(grid);
  subMenu.appendChild(backBtn);
  elements.quickActions.appendChild(subMenu);
}

function enableRegistrationMode() {
  state.registrationMode = true;
  elements.quickActions.classList.add('hidden');
  elements.messageInput.disabled = false;
  elements.sendButton.disabled = false;
  elements.messageInput.placeholder = 'Ingresa tu ID de usuario SAP';
  elements.messageInput.focus();

  renderMessage('Quiero registrarme con mi usuario SAP', 'user');

  const backToMenuBtn = document.createElement('button');
  backToMenuBtn.className = 'llm-mode-back-btn';
  backToMenuBtn.innerHTML = '&larr; Volver al menu de registro';
  backToMenuBtn.addEventListener('click', () => {
    state.registrationMode = false;
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
    elements.messageInput.value = '';
    elements.messageInput.placeholder = 'Escribe tu mensaje...';
    backToMenuBtn.remove();
    renderRegistrationMenu();
  });

  const appContainer = document.querySelector('.app-container');
  appContainer.insertBefore(backToMenuBtn, elements.quickActions);
}

function openRegistrationModal() {
  elements.registrationModal.classList.remove('hidden');
  elements.registrationForm.reset();

  const usernameInput = document.getElementById('reg-sap-usuario');
  const usernameError = document.getElementById('username-error');
  const emailInput = document.getElementById('reg-email');
  const emailError = document.getElementById('email-error');
  const telefonoInput = document.getElementById('reg-telefono');
  const telefonoError = document.getElementById('telefono-error');
  const submitBtn = document.querySelector('#registration-modal .modal-btn.primary');

  const inputs = [usernameInput, emailInput, telefonoInput];
  const errors = [usernameError, emailError, telefonoError];

  inputs.forEach(input => {
    if (input) input.classList.remove('input-error', 'input-valid');
  });
  errors.forEach(error => {
    if (error) error.textContent = '';
  });

  if (submitBtn) submitBtn.disabled = true;
}

function setupUsernameValidation() {
  const usernameInput = document.getElementById('reg-sap-usuario');
  const usernameError = document.getElementById('username-error');
  const emailInput = document.getElementById('reg-email');
  const emailError = document.getElementById('email-error');
  const telefonoInput = document.getElementById('reg-telefono');
  const telefonoError = document.getElementById('telefono-error');
  const submitBtn = document.querySelector('#registration-modal .modal-btn.primary');

  function validateForm() {
    const usernameOk = usernameInput && /^[a-zA-Z0-9]+$/.test(usernameInput.value) && usernameInput.value.length >= 5 && usernameInput.value.length <= 8;
    const emailOk = emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value);
    const telefonoOk = telefonoInput && telefonoInput.value.length >= 9;
    if (submitBtn) {
      submitBtn.disabled = !(usernameOk && emailOk && telefonoOk);
    }
  }

  if (usernameInput) {
    usernameInput.addEventListener('input', function() {
      const value = this.value;
      const length = value.length;
      const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(value);

      if (length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (usernameError) usernameError.textContent = '';
      } else if (length < 5) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Mínimo 5 caracteres';
      } else if (length > 8) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Máximo 8 caracteres';
      } else if (!isAlphanumeric) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Solo letras y números';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (usernameError) usernameError.textContent = '';
      }
      validateForm();
    });
  }

  if (emailInput) {
    emailInput.addEventListener('input', function() {
      const value = this.value;
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

      if (value.length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (emailError) emailError.textContent = '';
      } else if (!isValid) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (emailError) emailError.textContent = 'Ingrese un correo valido';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (emailError) emailError.textContent = '';
      }
      validateForm();
    });
  }

  if (telefonoInput) {
    telefonoInput.addEventListener('input', function() {
      const value = this.value;
      const length = value.length;

      if (length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (telefonoError) telefonoError.textContent = '';
      } else if (length < 9) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (telefonoError) telefonoError.textContent = 'Mínimo 9 dígitos';
      } else {
        this.classList.remove('input-error');
        this.classList.add('input-valid');
        if (telefonoError) telefonoError.textContent = '';
      }
      validateForm();
    });
  }
}

function closeRegistrationModal() {
  elements.registrationModal.classList.add('hidden');
  showOnboardingHintModal('registro');
}

function handleFormSubmit(event) {
  event.preventDefault();

  const submitBtn = document.querySelector('#registration-modal .modal-btn.primary');
  const originalText = submitBtn ? submitBtn.innerHTML : '';

  if (submitBtn) {
    setButtonLoading(submitBtn, true, originalText);
  }

  const formData = new FormData(elements.registrationForm);
  const formDataObj = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  closeRegistrationModal();
  hideWelcome();

  renderMessage('He completado el formulario de registro en SAP', 'user');

  showTyping();

  sendToSAPRegister(formDataObj, submitBtn, originalText);
}

async function sendToSAPRegister(formData, submitBtn, originalText) {
  const sapUsername = formData.sap_username.toLowerCase();
  const roleId = formData.roleId;

  try {
    const response = await fetch(API_URL_SAP, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    hideTyping();

    if (submitBtn) {
      setButtonLoading(submitBtn, false, originalText);
    }

    if (data.success) {
      showToast('Registro guardado con exito', 'success');

      const credentialsBox = `
<div style="background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; margin: 10px 0;">
  <p style="margin: 0 0 8px 0; font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">CREDENCIALES DE ACCESO</p>
  <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 12px; font-size: 0.85rem; line-height: 1.4;">
    <span style="color: var(--text-secondary);">Usuario:</span>
    <strong style="color: var(--text-primary);">${sapUsername}</strong>
    <span style="color: var(--text-secondary);">Contrasena:</span>
    <strong style="color: var(--text-primary);">ITS${sapUsername}</strong>
  </div>
</div>`;

      let accessSection;
      if (data.requiresFiori) {
        accessSection = `
<p style="margin: 10px 0 6px 0; font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">PASOS PARA ACCEDER:</p>
<ol style="margin: 0 0 6px 0; padding-left: 18px; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">
  <li style="margin-bottom: 4px;">Abre el navegador y ve a SAP Fiori</li>
  <li style="margin-bottom: 4px;">Ingresa las credenciales mostradas arriba</li>
</ol>
<p style="margin: 0; padding: 10px 12px; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 8px; font-weight: 600; color: var(--accent); font-size: 0.9rem; text-align: center;">Listo! Ya puedes empezar a practicar</p>
<p style="margin: 10px 0 6px 0; font-weight: 500; color: var(--text-secondary); font-size: 0.85rem;">Acceder a Fiori:</p>
<a href="https://s4hana.sapapp.store/webgui" target="_blank" class="message-link">https://s4hana.sapapp.store/webgui</a>`;
      } else {
        accessSection = `
<p style="margin: 10px 0 6px 0; font-weight: 600; color: var(--text-primary); font-size: 0.85rem;">PASOS PARA ACCEDER:</p>
<ol style="margin: 0 0 6px 0; padding-left: 18px; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">
  <li style="margin-bottom: 4px;">Abre SAP Logon en tu computadora</li>
  <li style="margin-bottom: 4px;">Crea una nueva conexion si no la tienes</li>
  <li style="margin-bottom: 4px;">Usa las credenciales: usuario y contrasena</li>
</ol>
<p style="margin: 0; padding: 10px 12px; background: rgba(37, 99, 235, 0.15); border: 1px solid rgba(37, 99, 235, 0.3); border-radius: 8px; font-weight: 600; color: var(--accent); font-size: 0.9rem; text-align: center;">Listo! Ya puedes empezar a practicar</p>
<p style="margin: 10px 0 6px 0; font-weight: 500; color: var(--text-secondary); font-size: 0.85rem;">Acceder al sistema:</p>
<a href="https://s4hana.itscloud.store/webgui" target="_blank" class="message-link">https://s4hana.itscloud.store/webgui</a>`;
      }

      const guiaDrive = GUIAS_DRIVE[roleId];
      let guiaSection = '';
      if (guiaDrive) {
        guiaSection = `
<div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
  <p style="margin: 0 0 6px 0; font-weight: 500; color: var(--text-secondary); font-size: 0.85rem;">Descarga la guia de instalacion:</p>
  <a href="${guiaDrive}" target="_blank" class="message-link">[ Ver Guia en Drive ]</a>
</div>`;
      }

      const successMessage = `
<p style="margin: 0 0 6px 0; font-weight: 600; color: var(--text-primary); font-size: 0.9rem;">Registro exitoso! Tu cuenta ha sido creada.</p>
${credentialsBox}
${accessSection}
${guiaSection}`;

      renderMessage(successMessage, 'bot');
    } else {
      showToast(data.error || 'Error al procesar la solicitud', 'error');
      renderMessage(data.error || 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
    }

  } catch (error) {
    hideTyping();

    if (submitBtn) {
      setButtonLoading(submitBtn, false, originalText);
    }

    showToast('Error al conectar con el servidor', 'error');
    renderMessage('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
  }
}

async function handleSend() {
  const message = elements.messageInput.value.trim();

  if (!message || state.isTyping || state.limitReached) {
    return;
  }

  if (state.registrationMode) {
    clearInput();
    updateSendButtonVisibility();
    await sendToSAPRegister(message);
    return;
  }

  const sendBtn = elements.sendButton;
  const originalContent = sendBtn.innerHTML;
  sendBtn.innerHTML = '<span class="btn-spinner"></span>';
  sendBtn.classList.add('btn-loading');

  clearInput();
  renderMessage(message, 'user');
  showTyping();

  try {
    const response = await sendToAPI(message);
    hideTyping();
    renderMessage(response.reply, 'bot');

    if (response.limitReached) {
      state.limitReached = true;
      showLimitModal();
    }
  } catch (error) {
    hideTyping();
    showToast('Error al conectar con el servidor', 'error');
    renderMessage(`Error de conexion con el servidor. Asegurate de que el backend este corriendo en puerto 3000. Detalle: ${error.message}`, 'bot', false, true);
  }

  sendBtn.innerHTML = originalContent;
  sendBtn.classList.remove('btn-loading');
  updateSendButtonVisibility();
  scrollToBottom();
  elements.messageInput.focus();
}

async function sendToAPI(message) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId: state.sessionId,
      message: message
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function formatMessage(text) {
  let formatted = text;

  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

  formatted = formatted.replace(/^(\d+)\.\s+(.+)$/gm, '<li>$2</li>');
  formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ol>$1</ol>');

  formatted = formatted.replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>');
  const hasBulletList = /<li>.*<\/li>/.test(formatted);
  if (hasBulletList && !formatted.includes('<ol>')) {
    formatted = formatted.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  }

  const urlPattern = /https?:\/\/[^\s<"]+/g;
  formatted = formatted.replace(urlPattern, function(url) {
    if (formatted.includes('href="' + url + '"')) {
      return url;
    }
    return '<a href="' + url + '" target="_blank" class="message-link">' + url + '</a>';
  });

  formatted = formatted.replace(/\n\n/g, '</p><p>');
  formatted = formatted.replace(/\n/g, '<br>');

  if (!formatted.startsWith('<')) {
    formatted = '<p>' + formatted + '</p>';
  }

  return formatted;
}

function renderMessage(text, sender, isWelcome = false, isError = false) {
  showChatMode();
  
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);

  if (isWelcome) {
    messageDiv.classList.add('welcome');
  }

  if (isError) {
    messageDiv.classList.add('error');
  }

  const contentDiv = document.createElement('div');
  contentDiv.classList.add('message-content');

  if (isError) {
    contentDiv.innerHTML = `<strong>Error:</strong> ${text}`;
  } else {
    contentDiv.innerHTML = formatMessage(text);
  }

  messageDiv.appendChild(contentDiv);
  elements.messagesContainer.appendChild(messageDiv);

  scrollToBottom();
}

function showTyping() {
  state.isTyping = true;
  elements.typingIndicator.classList.remove('hidden');
  updateSendButtonVisibility();
  scrollToBottom();
}

function hideTyping() {
  state.isTyping = false;
  elements.typingIndicator.classList.add('hidden');
  updateSendButtonVisibility();
}

function showLimitModal() {
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  elements.limitModal.classList.remove('hidden');
}

function hideLimitModal() {
  elements.limitModal.classList.add('hidden');
}

function handleRestart() {
  state.sessionId = crypto.randomUUID();
  state.limitReached = false;
  console.log('New Session ID:', state.sessionId);

  resetToZeroState();
  hideLimitModal();
}

function handleAdvisor() {
  alert('Pronto podras comunicarte con un asesor de ITSYSTEMS. Gracias por tu paciencia.');
}

function clearInput() {
  elements.messageInput.value = '';
}

function scrollToBottom() {
  const anchor = document.getElementById('chat-bottom-anchor');
  if (anchor) {
    anchor.scrollIntoView({ behavior: 'smooth' });
  }
}

function showToast(message, type = 'success', duration = 4000) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const successIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  const errorIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
  const closeIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  const icon = type === 'success' ? successIcon : errorIcon;

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
    <button class="toast-close" onclick="this.parentElement.remove()">${closeIcon}</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

function showLoadingSkeleton() {
  return `
    <div class="message bot">
      <div class="skeleton-content">
        <div class="skeleton-line full"></div>
        <div class="skeleton-line medium"></div>
        <div class="skeleton-line short"></div>
      </div>
    </div>
  `;
}

function setButtonLoading(button, isLoading, originalText) {
  if (isLoading) {
    button.innerHTML = '<span class="btn-spinner"></span>';
    button.classList.add('btn-loading');
    button.disabled = true;
  } else {
    button.innerHTML = originalText;
    button.classList.remove('btn-loading');
    button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', init);
