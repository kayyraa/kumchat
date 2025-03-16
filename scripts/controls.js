document.addEventListener("touchstart", (Event) => {
    if (Event.touches.length > 1) Event.preventDefault();
}, { passive: false });

document.addEventListener("dblclick", (Event) => Event.preventDefault(), { passive: false });