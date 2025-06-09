class LandingPage {
  constructor() {
    this.currentLang = "pt";
    this.selectedPlan = null;
    this.apiBaseUrl =
      window.CONFIG?.API_BASE_URL || "https://your-backend.railway.app/api";
    this.stripe = Stripe(
      window.CONFIG?.STRIPE_PUBLIC_KEY || "pk_test_your_stripe_key"
    );
    this.init();
  }

  init() {
    this.setupBillingToggle();
    this.setupPaymentMethods();
    this.setupAnalytics();
    this.setupIntersectionObserver();
    this.initializeEnhancedFeatures();
    this.initializeScrollAnimations();
    this.initializeParallaxEffects();
    this.initializeTypewriterEffect();
  }

  // API Helper Methods
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      this.showNotification("Erro de conexão. Tente novamente.", "error");
      throw error;
    }
  }

  // Email Subscription
  async subscribeEmail(event) {
    event.preventDefault();

    const email = document.getElementById("email-input").value;
    const button = event.target.querySelector(".subscribe-btn");
    const originalText = button.innerHTML;

    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Inscrevendo...';
    button.disabled = true;

    try {
      await this.apiCall("/subscribe", {
        method: "POST",
        body: JSON.stringify({
          email,
          source: "landing_page",
          language: this.currentLang,
        }),
      });

      this.showNotification("✅ Email cadastrado com sucesso!", "success");
      document.getElementById("email-input").value = "";
      this.trackEvent("email_subscribed", { email });
    } catch (error) {
      this.showNotification("❌ Erro ao cadastrar email", "error");
    } finally {
      button.innerHTML = originalText;
      button.disabled = false;
    }
  }

  // Payment Processing
  async selectPlan(planType) {
    this.selectedPlan = planType;
    this.showPaymentModal();
    this.trackEvent("plan_selected", { plan: planType });
  }

  async handleStripePayment(cardElement) {
    const { token, error } = await this.stripe.createToken(cardElement);

    if (error) {
      this.showError(error.message);
      return;
    }

    try {
      const result = await this.apiCall("/process-payment", {
        method: "POST",
        body: JSON.stringify({
          token: token.id,
          plan: this.selectedPlan,
          amount: this.selectedPlan === "premium" ? 1900 : 19900,
          currency: "brl",
        }),
      });

      if (result.success) {
        this.handlePaymentSuccess();
      }
    } catch (error) {
      this.showError("Erro no pagamento. Tente novamente.");
    }
  }

  // PIX Payment
  async generatePixCode() {
    try {
      const result = await this.apiCall("/generate-pix", {
        method: "POST",
        body: JSON.stringify({
          plan: this.selectedPlan,
          amount: this.selectedPlan === "premium" ? 19.0 : 199.0,
        }),
      });

      document.getElementById("pix-code-input").value = result.pixCode;

      // Generate QR Code
      const canvas = document.getElementById("qr-canvas");
      QRCode.toCanvas(canvas, result.pixCode, { width: 200 });
    } catch (error) {
      this.showError("Erro ao gerar código PIX");
    }
  }

  // App Download with Analytics
  async downloadApp() {
    this.trackEvent("app_download_started");

    try {
      // Get download link from API
      const result = await this.apiCall("/download-link", {
        method: "POST",
        body: JSON.stringify({ type: "free" }),
      });

      // Create download
      const link = document.createElement("a");
      link.href = result.downloadUrl;
      link.download = "salesforce-arc-pilot-free.zip";
      link.click();

      this.showNotification("⬇️ Download iniciado!", "success");
    } catch (error) {
      // Fallback to direct download
      const link = document.createElement("a");
      link.href = "/downloads/salesforce-arc-pilot-free.zip";
      link.download = "salesforce-arc-pilot-free.zip";
      link.click();
    }
  }

  // Notifications System
  showNotification(message, type = "info") {
    const container = document.getElementById("notification-container");
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

    container.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Performance Optimizations
  setupIntersectionObserver() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: "0px 0px -50px 0px",
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in");
          this.trackEvent("section_viewed", {
            section: entry.target.id || entry.target.className,
          });
        }
      });
    }, observerOptions);

    // Observe sections
    document.querySelectorAll("section").forEach((section) => {
      observer.observe(section);
    });
  }

  // FAQ Toggle
  toggleFaq(button) {
    const faqItem = button.parentElement;
    const answer = faqItem.querySelector(".faq-answer");
    const icon = button.querySelector("i");

    faqItem.classList.toggle("active");

    if (faqItem.classList.contains("active")) {
      answer.style.maxHeight = answer.scrollHeight + "px";
      icon.style.transform = "rotate(180deg)";
    } else {
      answer.style.maxHeight = "0";
      icon.style.transform = "rotate(0deg)";
    }
  }

  // Enhanced Analytics
  trackEvent(eventName, parameters = {}) {
    // Google Analytics
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, parameters);
    }

    // Custom analytics to backend
    this.apiCall("/analytics", {
      method: "POST",
      body: JSON.stringify({
        event: eventName,
        parameters,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
        page: window.location.pathname,
        language: this.currentLang,
      }),
    }).catch(() => {}); // Silent fail for analytics
  }

  // Language Toggle
  toggleLanguage() {
    this.currentLang = this.currentLang === "pt" ? "en" : "pt";
    this.updateContent();
  }

  updateContent() {
    const translations = {
      pt: {
        title: "Gerencie suas Orgs Salesforce como um profissional",
        subtitle: "A extensão mais completa para desenvolvedores Salesforce.",
        downloadBtn: "Baixar Grátis",
        demoBtn: "Ver Demo",
      },
      en: {
        title: "Manage your Salesforce Orgs like a professional",
        subtitle: "The most complete extension for Salesforce developers.",
        downloadBtn: "Download Free",
        demoBtn: "Watch Demo",
      },
    };

    const content = translations[this.currentLang];
    document.querySelector(".hero-title").innerHTML = content.title;
    document.querySelector(".hero-subtitle").textContent = content.subtitle;
  }

  // Billing Toggle
  setupBillingToggle() {
    const toggle = document.getElementById("billing-toggle");
    toggle.addEventListener("change", () => {
      const monthlyPrices = document.querySelectorAll(".monthly");
      const yearlyPrices = document.querySelectorAll(".yearly");

      if (toggle.checked) {
        monthlyPrices.forEach((el) => el.classList.add("hidden"));
        yearlyPrices.forEach((el) => el.classList.remove("hidden"));
      } else {
        monthlyPrices.forEach((el) => el.classList.remove("hidden"));
        yearlyPrices.forEach((el) => el.classList.add("hidden"));
      }
    });
  }

  // Plan Selection
  selectPlan(planType) {
    this.selectedPlan = planType;
    this.showPaymentModal();
    this.trackEvent("plan_selected", { plan: planType });
  }

  showPaymentModal() {
    document.getElementById("payment-modal").classList.remove("hidden");
    this.generatePixCode();
  }

  closeModal() {
    document.getElementById("payment-modal").classList.add("hidden");
  }

  // Payment Methods
  setupPaymentMethods() {
    this.setupStripe();
    this.setupPayPal();
  }

  showPaymentMethod(method) {
    // Hide all payment contents
    document.querySelectorAll(".payment-content").forEach((el) => {
      el.classList.add("hidden");
    });

    // Remove active class from all tabs
    document.querySelectorAll(".tab-button").forEach((el) => {
      el.classList.remove("active");
    });

    // Show selected payment method
    document.getElementById(`${method}-payment`).classList.remove("hidden");
    event.target.classList.add("active");

    this.trackEvent("payment_method_selected", { method });
  }

  // PIX Payment
  generatePixCode() {
    const pixCode = this.createPixPayload();
    document.getElementById("pix-code-input").value = pixCode;

    // Generate QR Code
    const canvas = document.getElementById("qr-canvas");
    QRCode.toCanvas(canvas, pixCode, { width: 200 }, (error) => {
      if (error) console.error(error);
    });
  }

  createPixPayload() {
    const merchantInfo = {
      merchantName: "VICTOR BRANDAO",
      merchantCity: "SAO PAULO",
      pixKey: "your-pix-key@email.com", // Replace with your PIX key
      amount: this.selectedPlan === "premium" ? "19.00" : "199.00",
    };

    // Simplified PIX payload generation
    return `00020126580014BR.GOV.BCB.PIX0136${merchantInfo.pixKey}520400005303986540${merchantInfo.amount}5802BR5913${merchantInfo.merchantName}6009${merchantInfo.merchantCity}6304`;
  }

  copyPixCode() {
    const input = document.getElementById("pix-code-input");
    input.select();
    document.execCommand("copy");

    // Show feedback
    const button = event.target;
    const originalText = button.textContent;
    button.textContent = "Copiado!";
    button.style.backgroundColor = "#10b981";

    setTimeout(() => {
      button.textContent = originalText;
      button.style.backgroundColor = "";
    }, 2000);

    this.trackEvent("pix_code_copied");
  }

  // Stripe Payment
  setupStripe() {
    const elements = this.stripe.elements();
    const cardElement = elements.create("card", {
      style: {
        base: {
          fontSize: "16px",
          color: "#424770",
          "::placeholder": { color: "#aab7c4" },
        },
      },
    });

    cardElement.mount("#stripe-elements");

    document
      .getElementById("submit-payment")
      .addEventListener("click", async () => {
        await this.handleStripePayment(cardElement);
      });
  }

  // PayPal Payment
  setupPayPal() {
    paypal
      .Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: this.selectedPlan === "premium" ? "19.00" : "199.00",
                  currency_code: "BRL",
                },
              },
            ],
          });
        },
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          this.handlePaymentSuccess();
        },
        onError: (err) => {
          this.showError("Erro no pagamento PayPal");
        },
      })
      .render("#paypal-button-container");
  }

  // Success/Error Handling
  handlePaymentSuccess() {
    this.closeModal();
    this.showSuccessMessage();
    this.sendDownloadLink();
    this.trackEvent("payment_completed", { plan: this.selectedPlan });
  }

  showSuccessMessage() {
    // Create success notification
    const notification = document.createElement("div");
    notification.className = "success-notification";
    notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Pagamento Realizado com Sucesso!</h3>
            <p>Você receberá o link de download por email em instantes.</p>
        `;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  sendDownloadLink() {
    // Send email with premium download link
    fetch("/api/send-download-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: this.userEmail,
        plan: this.selectedPlan,
      }),
    });
  }

  showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-notification";
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);

    setTimeout(() => errorDiv.remove(), 5000);
  }

  // Analytics
  setupAnalytics() {
    // Google Analytics 4
    gtag("config", "GA_MEASUREMENT_ID", {
      page_title: "Salesforce Arc Pilot Landing",
      page_location: window.location.href,
    });
  }

  // Utility Functions
  scrollToDownload() {
    document.getElementById("pricing").scrollIntoView({
      behavior: "smooth",
    });
  }

  showDemo() {
    // Open demo video modal or redirect to YouTube
    window.open("https://youtube.com/watch?v=your-demo-video", "_blank");
    this.trackEvent("demo_video_clicked");
  }

  contactSales() {
    // Open contact form or redirect to calendar
    window.open("https://calendly.com/your-calendar", "_blank");
    this.trackEvent("contact_sales_clicked");
  }

  // Enhanced animations and interactions
  initializeEnhancedFeatures() {
    // Navbar scroll effect
    const navbar = document.querySelector(".navbar");
    let lastScrollY = window.scrollY;

    window.addEventListener("scroll", () => {
      if (window.scrollY > 100) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }

      // Hide navbar on scroll down, show on scroll up
      if (window.scrollY > lastScrollY && window.scrollY > 200) {
        navbar.style.transform = "translateY(-100%)";
      } else {
        navbar.style.transform = "translateY(0)";
      }
      lastScrollY = window.scrollY;
    });

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute("href"));
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      });
    });

    // Enhanced pricing toggle
    const billingToggle = document.getElementById("billing-toggle");
    if (billingToggle) {
      billingToggle.addEventListener("change", function () {
        const monthlyPrices = document.querySelectorAll(".monthly");
        const yearlyPrices = document.querySelectorAll(".yearly");

        if (this.checked) {
          monthlyPrices.forEach((el) => el.classList.add("hidden"));
          yearlyPrices.forEach((el) => el.classList.remove("hidden"));
        } else {
          monthlyPrices.forEach((el) => el.classList.remove("hidden"));
          yearlyPrices.forEach((el) => el.classList.add("hidden"));
        }
      });
    }
  }

  initializeScrollAnimations() {
    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in-up");
            observer.unobserve(entry.target);
          }
        });
      },
      observerOptions
    );

    // Observe elements for animation
    document
      .querySelectorAll(
        ".feature-card, .pricing-card, .testimonial-card, .faq-item"
      )
      .forEach((el) => {
        observer.observe(el);
      });
  }

  initializeParallaxEffects() {
    const heroImage = document.querySelector(".hero-image");

    if (heroImage) {
      window.addEventListener("scroll", () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroImage.style.transform = `perspective(1000px) rotateY(-15deg) rotateX(10deg) translateY(${rate}px)`;
      });
    }
  }

  initializeTypewriterEffect() {
    const highlightText = document.querySelector(".highlight");
    if (highlightText) {
      const text = highlightText.textContent;
      const words = [
        "Orgs Salesforce",
        "Desenvolvimento",
        "Produtividade",
        "Workflow",
      ];
      let wordIndex = 0;
      let charIndex = 0;
      let isDeleting = false;

      function typeWriter() {
        const currentWord = words[wordIndex];

        if (isDeleting) {
          highlightText.textContent = currentWord.substring(0, charIndex - 1);
          charIndex--;
        } else {
          highlightText.textContent = currentWord.substring(0, charIndex + 1);
          charIndex++;
        }

        let typeSpeed = isDeleting ? 100 : 200;

        if (!isDeleting && charIndex === currentWord.length) {
          typeSpeed = 2000;
          isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
          isDeleting = false;
          wordIndex = (wordIndex + 1) % words.length;
          typeSpeed = 500;
        }

        setTimeout(typeWriter, typeSpeed);
      }

      setTimeout(typeWriter, 1000);
    }
  }

  // Enhanced language system
  toggleLanguage() {
    const newLang = window.currentLang === "pt" ? "en" : "pt";
    this.setLanguage(newLang);

    // Show notification
    const message =
      window.translations[newLang].notifications.languageChanged;
    this.showNotification(message, "success");

    // Track language change
    this.trackEvent("language_changed", {
      from: window.currentLang,
      to: newLang,
    });
  }

  setLanguage(lang) {
    window.currentLang = lang;
    localStorage.setItem("language", lang);

    // Update HTML lang attribute
    document.documentElement.lang = lang === "pt" ? "pt-BR" : "en-US";

    // Update flag and text
    const flagElement = document.getElementById("current-flag");
    const langElement = document.getElementById("current-lang");

    if (lang === "pt") {
      flagElement.textContent = "🇧🇷";
      langElement.textContent = "PT";
    } else {
      flagElement.textContent = "🇺🇸";
      langElement.textContent = "EN";
    }

    // Update all translated elements
    this.updateTranslations();

    // Update currency and pricing
    this.updatePricing(lang);

    // Update typewriter effect
    this.updateTypewriterWords(lang);
  }

  updateTranslations() {
    const translations = window.translations[window.currentLang];

    // Update elements with data-i18n attribute
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      const key = element.getAttribute("data-i18n");
      const translation = this.getNestedTranslation(translations, key);

      if (translation) {
        element.textContent = translation;
      }
    });

    // Update placeholders
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      const key = element.getAttribute("data-i18n-placeholder");
      const translation = this.getNestedTranslation(translations, key);

      if (translation) {
        element.placeholder = translation;
      }
    });

    // Update meta tags
    const titleMeta = document.querySelector('title[data-i18n]');
    if (titleMeta) {
        const key = titleMeta.getAttribute('data-i18n');
        const translation = this.getNestedTranslation(translations, key);
        if (translation) {
            document.title = translation;
        }
    }
    
    const descMeta = document.querySelector('meta[name="description"][data-i18n]');
    if (descMeta) {
        const key = descMeta.getAttribute('data-i18n');
        const translation = this.getNestedTranslation(translations, key);
        if (translation) {
            descMeta.setAttribute('content', translation);
        }
    }
  }

  getNestedTranslation(obj, key) {
    return key.split(".").reduce((o, k) => (o || {})[k], obj);
  }

  updatePricing(lang) {
    const currencyElements = document.querySelectorAll(
      '[data-i18n="pricing.currency"]'
    );
    currencyElements.forEach((element) => {
      element.textContent = lang === "pt" ? "R$" : "$";
    });

    // Update premium pricing for different currencies
    const premiumPrices = document.querySelectorAll(
      ".pricing-card.featured .amount"
    );
    premiumPrices.forEach((element) => {
      if (element.classList.contains("monthly")) {
        element.textContent = lang === "pt" ? "19" : "9";
      } else if (element.classList.contains("yearly")) {
        element.textContent = lang === "pt" ? "13" : "6";
      }
    });

    // Update enterprise pricing
    const enterprisePrice = document.querySelector(".pricing-card:last-child .amount");
    if (enterprisePrice && !enterprisePrice.classList.contains("monthly") && !enterprisePrice.classList.contains("yearly")) {
        enterprisePrice.textContent = lang === "pt" ? "199" : "99";
    }
  }

  updateTypewriterWords(lang) {
    const words = {
      pt: ["Orgs Salesforce", "Desenvolvimento", "Produtividade", "Workflow"],
      en: ["Salesforce Orgs", "Development", "Productivity", "Workflow"],
    };

    // Update typewriter words for the current language
    if (window.typewriterWords) {
      window.typewriterWords = words[lang];
    }
  }

  // Enhanced typewriter effect with language support
  initializeTypewriterEffect() {
    const highlightText = document.getElementById("typewriter-text");
    if (!highlightText) return;

    const words = {
      pt: ["Orgs Salesforce", "Desenvolvimento", "Produtividade", "Workflow"],
      en: ["Salesforce Orgs", "Development", "Productivity", "Workflow"],
    };

    window.typewriterWords = words[window.currentLang];
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    function typeWriter() {
      const currentWord = window.typewriterWords[wordIndex];

      if (isDeleting) {
        highlightText.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
      } else {
        highlightText.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
      }

      let typeSpeed = isDeleting ? 100 : 200;

      if (!isDeleting && charIndex === currentWord.length) {
        typeSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % window.typewriterWords.length;
        typeSpeed = 500;
      }

      setTimeout(typeWriter, typeSpeed);
    }

    setTimeout(typeWriter, 1000);
  }

  // Enhanced notification system with translations
  showNotification(message, type = "success", duration = 5000) {
    const container = document.getElementById("notification-container");
    if (!container) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${
              type === "success" ? "check-circle" : "exclamation-circle"
            }"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: inherit; cursor: pointer; font-size: 1.25rem;">&times;</button>
        </div>
    `;

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add("show"), 100);

    // Auto remove
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }

  // Enhanced email subscription with language support
  async subscribeEmail(event) {
    event.preventDefault();

    const form = event.target;
    const emailInput = form.querySelector('input[type="email"]');
    const submitBtn = form.querySelector('button[type="submit"]');
    const email = emailInput.value.trim();

    if (!email) {
      const errorMsg =
        window.currentLang === "pt"
          ? "Por favor, insira um email válido"
          : "Please enter a valid email";
      this.showNotification(errorMsg, "error");
      return;
    }

    // Add loading state
    submitBtn.classList.add("loading");
    submitBtn.disabled = true;

    try {
      const response = await fetch(`${window.CONFIG.API_BASE_URL}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source: "landing_page",
          language: window.currentLang,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          page: window.location.href,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const successMsg =
          window.translations[window.currentLang].notifications.subscribed;
        this.showNotification(successMsg, "success");
        emailInput.value = "";

        // Track successful subscription
        this.trackEvent("email_subscribed", {
          email_domain: email.split("@")[1],
          source: "landing_page",
          language: window.currentLang,
        });
      } else {
        const errorMsg =
          data.message ||
          window.translations[window.currentLang].notifications.error;
        this.showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Subscription error:", error);
      const errorMsg =
        window.currentLang === "pt"
          ? "Erro de conexão. Tente novamente."
          : "Connection error. Please try again.";
      this.showNotification(errorMsg, "error");
    } finally {
      submitBtn.classList.remove("loading");
      submitBtn.disabled = false;
    }
  }

  // Enhanced functions with language support
  async downloadApp(type = "free") {
    try {
      // Track download intent
      this.trackEvent("download_started", { type, language: window.currentLang });

      const response = await fetch(`${window.CONFIG.API_BASE_URL}/download-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          language: window.currentLang,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          page: window.location.href,
        }),
      });

      const data = await response.json();

      if (response.ok && data.downloadUrl) {
        const successMsg =
          window.translations[window.currentLang].notifications.downloadStarted;
        this.showNotification(successMsg, "success");

        // Create download link
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = `salesforce-arc-pilot-${type}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Track successful download
        this.trackEvent("download_completed", { type, language: window.currentLang });
      } else {
        const errorMsg =
          window.currentLang === "pt"
            ? "Link de download temporariamente indisponível"
            : "Download link temporarily unavailable";
        this.showNotification(errorMsg, "error");
      }
    } catch (error) {
      console.error("Download error:", error);
      const errorMsg =
        window.currentLang === "pt"
          ? "Erro ao gerar link de download"
          : "Error generating download link";
      this.showNotification(errorMsg, "error");
    }
  }

  // Enhanced analytics tracking with language
  trackEvent(eventName, parameters = {}) {
    // Always include language in parameters
    parameters.language = window.currentLang;

    if (window.CONFIG.ENVIRONMENT === "free") {
      // Send to our backend
      fetch(`${window.CONFIG.API_BASE_URL}/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event: eventName,
          parameters,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          page: window.location.href,
        }),
      }).catch((error) => console.log("Analytics error:", error));
    }

    // Send to Google Analytics if available
    if (typeof gtag !== "undefined") {
      gtag("event", eventName, parameters);
    }
  }

  // Enhanced FAQ functionality with language support
  toggleFaq(button) {
    const faqItem = button.closest(".faq-item");
    const isActive = faqItem.classList.contains("active");

    // Close all FAQ items
    document.querySelectorAll(".faq-item").forEach((item) => {
      item.classList.remove("active");
    });

    // Open clicked item if it wasn't active
    if (!isActive) {
      faqItem.classList.add("active");

      // Track FAQ interaction
      this.trackEvent("faq_opened", {
        question: button.querySelector("span").textContent,
        language: window.currentLang,
      });
    }
  }

  // Enhanced modal functionality
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";

      // Track modal open
      this.trackEvent("modal_opened", { modal_id: modalId });
    }
  }

  closeModal() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.classList.remove("active");
    });
    document.body.style.overflow = "";
  }

  // Enhanced payment selection
  selectPlan(plan) {
    this.showModal("payment-modal");

    // Track plan selection
    this.trackEvent("plan_selected", { plan });

    // Update modal content based on plan
    const modalTitle = document.querySelector("#payment-modal h2");
    if (modalTitle) {
      modalTitle.textContent = `Assinar Plano ${
        plan.charAt(0).toUpperCase() + plan.slice(1)
      }`;
    }
  }

  // Enhanced payment methods
  showPaymentMethod(method) {
    // Hide all payment methods
    document.querySelectorAll(".payment-content").forEach((content) => {
      content.classList.add("hidden");
      content.classList.remove("active");
    });

    // Remove active class from all tabs
    document.querySelectorAll(".tab-button").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Show selected method
    const selectedContent = document.getElementById(`${method}-payment`);
    const selectedTab = document.querySelector(
      `[onclick="showPaymentMethod('${method}')"]`
    );

    if (selectedContent) {
      selectedContent.classList.remove("hidden");
      selectedContent.classList.add("active");
    }

    if (selectedTab) {
      selectedTab.classList.add("active");
    }

    // Track payment method selection
    this.trackEvent("payment_method_selected", { method });

    // Generate PIX code if PIX is selected
    if (method === "pix") {
      this.generatePixCode();
    }
  }

  // Enhanced PIX code generation
  async generatePixCode() {
    try {
      const response = await fetch(
        `${window.CONFIG.API_BASE_URL}/generate-pix`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            plan: "premium",
            amount: 19.0,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.pixCode) {
        const pixInput = document.getElementById("pix-code-input");
        if (pixInput) {
          pixInput.value = data.pixCode;
        }

        // Generate QR Code
        const canvas = document.getElementById("qr-canvas");
        if (canvas && typeof QRCode !== "undefined") {
          QRCode.toCanvas(canvas, data.pixCode, {
            width: 200,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
        }
      }
    } catch (error) {
      console.error("PIX generation error:", error);
    }
  }

  copyPixCode() {
    const pixInput = document.getElementById("pix-code-input");
    if (pixInput) {
      pixInput.select();
      document.execCommand("copy");
      const message = window.translations[window.currentLang].notifications.pixCopied;
      this.showNotification(message, "success");

      this.trackEvent("pix_code_copied", { language: window.currentLang });
    }
  }

  // Contact sales
  contactSales() {
    this.trackEvent("contact_sales_clicked", { language: window.currentLang });
    const subject =
      window.currentLang === "pt"
        ? "Interesse no Plano Enterprise"
        : "Interest in Enterprise Plan";
    window.open(
      `mailto:sales@salesforcearcpilot.com?subject=${encodeURIComponent(
        subject
      )}`,
      "_blank"
    );
  }

  // Show demo
  showDemo() {
    this.trackEvent("demo_requested");
    const message = window.translations[window.currentLang].notifications.demoSoon;
    this.showNotification(message, "success");
  }

  // Initialize everything when DOM loads
  document.addEventListener("DOMContentLoaded", function () {
    // Track page view
    this.trackEvent("page_view", {
      page: window.location.pathname,
      referrer: document.referrer,
    });

    // Initialize tooltips and other interactive elements
    this.initializeInteractiveElements();

    // Preload critical images
    this.preloadImages();
  });

  initializeInteractiveElements() {
    // Add hover effects to buttons
    document.querySelectorAll("button, .btn, .nav-link").forEach((element) => {
      element.addEventListener("mouseenter", function () {
        this.style.transform = "translateY(-2px)";
      });

      element.addEventListener("mouseleave", function () {
        this.style.transform = "";
      });
    });

    // Add click animations
    document.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", function () {
        this.style.transform = "scale(0.95)";
        setTimeout(() => {
          this.style.transform = "";
        }, 150);
      });
    });
  }

  preloadImages() {
    const imageUrls = [
      "images/app-screenshot.png",
      "images/avatars/dev1.jpg",
      "images/avatars/dev2.jpg",
      "images/avatars/dev3.jpg",
    ];

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new LandingPage();
});

// Global functions for onclick handlers
function toggleLanguage() {
  window.landingPage.toggleLanguage();
}
function selectPlan(plan) {
  window.landingPage.selectPlan(plan);
}
function closeModal() {
  window.landingPage.closeModal();
}
function showPaymentMethod(method) {
  window.landingPage.showPaymentMethod(method);
}
function copyPixCode() {
  window.landingPage.copyPixCode();
}
function downloadApp() {
  window.landingPage.downloadApp();
}
function scrollToDownload() {
  window.landingPage.scrollToDownload();
}
function showDemo() {
  window.landingPage.showDemo();
}
function contactSales() {
  window.landingPage.contactSales();
}
function subscribeEmail(event) {
  window.landingPage.subscribeEmail(event);
}
function toggleFaq(button) {
  window.landingPage.toggleFaq(button);
}

// Store instance globally
window.landingPage = new LandingPage();

// Service Worker for offline support
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").catch(console.error);
}
