(() => {
  const cfg = window.SupportAI || {};
  const btn = document.createElement("button");
  btn.textContent = cfg.label || "Chat";
  btn.style.position = "fixed";
  btn.style.right = "16px";
  btn.style.bottom = "16px";
  btn.style.zIndex = "99999";
  btn.style.background = cfg.color || "#111";
  btn.style.color = "#fff";
  btn.style.border = "1px solid #333";
  btn.style.borderRadius = "999px";
  btn.style.padding = "12px 18px";
  document.body.appendChild(btn);
  btn.addEventListener("click", () => {
    const url = cfg.url || "http://localhost:3000/chat";
    // open as popup or embed in iframe
    if (cfg.inline && document.getElementById("support-ai-widget")) {
      // if an iframe already exists, toggle visibility
      const iframe = document.getElementById("support-ai-widget");
      iframe.style.display = iframe.style.display === "none" ? "block" : "none";
    } else if (cfg.inline) {
      const ifr = document.createElement("iframe");
      ifr.id = "support-ai-widget";
      ifr.src = url;
      ifr.style.position = "fixed";
      ifr.style.bottom = "80px";
      ifr.style.right = "16px";
      ifr.style.width = "360px";
      ifr.style.height = "640px";
      ifr.style.border = "1px solid #333";
      ifr.style.zIndex = "99999";
      document.body.appendChild(ifr);
    } else {
      const w = window.open(url, "_blank", "width=420,height=740");
      if (w) w.focus();
    }
  });
})();
