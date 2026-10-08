/* Body scroll-lock shared by the cart drawer and the mobile menu drawer.
   Single source of truth: same scrollbar-width compensation + the same
   `cartd-locked` body class for both. The two drawers are mutually
   exclusive (opening one closes the other), so they never fight the lock. */
export function lockBodyScroll(on) {
  if (on) {
    const sw = window.innerWidth - document.documentElement.clientWidth;
    if (sw > 0) document.body.style.paddingRight = sw + "px";
    document.body.classList.add("cartd-locked");
  } else {
    document.body.classList.remove("cartd-locked");
    document.body.style.paddingRight = "";
  }
}
