/**
 * Contact Form Handler
 * Includes: Form validation, rate limiting, spam protection, email submission
 *
 * LANGUAGE INTEGRATION:
 * This file reuses the same language state as lang.js (`currentLang`,
 * stored in localStorage under 'paits_lang'). All user-facing strings
 * (validation errors, status messages, success text) are pulled from
 * the TRANSLATIONS table below according to the active language, so
 * everything stays in sync with the site-wide KA/EN toggle.
 */

const FORM_TRANSLATIONS = {
  ka: {
    fieldRequired: 'ველი სავალდებულოა',
    emailInvalid: 'ელ. ფოსტის არასწორი ფორმატი',
    phoneInvalid: 'ტელეფონის ნომერი არასწორია',
    messageTooShort: 'შეტყობინება უნდა შეიცავდეს მინიმუმ 10 სიმბოლოს',
    messageTooLong: 'შეტყობინება არ უნდა აღემატებოდეს 2000 სიმბოლოს',
    nameTooShort: 'სახელი უნდა შეიცავდეს მინიმუმ 2 სიმბოლოს',
    subjectTooShort: 'თემა უნდა შეიცავდეს მინიმუმ 3 სიმბოლოს',
    consentRequired: 'საჭიროა თანხმობა',
    sending: 'იგზავნება...',
    spamDetected: 'შეტყობინება არასწორ ინფორმაციას შეიცავს',
    spamGeneric: 'სპამის მცდელობა გამოვლინდა',
    fillRequired: 'გთხოვთ, შეავსოთ ყველა სავალდებულო ველი',
    rateLimitInterval: 'გთხოვთ, დაელოდოთ რამდენიმე წამს გაგზავნამდე',
    rateLimitHour: 'თქვენ გაგზავნეთ ძალიან ბევრი შეტყობინება. სცადეთ მოგვიანებით.',
    submitError: 'მოხდა შეცდომა. გთხოვთ, სცადოთ მოგვიანებით.',
    errorPrefix: '❌ '
  },
  en: {
    fieldRequired: 'This field is required',
    emailInvalid: 'Invalid email format',
    phoneInvalid: 'Invalid phone number',
    messageTooShort: 'Message must be at least 10 characters',
    messageTooLong: 'Message must not exceed 2000 characters',
    nameTooShort: 'Name must be at least 2 characters',
    subjectTooShort: 'Subject must be at least 3 characters',
    consentRequired: 'Consent is required',
    sending: 'Sending...',
    spamDetected: 'Your message contains content that is not allowed',
    spamGeneric: 'Spam attempt detected',
    fillRequired: 'Please fill in all required fields',
    rateLimitInterval: 'Please wait a few seconds before submitting again',
    rateLimitHour: 'You have sent too many messages. Please try again later.',
    submitError: 'An error occurred. Please try again later.',
    errorPrefix: '❌ '
  }
};

function getActiveLang() {
  // Stay in sync with lang.js: prefer the live global if present,
  // otherwise fall back to the saved preference, otherwise default 'ka'.
  if (typeof currentLang !== 'undefined' && currentLang) return currentLang;
  return localStorage.getItem('paits_lang') || 'ka';
}

function t(key) {
  const lang = getActiveLang();
  const dict = FORM_TRANSLATIONS[lang] || FORM_TRANSLATIONS.ka;
  return dict[key] || FORM_TRANSLATIONS.ka[key] || key;
}

class ContactFormManager {
  constructor() {
    this.form = document.getElementById('contactForm');
    this.successMsg = document.getElementById('successMessage');
    this.formStatus = document.querySelector('.form-status');
    this.submitBtn = this.form.querySelector('.cf-submit');

    // Rate limiting
    this.lastSubmitTime = 0;
    this.minSubmitInterval = 3000; // Minimum 3 seconds between submissions
    this.maxSubmitsPerHour = 5; // Max 5 submissions per hour
    this.submitTimestamps = this.getSubmitHistory();

    this.init();
  }

  init() {
    // Validate on input
    this.form.querySelectorAll('input, textarea').forEach(field => {
      field.addEventListener('blur', () => this.validateField(field));
      field.addEventListener('input', () => {
        this.clearFieldError(field);
        if (field.id === 'message') this.updateCharCount();
      });
    });

    // Form submission
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Consent checkbox
    const consentCheckbox = this.form.querySelector('#consent');
    consentCheckbox.addEventListener('change', () => {
      this.clearFieldError(consentCheckbox);
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const name = field.name;

    if (!value) {
      this.setFieldError(field, t('fieldRequired'));
      return false;
    }

    // Email validation
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        this.setFieldError(field, t('emailInvalid'));
        return false;
      }
    }

    // Phone validation (if provided)
    if (name === 'phone' && value) {
      const phoneRegex = /^[\d+\s\-()]{7,}$/;
      if (!phoneRegex.test(value)) {
        this.setFieldError(field, t('phoneInvalid'));
        return false;
      }
    }

    // Message length validation
    if (name === 'message') {
      if (value.length < 10) {
        this.setFieldError(field, t('messageTooShort'));
        return false;
      }
      if (value.length > 2000) {
        this.setFieldError(field, t('messageTooLong'));
        return false;
      }
    }

    // Name validation
    if (name === 'name') {
      if (value.length < 2) {
        this.setFieldError(field, t('nameTooShort'));
        return false;
      }
    }

    // Subject validation
    if (name === 'subject') {
      if (value.length < 3) {
        this.setFieldError(field, t('subjectTooShort'));
        return false;
      }
    }

    this.clearFieldError(field);
    return true;
  }

  setFieldError(field, message) {
    field.classList.add('field-invalid');
    const errorSpan = field.parentElement.querySelector('.field-error');
    if (errorSpan) {
      errorSpan.style.display = 'block';
      errorSpan.textContent = message;
    }
  }

  clearFieldError(field) {
    field.classList.remove('field-invalid');
    const errorSpan = field.parentElement.querySelector('.field-error');
    if (errorSpan) {
      errorSpan.style.display = 'none';
    }
  }

  updateCharCount() {
    const textarea = this.form.querySelector('#message');
    const count = textarea.value.length;
    document.getElementById('charCount').textContent = count;
  }

  // Rate limiting checks
  checkRateLimit() {
    const now = Date.now();

    // Check minimum interval between submissions
    if (now - this.lastSubmitTime < this.minSubmitInterval) {
      return {
        allowed: false,
        message: t('rateLimitInterval')
      };
    }

    // Check max submissions per hour
    const oneHourAgo = now - (60 * 60 * 1000);
    const recentSubmits = this.submitTimestamps.filter(time => time > oneHourAgo);

    if (recentSubmits.length >= this.maxSubmitsPerHour) {
      return {
        allowed: false,
        message: t('rateLimitHour')
      };
    }

    return { allowed: true };
  }

  // Honeypot check
  checkHoneypot() {
    const honeypot = this.form.querySelector('input[name="website"]');
    if (honeypot && honeypot.value) {
      return false; // Bot detected
    }
    return true;
  }

  // Spam patterns detection
  detectSpam(text) {
    const spamPatterns = [
      /viagra|cialis|casino|poker/gi,
      /click here|buy now|limited offer/gi,
      /http:\/\/|https:\/\//g, // Multiple links
      /(spam|spam|spam)/gi // Word repetition
    ];

    let linkCount = (text.match(/http:\/\/|https:\/\//g) || []).length;
    if (linkCount > 3) return true;

    for (let pattern of spamPatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }

    return false;
  }

  getSubmitHistory() {
    const history = localStorage.getItem('contactFormSubmits');
    if (!history) return [];
    const parsed = JSON.parse(history);
    // Clear out stale entries
    return parsed.filter(time => time > Date.now() - (60 * 60 * 1000));
  }

  saveSubmit() {
    const history = this.getSubmitHistory();
    history.push(Date.now());
    localStorage.setItem('contactFormSubmits', JSON.stringify(history));
  }

  async handleSubmit(e) {
    e.preventDefault();

    // Disable submit button
    this.submitBtn.disabled = true;
    this.formStatus.textContent = t('sending');
    this.formStatus.style.color = 'rgba(255,255,255,0.7)';

    try {
      // Honeypot check
      if (!this.checkHoneypot()) {
        throw new Error(t('spamGeneric'));
      }

      // Validate all fields
      let isValid = true;
      this.form.querySelectorAll('input[required], textarea[required]').forEach(field => {
        if (!this.validateField(field)) {
          isValid = false;
        }
      });

      // Check consent
      const consent = this.form.querySelector('#consent');
      if (!consent.checked) {
        isValid = false;
        this.setFieldError(consent, t('consentRequired'));
      }

      if (!isValid) {
        throw new Error(t('fillRequired'));
      }

      // Rate limit check
      const rateCheck = this.checkRateLimit();
      if (!rateCheck.allowed) {
        throw new Error(rateCheck.message);
      }

      // Spam detection
      const messageField = this.form.querySelector('#message');
      if (this.detectSpam(messageField.value)) {
        throw new Error(t('spamDetected'));
      }

      // Prepare form data
      const formData = new FormData(this.form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        timestamp: new Date().toISOString()
      };

      // Send to backend
      await this.submitForm(data);

      // Success
      this.lastSubmitTime = Date.now();
      this.saveSubmit();

      // Show success message (its own KA/EN text lives in the HTML
      // via data-ka / data-en, handled by lang.js's applyLanguage())
      this.form.style.display = 'none';
      this.successMsg.style.display = 'flex';

      // Reset form after delay
      setTimeout(() => {
        this.form.reset();
        this.form.style.display = 'block';
        this.successMsg.style.display = 'none';
        this.formStatus.textContent = '';
      }, 5000);

    } catch (error) {
      this.formStatus.textContent = `${t('errorPrefix')}${error.message}`;
      this.formStatus.style.color = '#ff6b6b';
    } finally {
      this.submitBtn.disabled = false;
    }
  }

  async submitForm(data) {
    // ── EmailJS ──────────────────────────────────────────────
    // 1. Make sure the EmailJS SDK is loaded in index.html BEFORE
    //    this script:
    //    <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
    //
    // 2. Fill in your own values below (find them in your EmailJS
    //    dashboard: Account → General → Public Key,
    //    Email Services → Service ID,
    //    Email Templates → Template ID).
    //
    // 3. Your EmailJS template must contain matching variables,
    //    e.g. {{from_name}}, {{from_email}}, {{phone}}, {{subject}},
    //    {{message}} — these are the keys sent in the object below.

    const PUBLIC_KEY  = 'PNsM4vlD9dfCLiN0p';   // e.g. 'a1B2c3D4e5F6g7H8'
    const SERVICE_ID  = 'service_b02rf26';   // e.g. 'service_abc1234'
    const TEMPLATE_ID = 'template_wvvrzmc';  // e.g. 'template_xyz5678'

    if (typeof emailjs === 'undefined') {
      throw new Error(t('submitError'));
    }

    emailjs.init(PUBLIC_KEY);

    try {
      const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
        from_name: data.name,
        from_email: data.email,
        phone: data.phone,
        subject: data.subject,
        message: data.message,
        timestamp: data.timestamp
      });
      return response;
    } catch (err) {
      throw new Error(t('submitError'));
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('contactForm')) {
    new ContactFormManager();
  }
});
