// Get current language from localStorage or default to Portuguese
window.currentLang = localStorage.getItem("language") || "pt";

// Enhanced language system
function toggleLanguage() {
  const newLang = window.currentLang === "pt" ? "en" : "pt";
  setLanguage(newLang);

  // Show notification
  const message = window.translations[newLang].notifications.languageChanged;
  showNotification(message, "success");

  // Track language change
  trackEvent("language_changed", { from: window.currentLang, to: newLang });
}

function setLanguage(lang) {
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
  updateTranslations();

  // Update currency and pricing
  updatePricing(lang);

  // Update typewriter effect
  updateTypewriterWords(lang);
}

function updateTranslations() {
  const translations = window.translations[window.currentLang];

  // Update elements with data-i18n attribute
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    const translation = getNestedTranslation(translations, key);

    if (translation) {
      element.textContent = translation;
    }
  });

  // Update placeholders
  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    const translation = getNestedTranslation(translations, key);

    if (translation) {
      element.placeholder = translation;
    }
  });

  // Update meta tags
  const titleMeta = document.querySelector("title[data-i18n]");
  if (titleMeta) {
    const key = titleMeta.getAttribute("data-i18n");
    const translation = getNestedTranslation(translations, key);
    if (translation) {
      document.title = translation;
    }
  }

  const descMeta = document.querySelector(
    'meta[name="description"][data-i18n]'
  );
  if (descMeta) {
    const key = descMeta.getAttribute("data-i18n");
    const translation = getNestedTranslation(translations, key);
    if (translation) {
      descMeta.setAttribute("content", translation);
    }
  }
}

function getNestedTranslation(obj, key) {
  return key.split(".").reduce((o, k) => (o || {})[k], obj);
}

function updatePricing(lang) {
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
  const enterprisePrice = document.querySelector(
    ".pricing-card:last-child .amount"
  );
  if (
    enterprisePrice &&
    !enterprisePrice.classList.contains("monthly") &&
    !enterprisePrice.classList.contains("yearly")
  ) {
    enterprisePrice.textContent = lang === "pt" ? "199" : "99";
  }
}

function updateTypewriterWords(lang) {
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
function initializeTypewriterEffect() {
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
function showNotification(message, type = "success", duration = 5000) {
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
async function subscribeEmail(event) {
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
    showNotification(errorMsg, "error");
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
      showNotification(successMsg, "success");
      emailInput.value = "";

      // Track successful subscription
      trackEvent("email_subscribed", {
        email_domain: email.split("@")[1],
        source: "landing_page",
        language: window.currentLang,
      });
    } else {
      const errorMsg =
        data.message ||
        window.translations[window.currentLang].notifications.error;
      showNotification(errorMsg, "error");
    }
  } catch (error) {
    console.error("Subscription error:", error);
    const errorMsg =
      window.currentLang === "pt"
        ? "Erro de conexão. Tente novamente."
        : "Connection error. Please try again.";
    showNotification(errorMsg, "error");
  } finally {
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
}

// Enhanced functions with language support
async function downloadApp(type = "free") {
  try {
    // Track download intent
    trackEvent("download_started", { type, language: window.currentLang });

    const response = await fetch(
      `${window.CONFIG.API_BASE_URL}/download-link`,
      {
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
      }
    );

    const data = await response.json();

    if (response.ok && data.downloadUrl) {
      const successMsg =
        window.translations[window.currentLang].notifications.downloadStarted;
      showNotification(successMsg, "success");

      // Create download link
      const link = document.createElement("a");
      link.href = data.downloadUrl;
      link.download = `salesforce-arc-pilot-${type}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track successful download
      trackEvent("download_completed", { type, language: window.currentLang });
    } else {
      const errorMsg =
        window.currentLang === "pt"
          ? "Link de download temporariamente indisponível"
          : "Download link temporarily unavailable";
      showNotification(errorMsg, "error");
    }
  } catch (error) {
    console.error("Download error:", error);
    const errorMsg =
      window.currentLang === "pt"
        ? "Erro ao gerar link de download"
        : "Error generating download link";
    showNotification(errorMsg, "error");
  }
}

function showDemo() {
  trackEvent("demo_requested", { language: window.currentLang });
  const message =
    window.translations[window.currentLang].notifications.demoSoon;
  showNotification(message, "success");
}

function copyPixCode() {
  const pixInput = document.getElementById("pix-code-input");
  if (pixInput) {
    pixInput.select();
    document.execCommand("copy");
    const message =
      window.translations[window.currentLang].notifications.pixCopied;
    showNotification(message, "success");

    trackEvent("pix_code_copied", { language: window.currentLang });
  }
}

function contactSales() {
  trackEvent("contact_sales_clicked", { language: window.currentLang });
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

// Enhanced analytics tracking with language
function trackEvent(eventName, parameters = {}) {
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
function toggleFaq(button) {
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
    trackEvent("faq_opened", {
      question: button.querySelector("span").textContent,
      language: window.currentLang,
    });
  }
}

// Enhanced modal functionality
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Track modal open
    trackEvent("modal_opened", { modal_id: modalId });
  }
}

function closeModal() {
  const modals = document.querySelectorAll(".modal");
  modals.forEach((modal) => {
    modal.classList.remove("active");
  });
  document.body.style.overflow = "";
}

// Enhanced payment selection
function selectPlan(plan) {
  showModal("payment-modal");

  // Track plan selection
  trackEvent("plan_selected", { plan });

  // Update modal content based on plan
  const modalTitle = document.querySelector("#payment-modal h2");
  if (modalTitle) {
    modalTitle.textContent = `Assinar Plano ${
      plan.charAt(0).toUpperCase() + plan.slice(1)
    }`;
  }
}

// Enhanced payment methods
function showPaymentMethod(method) {
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
  trackEvent("payment_method_selected", { method });

  // Generate PIX code if PIX is selected
  if (method === "pix") {
    generatePixCode();
  }
}

// Enhanced PIX code generation
async function generatePixCode() {
  try {
    const response = await fetch(`${window.CONFIG.API_BASE_URL}/generate-pix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: "premium",
        amount: 19.0,
      }),
    });

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

// Scroll to download
function scrollToDownload() {
  const downloadSection =
    document.querySelector(".email-capture") || document.querySelector(".hero");
  if (downloadSection) {
    downloadSection.scrollIntoView({ behavior: "smooth" });
  }
}

// Enhanced animations and interactions
function initializeEnhancedFeatures() {
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

function initializeScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in-up");
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe elements for animation
  document
    .querySelectorAll(
      ".feature-card, .pricing-card, .testimonial-card, .faq-item"
    )
    .forEach((el) => {
      observer.observe(el);
    });
}

function initializeParallaxEffects() {
  const heroImage = document.querySelector(".hero-image");

  if (heroImage) {
    window.addEventListener("scroll", () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      heroImage.style.transform = `perspective(1000px) rotateY(-15deg) rotateX(10deg) translateY(${rate}px)`;
    });
  }
}

function initializeInteractiveElements() {
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

function preloadImages() {
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

// Initialize language system on page load
document.addEventListener("DOMContentLoaded", function () {
  // Set initial language
  setLanguage(window.currentLang);

  // Track page view with language
  trackEvent("page_view", {
    page: window.location.pathname,
    referrer: document.referrer,
    language: window.currentLang,
  });

  // Initialize other features
  initializeEnhancedFeatures();
  initializeScrollAnimations();
  initializeParallaxEffects();
  initializeTypewriterEffect();
  initializeInteractiveElements();
  preloadImages();
});

// Close modal when clicking outside
document.addEventListener("click", function (event) {
  const modals = document.querySelectorAll(".modal.active");
  modals.forEach((modal) => {
    if (event.target === modal) {
      closeModal();
    }
  });
});

// Keyboard shortcuts
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeModal();
  }
});

// Enhanced error handling
window.addEventListener("error", function (event) {
  console.error("JavaScript error:", event.error);

  // Track errors for debugging
  trackEvent("javascript_error", {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
  });
});

// Service Worker registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function (registration) {
        console.log("SW registered: ", registration);
      })
      .catch(function (registrationError) {
        console.log("SW registration failed: ", registrationError);
      });
  });
}
