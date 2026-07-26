import React, { useEffect, useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";

import StatisticsHeader from "../../components/statistics/StatisticsHeader";
import StatisticsCards from "../../components/statistics/StatisticsCards";
import StatisticsCharts from "../../components/statistics/StatisticsCharts";
import StatisticsActivity from "../../components/statistics/StatisticsActivity";
import StatisticsSummary from "../../components/statistics/StatisticsSummary";

import { getStatisticsData } from "../../services/statisticsService";

function Statistics() {
  usePageTitle("الإحصائيات — سكني");
  const [cards, setCards] = useState(null);
  const [propertyDistribution, setPropertyDistribution] = useState([]);
  const [reservationStatus, setReservationStatus] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getStatisticsData();

        setCards(data.cards);
        setPropertyDistribution(data.property_distribution || []);
        setReservationStatus(data.reservation_status || []);
        setActivities(data.recent_activity || []);
        setSummary(data.summary);
      } catch (error) {
        console.error("فشل تحميل بيانات الإحصائيات:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">

      {/* عنوان الصفحة */}
      <StatisticsHeader />

      {/* الكروت */}
      <StatisticsCards cards={cards} loading={loading} />

      {/* الرسوم البيانية */}
      <StatisticsCharts
        propertyDistribution={propertyDistribution}
        reservationStatus={reservationStatus}
        loading={loading}
      />

      {/* آخر نشاط */}
      <StatisticsActivity activities={activities} loading={loading} />

      {/* الملخص والتحليل */}
      <StatisticsSummary summary={summary} loading={loading} />

    </div>
  );
}

export default Statistics;