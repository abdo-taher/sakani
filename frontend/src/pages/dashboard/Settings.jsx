import React from "react";
import AdminSettings from "../../components/settings/AdminSettings";
import usePageTitle from "../../hooks/usePageTitle";

function Settings() {
  usePageTitle("الإعدادات — سكني");
  return (
    <div className="space-y-6">
      <AdminSettings />
    </div>
  );
}

export default Settings;