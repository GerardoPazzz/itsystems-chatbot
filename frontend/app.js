const API_URL = 'http://localhost:3000/api/chat';
const API_URL_SAP = 'http://localhost:3000/api/sap/register';

const state = {
  sessionId: '',
  isTyping: false,
  limitReached: false,
  llmModeEnabled: false,
  registrationMode: false,
  currentMenu: 'main'
};

const welcomeMessage = "Buenos dias! Soy el Asesor Academico Virtual de ITSYSTEMS. Cuentame, cual es tu objetivo profesional o area de interes en tecnologia? Para comenzar, puedo mostrarte nuestros perfiles disponibles: Consultor Funcional SAP, Desarrollador SAP, o Desarrollador SAP Cloud.";

const COURSES = {
  'sap-fi': {
    name: 'SAP FI - Financial Accounting',
    shortDesc: 'Contabilidad Financiera en SAP. Gestion financiera, libros contables, cuentas por pagar/recibir, conciliacion bancaria y reportes.',
    duration: '40 horas',
    level: 'Intermedio',
    certification: 'SAP Certified Application Associate - SAP S/4HANA Financial Accounting'
  },
  'sap-mm': {
    name: 'SAP MM - Material Management',
    shortDesc: 'Gestion de Materiales en SAP. Cadena de suministro, inventarios, compras, proveedores y planificacion MRP.',
    duration: '35 horas',
    level: 'Intermedio',
    certification: 'SAP Certified Application Associate - SAP S/4HANA Material Management'
  },
  'sap-sd': {
    name: 'SAP SD - Sales and Distribution',
    shortDesc: 'Ventas y Distribucion en SAP. Proceso de ventas completo desde cotizacion hasta entrega y facturacion.',
    duration: '35 horas',
    level: 'Intermedio',
    certification: 'SAP Certified Application Associate - SAP S/4HANA Sales and Distribution'
  },
  'sap-abap': {
    name: 'Programacion SAP ABAP',
    shortDesc: 'Desarrollo ABAP. Reportes, interfaces, enhancements y extensiones en el ecosistema SAP.',
    duration: '45 horas',
    level: 'Avanzado',
    certification: 'SAP Certified Development Specialist - ABAP for SAP S/4HANA'
  },
  'sap-cap': {
    name: 'SAP Cloud Application Programming',
    shortDesc: 'Desarrollo cloud nativo con CAP. Aplicaciones empresariales en SAP BTP usando Node.js y CDS.',
    duration: '30 horas',
    level: 'Avanzado',
    certification: 'SAP Certified Development Associate - SAP Cloud Application Programming'
  }
};

const PROFILES = {
  'consultor-funcional': {
    name: 'Consultor Funcional SAP',
    shortDesc: 'Especializado en configuracion y optimizacion de procesos de negocio en SAP. Combina aspectos tecnicos y funcionales.',
    courses: ['sap-fi', 'sap-mm', 'sap-sd']
  },
  'desarrollador': {
    name: 'Desarrollador SAP',
    shortDesc: 'Especializado en programacion ABAP para extender y personalizar el sistema SAP.',
    courses: ['sap-abap']
  },
  'desarrollador-cloud': {
    name: 'Desarrollador SAP Cloud',
    shortDesc: 'Desarrolla aplicaciones cloud-native usando SAP CAP y tecnologias modernas.',
    courses: ['sap-cap']
  },
  'consultor-tecnico': {
    name: 'Consultor Tecnico Integral',
    shortDesc: 'Perfil hibrido con capacidades funcionales y de desarrollo. Entrega soluciones completas.',
    courses: ['sap-fi', 'sap-abap']
  }
};

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
  btnCancelRegistration: document.getElementById('btn-cancel-registration')
};

function init() {
  state.sessionId = crypto.randomUUID();
  state.limitReached = false;
  state.llmModeEnabled = false;
  state.registrationMode = false;
  state.currentMenu = 'main';
  console.log('Session ID:', state.sessionId);

  renderMessage(welcomeMessage, 'bot', true);
  renderQuickActions('main');
  setupEventListeners();
  setupUsernameValidation();
}

function setupEventListeners() {
  elements.sendButton.addEventListener('click', handleSend);
  elements.messageInput.addEventListener('keydown', handleKeyDown);
  elements.btnRestart.addEventListener('click', handleRestart);
  elements.btnAdvisor.addEventListener('click', handleAdvisor);
  elements.registrationForm.addEventListener('submit', handleFormSubmit);
  elements.btnCancelRegistration.addEventListener('click', closeRegistrationModal);
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
    elements.quickActions.classList.remove('hidden');
    const grid = document.createElement('div');
    grid.className = 'quick-actions-grid';

    decisionTree.main.options.forEach(option => {
      const btn = document.createElement('button');
      btn.className = 'quick-btn';
      btn.textContent = option.label;
      btn.dataset.action = option.id;
      btn.addEventListener('click', () => handleQuickAction(option.id));
      grid.appendChild(btn);
    });

    elements.quickActions.appendChild(grid);
    return;
  }

  const menu = decisionTree[menuKey];
  if (!menu) return;

  elements.quickActions.classList.remove('hidden');

  const subMenu = document.createElement('div');
  subMenu.className = 'sub-menu';

  const title = document.createElement('div');
  title.className = 'sub-menu-title';
  title.textContent = menu.title;
  subMenu.appendChild(title);

  const grid = document.createElement('div');
  grid.className = 'sub-menu-grid';

  if (menuKey === 'cursos') {
    Object.entries(COURSES).forEach(([id, course]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = course.name;
      btn.addEventListener('click', () => showCourseDetail(id));
      grid.appendChild(btn);
    });
  } else if (menuKey === 'roles') {
    Object.entries(PROFILES).forEach(([id, profile]) => {
      const btn = document.createElement('button');
      btn.className = 'sub-btn';
      btn.textContent = profile.name;
      btn.addEventListener('click', () => showProfileDetail(id));
      grid.appendChild(btn);
    });
  }

  subMenu.appendChild(grid);

  const divider = document.createElement('hr');
  divider.className = 'menu-divider';
  subMenu.appendChild(divider);

  const llmBtn = document.createElement('button');
  llmBtn.className = 'llm-mode-btn';
  llmBtn.textContent = 'Pregunta personalizada sobre cursos';
  llmBtn.addEventListener('click', () => {
    enableLlmMode('Tengo una pregunta sobre los cursos SAP');
  });
  subMenu.appendChild(llmBtn);

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
  });
  subMenu.appendChild(backBtn);

  elements.quickActions.appendChild(subMenu);
}

function handleQuickAction(actionId) {
  state.currentMenu = actionId;

  const userMessages = {
    cursos: 'Quiero informacion sobre los cursos',
    roles: 'Quiero conocer los roles disponibles',
    asesor: 'Quiero contactar con un asesor',
    registro: 'Quiero registrarme en un curso SAP'
  };

  renderMessage(userMessages[actionId], 'user');

  if (actionId === 'asesor') {
    renderMessage('Seras redirigido a un asesor de ITSYSTEMS. Puedes contactarnos via WhatsApp para una atencion personalizada.', 'bot');
    setTimeout(() => {
      window.open('https://wa.me/51999666333?text=Hola,%20me%20gustaria%20recibir%20asesoria%20sobre%20los%20cursos%20SAP%20de%20ITSYSTEMS', '_blank');
    }, 500);
    return;
  }

  if (actionId === 'registro') {
    openRegistrationModal();
    return;
  }

  const menu = decisionTree[actionId];
  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p>${menu.response}</p>
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  renderQuickActions(actionId);
}

function showCourseDetail(courseId) {
  const course = COURSES[courseId];
  renderMessage(course.name, 'user');

  const courseData = getFullCourseData(courseId);

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${course.name}</strong></p>
      <p>${course.shortDesc}</p>
      <ul>
        <li><strong>Duracion:</strong> ${course.duration}</li>
        <li><strong>Nivel:</strong> ${course.level}</li>
        <li><strong>Certificacion:</strong> ${course.certification}</li>
      </ul>
      ${courseData ? `<p><strong>Modulos incluidos:</strong> ${courseData.modulos.slice(0, 4).join(', ')}...</p>` : ''}
      <p><strong>Dirigido a:</strong> ${courseData ? courseData.dirigido : 'Profesionales SAP'}</p>
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  showBackOnlyMenu('cursos');
}

function showProfileDetail(profileId) {
  const profile = PROFILES[profileId];
  renderMessage(profile.name, 'user');

  const profileData = getFullProfileData(profileId);
  const courseNames = profile.courses.map(id => COURSES[id]?.name || id).join(', ');

  const botMessage = document.createElement('div');
  botMessage.className = 'message bot';
  botMessage.innerHTML = `
    <div class="message-content">
      <p><strong>${profile.name}</strong></p>
      <p>${profile.shortDesc}</p>
      <ul>
        <li><strong>Cursos recomendados:</strong> ${courseNames}</li>
      </ul>
      ${profileData ? `<p>${profileData.descripcion}</p>` : ''}
    </div>
  `;
  elements.messagesContainer.appendChild(botMessage);
  scrollToBottom();

  showBackOnlyMenu('roles');
}

function showBackOnlyMenu(parentMenu) {
  elements.quickActions.innerHTML = '';
  elements.quickActions.classList.remove('hidden');

  const backBtn = document.createElement('button');
  backBtn.className = 'back-btn';
  backBtn.innerHTML = '&larr; Volver al menu principal';
  backBtn.addEventListener('click', () => {
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
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
    state.currentMenu = 'main';
    elements.quickActions.innerHTML = '';
    renderQuickActions('main');
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

  const chatContainer = document.querySelector('.chat-container');
  chatContainer.insertBefore(backToMenuBtn, elements.quickActions);
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
        if (usernameError) usernameError.textContent = 'Mínimo 5 caracteres';
      } else if (length > 8) {
        this.classList.add('input-error');
        this.classList.remove('input-valid');
        if (usernameError) usernameError.textContent = 'Máximo 8 caracteres';
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
}

function handleFormSubmit(event) {
  event.preventDefault();

  const formData = new FormData(elements.registrationForm);
  const formDataObj = {};
  formData.forEach((value, key) => {
    formDataObj[key] = value;
  });

  closeRegistrationModal();

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
        successMessage = `¡Registro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contraseña</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contraseña:</strong> ITS${sapUsername}</li>
</ul>

<strong>Como alternativa, puedes acceder desde Fiori:</strong>
<a href="https://s4hana.sapapp.store/webgui" target="_blank" class="message-link">https://s4hana.sapapp.store/webgui</a>`;
      } else {
        successMessage = `¡Registro exitoso! Tu usuario <strong>${sapUsername}</strong> ha sido registrado en SAP.

<strong>Flujo de acceso:</strong>
<ol>
  <li>Instalar SAP Logon</li>
  <li>Adjuntar las credenciales correspondientes a ITSYSTEMS</li>
  <li>Ingresar con tu username y contraseña</li>
</ol>

<strong>Credenciales:</strong>
<ul>
  <li><strong>Usuario:</strong> ${sapUsername}</li>
  <li><strong>Contraseña:</strong> ITS${sapUsername}</li>
</ul>

<strong>Accede desde:</strong>
<a href="https://s4hana.itscloud.store/webgui" target="_blank" class="message-link">https://s4hana.itscloud.store/webgui</a>`;
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

function getFullCourseData(courseId) {
  const courseMap = {
    'sap-fi': {
      modulos: ['Fundamentos de SAP FI y navegacion', 'Plan de cuentas y tipos de sociedad', 'Gestion de cuentas por pagar (AP)', 'Gestion de cuentas por cobrar (AR)', 'Conciliacion bancaria', 'Cierre contable mensual y anual', 'Reportes financieros y analisis', 'Integracion con otros modulos SAP'],
      dirigido: 'Contadores, analistas financieros, consultores ERP, profesionales de finanzas'
    },
    'sap-mm': {
      modulos: ['Fundamentos de SAP MM y master data', 'Gestion de solicitudes de compra', 'Proceso de compras y ordenes de compra', 'Evaluacion de proveedores', 'Gestion de inventarios y almacenes', 'Movimientos de stock y transferencias', 'Planificacion de necesidades de materiales (MRP)', 'Integracion con WM y SD'],
      dirigido: 'Profesionales de logistica, compradores, especialistas en supply chain, consultores de inventario'
    },
    'sap-sd': {
      modulos: ['Fundamentos de SAP SD y master data de ventas', 'Gestion de informacion de clientes', 'Cotizaciones y contratos de venta', 'Pedidos de venta y disponibilidad', 'Gestion de entregas y picking', 'Facturacion y determinacion de precios', 'Cobranzas y gestion de credito', 'Reportes de ventas y analisis'],
      dirigido: 'Ejecutivos de ventas, consultores CRM, profesionales de atencion al cliente, analistas comerciales'
    },
    'sap-abap': {
      modulos: ['Introduccion a SAP ABAP y entorno de desarrollo SE80', 'Diccionario de datos ABAP', 'Reportes ABAP clasicos e interactivos', 'Modulo de funciones y badis', 'Programacion orientada a objetos en ABAP', 'ALV para reportes avanzados', 'Interfaces RFC y web services', 'Enhancements y user-exits', 'Introduccion a ABAP en S/4HANA'],
      dirigido: 'Desarrolladores de software, programadores, consultores tecnicos que deseen especializarse en SAP'
    },
    'sap-cap': {
      modulos: ['Introduccion a SAP CAP y arquitectura cloud-native', 'Modelado de dominio con CDS', 'Desarrollo de servicios OData v4', 'Implementacion con Node.js', 'Implementacion con Java (Spring Boot)', 'Autenticacion y autorizacion', 'Integracion con servicios SAP BTP', 'Despliegue en cloud', 'Testing y debugging'],
      dirigido: 'Desarrolladores full-stack, arquitectos cloud, consultores tecnicos con experiencia en SAP'
    }
  };
  return courseMap[courseId] || null;
}

function getFullProfileData(profileId) {
  const profileMap = {
    'consultor-funcional': {
      descripcion: 'Se comienza con SAP FI por ser el nucleo financiero de toda implementacion SAP. Luego se construye sobre esa base con SAP MM para gestion de materiales y finalmente SAP SD para completar el ciclo de negocio venta-compras-finanzas.'
    },
    'desarrollador': {
      descripcion: 'ABAP es el lenguaje fundamental de desarrollo en SAP. No requiere prerrequisitos funcionales profundos, pero si solides bases de programacion.'
    },
    'desarrollador-cloud': {
      descripcion: 'CAP es la nueva era del desarrollo SAP en cloud. Recomendado para quienes ya tienen experiencia con SAP on-premise o desean migrar hacia soluciones cloud.'
    },
    'consultor-tecnico': {
      descripcion: 'Se inicia con SAP FI para entender el nucleo del negocio, y luego se complementa con ABAP para poder personalizar y extender el sistema segun necesidades especificas.'
    }
  };
  return profileMap[profileId] || null;
}

function enableLlmMode(initialMessage = null) {
  state.llmModeEnabled = true;
  elements.quickActions.classList.add('hidden');
  elements.messageInput.disabled = false;
  elements.sendButton.disabled = false;

  const backToMenuBtn = document.createElement('button');
  backToMenuBtn.className = 'llm-mode-back-btn';
  backToMenuBtn.innerHTML = '&larr; Volver al menu principal';
  backToMenuBtn.addEventListener('click', () => {
    state.llmModeEnabled = false;
    elements.messageInput.disabled = true;
    elements.sendButton.disabled = true;
    elements.messageInput.value = '';
    backToMenuBtn.remove();
    renderQuickActions('main');
  });

  const chatContainer = document.querySelector('.chat-container');
  chatContainer.insertBefore(backToMenuBtn, elements.quickActions);

  if (initialMessage) {
    elements.messageInput.value = initialMessage;
  }

  elements.messageInput.focus();

  renderMessage('Perfecto! A partir de ahora puedes hacerme cualquier pregunta y la respondere con la ayuda de inteligencia artificial.', 'bot');
}

async function handleSend() {
  if (state.registrationMode) {
    const username = elements.messageInput.value.trim();
    if (username) {
      clearInput();
      await sendToSAPRegister(username);
    }
    return;
  }

  if (state.llmModeEnabled) {
    await sendToLLM();
  }
}

async function sendToLLM() {
  const message = elements.messageInput.value.trim();

  if (!message || state.isTyping || state.limitReached) {
    return;
  }

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
    renderMessage(`Error de conexion con el servidor. Asegurate de que el backend este corriendo en puerto 3000. Detalle: ${error.message}`, 'bot', false, true);
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
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  scrollToBottom();
}

function hideTyping() {
  state.isTyping = false;
  elements.typingIndicator.classList.add('hidden');
  if (!state.limitReached && (state.llmModeEnabled || state.registrationMode)) {
    elements.messageInput.disabled = false;
    elements.sendButton.disabled = false;
  }
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
  state.llmModeEnabled = false;
  state.registrationMode = false;
  state.currentMenu = 'main';
  console.log('New Session ID:', state.sessionId);

  elements.messagesContainer.innerHTML = '';
  hideLimitModal();
  elements.quickActions.innerHTML = '';
  renderMessage(welcomeMessage, 'bot', true);
  renderQuickActions('main');
  elements.messageInput.disabled = true;
  elements.sendButton.disabled = true;
  elements.messageInput.placeholder = 'Escribe tu mensaje...';
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
