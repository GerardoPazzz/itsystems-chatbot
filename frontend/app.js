const API_URL = '/api/chat';
const API_URL_SAP = '/api/sap/register';

const GUIAS_DRIVE = {
  'S4_MM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_SD_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_PM_DEMO': 'https://drive.google.com/drive/folders/1xgecegsDtRC3bvNT0tUmmL9lkz4Verfd?usp=drive_link',
  'S4_FI_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link',
  'S4_PP_DEMO': 'https://drive.google.com/drive/folders/14I4jF5w6TinY5Or_gK4haDuq_zpTWXde?usp=drive_link'
};

const SPEECH_LANG = 'es-ES';
const SILENCE_TIMEOUT_MS = 3000;

class VoiceRecognition {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    this.silenceTimer = null;
    this.finalTranscript = '';
    this.onResultCallback = null;
    this.onEndCallback = null;

    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = SPEECH_LANG;
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    }
  }

  start(onResult, onError, onEnd) {
    if (!this.isSupported || this.isListening) return false;

    this.finalTranscript = '';
    this.onResultCallback = onResult;
    this.onEndCallback = onEnd;

    try {
      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        const isFinal = event.results[event.results.length - 1][0].isFinal;

        if (isFinal) {
          this.finalTranscript += (this.finalTranscript ? ' ' : '') + transcript;
          this.onResultCallback(this.finalTranscript, true);
        } else {
          this.onResultCallback(transcript, false);
        }

        this.resetSilenceTimer();
      };

      this.recognition.onerror = (event) => {
        this.clearSilenceTimer();
        if (event.error !== 'aborted') {
          onError(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.clearSilenceTimer();
        onEnd();
      };

      this.recognition.onspeechend = () => {
        this.resetSilenceTimer();
      };

      this.recognition.start();
      this.isListening = true;
      this.startSilenceTimer();
      return true;
    } catch (e) {
      onError(e.message);
      return false;
    }
  }

  stop() {
    this.clearSilenceTimer();
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  startSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.isListening) {
        this.stop();
      }
    }, SILENCE_TIMEOUT_MS);
  }

  resetSilenceTimer() {
    this.startSilenceTimer();
  }

  clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }
}

const voiceRecognition = new VoiceRecognition();

const state = {
  sessionId: '',
  isTyping: false,
  limitReached: false,
  registrationMode: false,
  currentMenu: 'main'
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
    if (!grouped[course.name]) {
      grouped[course.name] = [];
    }
    grouped[course.name].push({ id, ...course });
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
    if (isProfile) {
      btn.textContent = variant.modalidad || 'VIRTUAL';
    } else {
      btn.textContent = variant.modalidad;
    }
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
  voiceButton: document.getElementById('voice-btn'),
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
  console.log('Session ID:', state.sessionId);

  setupNavPills();
  setupEventListeners();
  setupUsernameValidation();
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

  if (voiceRecognition.isSupported) {
    elements.voiceButton.addEventListener('click', handleVoiceButton);
  } else {
    elements.voiceButton.style.display = 'none';
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
  state.registrationMode = false;
  state.currentMenu = 'main';
  
  if (elements.welcomeScreen) {
    elements.welcomeScreen.classList.remove('hidden');
  }
  showWelcomeNav();
  elements.messagesContainer.classList.add('hidden');
  elements.inputArea.classList.add('hidden');
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
  
  const advisorMessage = `
    <p>Para contactar con un asesor humano, puedes:</p>
    <ul>
      <li>Enviar un correo a: <a href="mailto:asesores@itsystems.com" class="message-link">asesores@itsystems.com</a></li>
      <li>Llamar al: +51 999 888 777</li>
      <li>Horario de atencion: Lunes a Viernes 9:00 AM - 6:00 PM</li>
    </ul>
    <p>Un asesor se comunicara contigo pronto. ┬┐Hay algo mas en lo que pueda ayudarte?</p>
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
    Object.entries(groupedCourses).forEach(([name, variants]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = name;
      if (variants.length === 1) {
        btn.addEventListener('click', () => showCourseDetail(variants[0].id));
      } else {
        btn.addEventListener('click', () => showModalitySubmenu(name, variants, false));
      }
      grid.appendChild(btn);
    });
  } else if (menuKey === 'roles') {
    const groupedProfiles = groupProfilesByName();
    Object.entries(groupedProfiles).forEach(([name, variants]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = name;
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
    const pills = document.querySelectorAll('.nav-pill');
    pills.forEach(p => p.classList.remove('active'));
    elements.quickActions.classList.add('hidden');
    elements.quickActions.innerHTML = '';
    
    if (state.hasMessages) {
      state.currentMenu = 'main';
    } else {
      resetToZeroState();
    }
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
}

function showCourseDetail(courseId) {
  const course = COURSES[courseId];
  if (!course) return;

  hideWelcome();
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
      let resumen = s.titulo.split('(')[0].trim();
      resumen = resumen.length > 45 ? resumen.substring(0, 42) + '...' : resumen;
      return `<li style="margin-bottom: 6px;"><span style="color: var(--accent-hover); font-weight: 500;">${temaNum}.</span> ${resumen}</li>`;
    }).join('');
    temarioHtml = `<div style="margin-top: 12px; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); padding: 12px; border-radius: 8px;"><strong style="color: var(--text-secondary); font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em;">M├│dulos o temario:</strong><ul style="margin: 8px 0 0 0; padding-left: 16px; list-style: none; color: var(--text-primary);">${temarioItems}</ul></div>`;
  } else {
    temarioHtml = `<p style="margin-top: 10px;"><strong>M├│dulos o temario:</strong> <em>(A├║n en planeaci├│n)</em></p>`;
  }

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${course.name}</strong> [${course.modalidad}]</p>
      <p>${course.descripcion}</p>
      <p><strong>Dirigido a:</strong> ${course.dirigido}</p>
      <p><strong>Habilidades:</strong> ${course.habilidades.slice(0, 3).join(', ')}...</p>
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

function showBackOnlyMenu(parentMenu) {
  elements.quickActions.innerHTML = '';
  elements.quickActions.classList.remove('hidden');

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    resetToZeroState();
  });
  elements.quickActions.appendChild(backBtn);
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
    const usernameOk = usernameInput && usernameInput.value.length >= 5 && usernameInput.value.length <= 8;
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

      if (length === 0) {
        this.classList.remove('input-error', 'input-valid');
        if (usernameError) usernameError.textContent = '';
      } else if (length < 5) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'M├¡nimo 5 caracteres';
      } else if (length > 8) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'M├íximo 8 caracteres';
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
        if (telefonoError) telefonoError.textContent = 'M├¡nimo 9 d├¡gitos';
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
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.registrationForm);
  const formDataObj = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  closeRegistrationModal();
  hideWelcome();

  renderMessage('He completado el formulario de registro en SAP', 'user');

  showTyping();

  sendToSAPRegister(formDataObj);
}

async function sendToSAPRegister(formData) {
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

    if (data.success) {
      let successMessage;
      if (data.requiresFiori) {
        successMessage = `┬íRegistro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contrase├▒a</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contrase├▒a:</strong> ITS${sapUsername}</li>
</ul>

<strong>Como alternativa, puedes acceder desde Fiori:</strong>
<a href="https://s4hana.sapapp.store/webgui" target="_blank" class="message-link">https://s4hana.sapapp.store/webgui</a>`;
      } else {
        successMessage = `┬íRegistro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contrase├▒a</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contrase├▒a:</strong> ITS${sapUsername}</li>
</ul>

<strong>Accede desde:</strong>
<a href="https://s4hana.itscloud.store/webgui" target="_blank" class="message-link">https://s4hana.itscloud.store/webgui</a>`;
      }

      const guiaDrive = GUIAS_DRIVE[roleId];
      if (guiaDrive) {
        successMessage += `
<br>
<strong>Descarga la gu├¡a de instalaci├│n:</strong>
<a href="${guiaDrive}" target="_blank" class="message-link">­ƒôÑ Ver Gu├¡a en Drive</a>`;
      }

      renderMessage(successMessage, 'bot');
    } else {
      renderMessage(data.error || 'Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
    }

    showBackOnlyMenu('registro');
  } catch (error) {
    hideTyping();
    renderMessage('Ocurrio un error al procesar tu solicitud. Por favor intenta nuevamente o contacta a un asesor.', 'bot');
    showBackOnlyMenu('registro');
  }
}

function handleVoiceButton() {
  if (voiceRecognition.isListening) {
    voiceRecognition.stop();
    setVoiceButtonState('inactive');
  } else {
    setVoiceButtonState('listening');
    elements.messageInput.value = '';
    elements.messageInput.focus();

    voiceRecognition.start(
      (transcript, isFinal) => {
        console.log('Voice result:', { transcript, isFinal });
        elements.messageInput.value = transcript;
      },
      (error) => {
        console.error('Voice recognition error:', error);
        setVoiceButtonState('inactive');
        if (error === 'network') {
          alert('Error de red. Verifica tu conexion a internet e intenta nuevamente.');
        } else if (error === 'not-allowed') {
          alert('Se requiere acceso al microfono para usar voz. Por favor permite el acceso en tu navegador.');
        }
      },
      () => {
        setVoiceButtonState('inactive');
      }
    );
  }
}

function setVoiceButtonState(state) {
  const voiceBtn = elements.voiceButton;
  const micIcon = voiceBtn.querySelector('.mic-icon');
  const spinner = voiceBtn.querySelector('.mic-spinner');

  voiceBtn.classList.remove('listening', 'processing');

  switch (state) {
    case 'listening':
      voiceBtn.classList.add('listening');
      micIcon.classList.remove('hidden');
      spinner.classList.add('hidden');
      break;
    case 'processing':
      voiceBtn.classList.add('processing');
      micIcon.classList.add('hidden');
      spinner.classList.remove('hidden');
      break;
    case 'inactive':
    default:
      micIcon.classList.remove('hidden');
      spinner.classList.add('hidden');
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

  clearInput();
  updateSendButtonVisibility();
  renderMessage(message, 'user');
  showTyping();

  try {
    const response = await sendToAPI(message);
    hideTyping();
    renderMessage(response.reply, 'bot');
    updateSendButtonVisibility();

    if (response.limitReached) {
      state.limitReached = true;
      showLimitModal();
    }
  } catch (error) {
    hideTyping();
    renderMessage(`Error de conexion con el servidor. Asegurate de que el backend este corriendo en puerto 3000. Detalle: ${error.message}`, 'bot', false, true);
    updateSendButtonVisibility();
  }

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
  elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
}

document.addEventListener('DOMContentLoaded', init);
