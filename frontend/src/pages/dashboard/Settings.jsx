import React from "react";
import AdminSettings from "../../components/settings/AdminSettings";
import usePageTitle from "../../hooks/usePageTitle";

function Settings() {
  usePageTitle("الإعدادات — سكني");
  return (
    <div className="p-8">
      <AdminSettings />
    </div>
  );
}

export default Settings;