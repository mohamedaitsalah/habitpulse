// Paste the live $19 PayPal Payment Link here before launch.
const CHECKOUT_URL = "https://www.paypal.com/ncp/payment/CGHPHLZ8P5CYQ";

document.querySelectorAll(".screen-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const key = tab.dataset.screen;
    document.querySelectorAll(".screen-tab").forEach((el) => el.classList.toggle("active", el === tab));
    document.querySelectorAll(".product-screen").forEach((el) => el.classList.toggle("active", el.dataset.view === key));
    document.querySelectorAll(".screen-copy").forEach((el) => el.classList.toggle("active", el.dataset.copy === key));
  });
});

document.querySelectorAll(".checkout-link").forEach((link) => {
  if (CHECKOUT_URL) {
    link.href = CHECKOUT_URL;
  } else if (link.hasAttribute("data-checkout")) {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
    });
  }
});
