import React from "react";
import { CheckCircle2 } from "lucide-react";

function PropertyStatus({
  value = "available",
  onChange,
}) {
  const options = [
    {
      value: "available",
      label: "متاح",
      color: "#16A34A",
    },
    {
      value: "reserved",
      label: "محجوز",
      color: "#F59E0B",
    },
    {
      value: "sold",
      label: "تم البيع",
      color: "#DC2626",
    },
    {
      value: "rented",
      label: "تم التأجير",
      color: "#2563EB",
    },
  ];

  return (
    <div className="flex items-center gap-2">

      <CheckCircle2
        size={18}
        color={options.find(o => o.value === value)?.color}
      />

      <select
        value={value}
       onChange={(e) => {
  console.log(e.target.value);
  onChange(e.target.value);
}}
        className="border rounded-lg px-3 py-2 outline-none bg-white"
      >
        {options.map((status) => (
          <option
            key={status.value}
            value={status.value}
          >
            {status.label}
          </option>
        ))}
      </select>

    </div>
  );
}

export default PropertyStatus;