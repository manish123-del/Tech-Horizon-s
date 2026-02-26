export const sendMessage = async (message) => {
  const res = await fetch("http://localhost:5000/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  return res.json();
};

export const getAnalytics = async () => {
  const res = await fetch("http://localhost:5000/api/analytics");
  return res.json();
};