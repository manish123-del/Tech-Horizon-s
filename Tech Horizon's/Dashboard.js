import React, { useEffect, useState } from "react";
import { getAnalytics } from "../services/api";

const Dashboard = () => {
  const [data, setData] = useState({});

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  return (
    <div>
      <h2>📊 Analytics</h2>
      <p>Total Calls: {data.total}</p>
      <p>High Urgency: {data.highUrgency}</p>
      <p>Angry Users: {data.angry}</p>
    </div>
  );
};

export default Dashboard;