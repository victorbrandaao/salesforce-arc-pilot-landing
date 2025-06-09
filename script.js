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
