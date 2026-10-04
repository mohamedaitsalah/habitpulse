// Replace this value with the live PayPal Payment Link before launch.
const CHECKOUT_URL = "";

document.querySelectorAll("[data-checkout]").forEach((link) => {
  link.addEventListener("click", (event) => {
    if (!CHECKOUT_URL) {
      event.preventDefault();
      document.querySelector("#pricing")?.scrollIntoView({ behavior: "smooth" });
    }
  });
});

document.querySelectorAll(".checkout-link:not([data-checkout])").forEach((link) => {
  if (CHECKOUT_URL) link.href = CHECKOUT_URL;
});

if (CHECKOUT_URL) {
  document.querySelectorAll("[data-checkout]").forEach((link) => {
    link.href = CHECKOUT_URL;
  });
}
