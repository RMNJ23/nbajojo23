document.addEventListener("DOMContentLoaded", () => {
    const message = document.querySelector(".message");
    if (message && message.textContent.trim() !== "") {
        message.style.opacity = 0;
        setTimeout(() => {
            message.style.transition = "opacity 0.6s";
            message.style.opacity = 1;
        }, 100);
        setTimeout(() => {
            message.style.opacity = 0;
        }, 4000);
    }
});
