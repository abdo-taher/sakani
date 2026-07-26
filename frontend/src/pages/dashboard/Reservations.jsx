import React, { useState } from "react";
import usePageTitle from "../../hooks/usePageTitle";

import ReservationHeader from "../../components/reservations/ReservationHeader";
import ReservationToolbar from "../../components/reservations/ReservationToolbar";
import ReservationTable from "../../components/reservations/ReservationTable";
import ReservationDetails from "../../components/reservations/ReservationDetails";
import ReservationTabs from "../../components/reservations/ReservationTabs";
import NeedRequestToolbar from "../../components/reservations/needs/NeedRequestToolbar";
import NeedRequestTable from "../../components/reservations/needs/NeedRequestTable";
import NeedRequestDetails from "../../components/reservations/needs/NeedRequestDetails";
import { useEffect } from "react";
import {
  getReservations,
  deleteReservation,
} from "../../services/reservationService";
import Swal from "sweetalert2";
import {
  getNeedRequests,
  deleteNeedRequest,
} from "../../services/needRequestService";
function Reservations() {
  usePageTitle("طلبات الحجز — سكني");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
const [activeTab, setActiveTab] = useState("reservations");
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [requestType, setRequestType] = useState("");

const [needRequests, setNeedRequests] = useState([]);

const [selectedRequest, setSelectedRequest] = useState(null);

  const [reservations, setReservations] = useState([]);
  useEffect(() => {
  loadReservations();
  loadNeedRequests();
}, []);

const loadReservations = async () => {
  try {
    const data = await getReservations();
    setReservations(data);
  } catch (error) {
    console.error(error);
  }
};

   const loadNeedRequests = async () => {
  try {
    const data = await getNeedRequests();
    setNeedRequests(data);
  } catch (error) {
    console.error(error);
  }
};

  const filteredReservations = reservations.filter((reservation) => {
 const matchSearch =
  reservation.name
    ?.toLowerCase()
    .includes(search.toLowerCase()) ||
  reservation.phone
    ?.includes(search) ||
  reservation.property?.title
    ?.toLowerCase()
    .includes(search.toLowerCase());

    const matchStatus =
      !status || reservation.status === status;

    return matchSearch && matchStatus;
  });
  const filteredRequests = needRequests.filter((request) => {
  const matchSearch =
  request.name
    ?.toLowerCase()
    .includes(search.toLowerCase()) ||
  request.phone?.includes(search);

  const matchStatus =
    !status || request.status === status;

 const matchType =
  !requestType || request.listing_type === requestType;

  return matchSearch && matchStatus && matchType;
});

  const handleDelete = async (id) => {
  const result = await Swal.fire({
    title: "حذف طلب الحجز؟",
    text: "لن تستطيع استرجاع طلب الحجز بعد الحذف.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "نعم، احذف",
    cancelButtonText: "إلغاء",
    reverseButtons: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#9ca3af",
  });

  if (!result.isConfirmed) return;

  try {
    await deleteReservation(id);

    setReservations((prev) =>
      prev.filter((item) => item.id !== id)
    );

    Swal.fire({
      icon: "success",
      title: "تم الحذف",
      text: "تم حذف طلب الحجز بنجاح.",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error(error);

    Swal.fire({
      icon: "error",
      title: "حدث خطأ",
      text: "تعذر حذف طلب الحجز.",
    });
  }
};

  const handleSaveStatus = (newStatus) => {
    setReservations((prev) =>
      prev.map((item) =>
        item.id === selectedReservation.id
          ? {
              ...item,
              status: newStatus,
            }
          : item
      )
    );

    setSelectedReservation(null);
  };
  const handleDeleteRequest = (id) => {
  const confirmed = window.confirm(
    "هل أنت متأكد من حذف الطلب؟"
  );

  if (!confirmed) return;

  setNeedRequests((prev) =>
    prev.filter((item) => item.id !== id)
  );
};

const handleSaveRequestStatus = (newStatus) => {
  setNeedRequests((prev) =>
    prev.map((item) =>
      item.id === selectedRequest.id
        ? {
            ...item,
            status: newStatus,
          }
        : item
    )
  );

  setSelectedRequest(null);
};

  return (
    <div className="space-y-6">

      <ReservationHeader />
        <ReservationTabs
    activeTab={activeTab}
    setActiveTab={setActiveTab}
/>
    {activeTab === "reservations" ? (
  <>
    <ReservationToolbar
      search={search}
      setSearch={setSearch}
      status={status}
      setStatus={setStatus}
    />

    <ReservationTable
      reservations={filteredReservations}
      onView={(reservation) =>
        setSelectedReservation(reservation)
      }
      onDelete={handleDelete}
    />
    

    {selectedReservation && (
      <ReservationDetails
        reservation={selectedReservation}
        onClose={() =>
          setSelectedReservation(null)
        }
        onSaveStatus={handleSaveStatus}
      />
    )}
  </>
) : (
  <>
    <NeedRequestToolbar
      search={search}
      setSearch={setSearch}
      status={status}
      setStatus={setStatus}
      requestType={requestType}
      setRequestType={setRequestType}
    />

    <NeedRequestTable
      requests={filteredRequests}
      onView={(request) =>
        setSelectedRequest(request)
      }
      onDelete={handleDeleteRequest}
    />

    {selectedRequest && (
      <NeedRequestDetails
        request={selectedRequest}
        onClose={() =>
          setSelectedRequest(null)
        }
        onSaveStatus={handleSaveRequestStatus}
      />
    )}
  </>
)}

    </div>
  );
}

export default Reservations;