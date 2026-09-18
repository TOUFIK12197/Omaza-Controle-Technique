// js/toast.js
// 🔔 Système de notifications visuelles (toast) OMAZA

export function showToast(message, type = "success") {

    const container = getContainer();

    const colors = {
        success: { bg: "#16a34a", icon: "✅" },
        error:   { bg: "#dc2626", icon: "❌" },
        warning: { bg: "#f59e0b", icon: "⚠️" },
        info:    { bg: "#2563eb", icon: "📌" }
    };

    const { bg, icon } = colors[type] || colors.info;

    const toast = document.createElement("div");
    toast.className = "omaza-toast";
    toast.style.cssText = `
        background: ${bg};
        color: white;
        padding: 14px 18px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 10px 24px rgba(0,0,0,0.15);
        animation: omazaToastIn 0.3s ease;
        max-width: 360px;
        line-height: 1.4;
    `;

    toast.innerHTML = `<span style="font-size:18px;">${icon}</span><span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "omazaToastOut 0.3s ease forwards";
        setTimeout(() => toast.remove(), 280);
    }, 3500);
}

function getContainer() {
    let container = document.getElementById("omaza-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "omaza-toast-container";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 99999;
        `;
        document.body.appendChild(container);

        // Animations
        const style = document.createElement("style");
        style.textContent = `
            @keyframes omazaToastIn {
                from { opacity:0; transform:translateY(-15px); }
                to { opacity:1; transform:translateY(0); }
            }
            @keyframes omazaToastOut {
                from { opacity:1; transform:translateY(0); }
                to { opacity:0; transform:translateY(-15px); }
            }
            @media (max-width:600px) {
                #omaza-toast-container { right:10px; left:10px; top:10px; }
            }
        `;
        document.head.appendChild(style);
    }
    return container;
}

// Permettre l'utilisation globale
window.showToast = showToast;