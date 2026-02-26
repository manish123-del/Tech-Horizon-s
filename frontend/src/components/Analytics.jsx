import React, { useEffect, useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function Analytics() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    urgentCases: 0,
    angryCustomers: 0,
  });

  useEffect(() => {
    let mounted = true;
    fetch(`${BACKEND_URL}/stats`)
      .then((r) => r.json())
      .then((d) => {
        if (mounted) setStats(d);
      })
      .catch(() => {});
    const interval = setInterval(() => {
      fetch(`${BACKEND_URL}/stats`)
        .then((r) => r.json())
        .then((d) => setStats(d))
        .catch(() => {});
    }, 3000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="analytics">
      <h2>Dashboard</h2>
      <div className="cards">
        <div className="card">
          <div className="card-title">Total conversations</div>
          <div className="card-value">{stats.totalConversations}</div>
        </div>
        <div className="card">
          <div className="card-title">Urgent cases</div>
          <div className="card-value">{stats.urgentCases}</div>
        </div>
        <div className="card">
          <div className="card-title">Angry customers</div>
          <div className="card-value">{stats.angryCustomers}</div>
        </div>
      </div>
      <p className="note">
        This demo stores metrics in memory. Persist to a database for production.
      </p>
    </div>
  );
}
