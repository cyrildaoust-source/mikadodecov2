// Native touch/trackpad scrolling, mouse dragging and keyboard navigation.
// Ordinary clicks and vertical wheel scrolling retain their browser behavior.
export function bindFamilyRails(root) {
  const behavior = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
  for (const rail of root.querySelectorAll('[data-famrail]')) {
    let gesture = null;
    let suppressClick = false;
    const sync = () => {
      const overflow = rail.scrollWidth > rail.clientWidth + 1;
      rail.tabIndex = overflow ? 0 : -1;
      rail.classList.toggle('is-scrollable', overflow);
    };
    rail.addEventListener('pointerdown', event => {
      suppressClick = false;
      if (event.pointerType !== 'mouse' || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.target.closest('button, input, select') || rail.scrollWidth <= rail.clientWidth + 1) return;
      gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rail.scrollLeft, dragging: false };
    });
    rail.addEventListener('pointermove', event => {
      if (!gesture || gesture.id !== event.pointerId) return;
      const dx = event.clientX - gesture.x;
      if (!gesture.dragging) {
        const dy = event.clientY - gesture.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 6) return;
        if (Math.abs(dy) > Math.abs(dx)) { gesture = null; return; }
        gesture.dragging = true;
        suppressClick = true;
        rail.classList.add('is-dragging');
        rail.setPointerCapture(event.pointerId);
      }
      event.preventDefault();
      rail.scrollLeft = gesture.left - dx;
    });
    const finish = () => {
      const id = gesture?.id;
      gesture = null;
      rail.classList.remove('is-dragging');
      if (id !== undefined && rail.hasPointerCapture(id)) rail.releasePointerCapture(id);
    };
    rail.addEventListener('pointerup', finish);
    rail.addEventListener('pointercancel', finish);
    rail.addEventListener('lostpointercapture', finish);
    rail.addEventListener('pointerleave', () => { if (!gesture?.dragging) finish(); });
    rail.addEventListener('dragstart', event => event.preventDefault());
    rail.addEventListener('click', event => {
      if (suppressClick && event.detail !== 0) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      suppressClick = false;
    }, true);
    rail.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.target.closest('input, select, textarea')) return;
      event.preventDefault();
      const links = [...rail.children].map(card => card.matches('a') ? card : card.querySelector('a')).filter(Boolean);
      const index = links.findIndex(link => link === event.target || link.contains(event.target));
      if (index >= 0) {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? links.length - 1 : Math.max(0, Math.min(links.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
        links[next].focus({ preventScroll: true });
        links[next].scrollIntoView({ behavior, block: 'nearest', inline: 'nearest' });
      } else if (event.key === 'Home' || event.key === 'End') {
        rail.scrollTo({ left: event.key === 'Home' ? 0 : rail.scrollWidth, behavior });
      } else {
        rail.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * Math.min(rail.clientWidth * .8, 640), behavior });
      }
    });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(rail);
    else window.addEventListener('resize', sync);
    sync();
  }
}
