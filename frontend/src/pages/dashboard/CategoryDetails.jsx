import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import usePageTitle from "../../hooks/usePageTitle";

import CategoryDetailsHeader from "../../components/categories/CategoryDetailsHeader";
import CategoryItemToolbar from "../../components/categories/CategoryItemToolbar";
import CategoryItemsTable from "../../components/categories/CategoryItemsTable";
import CategoryItemForm from "../../components/categories/CategoryItemForm";
import {
    getPropertyTypes,
    deletePropertyType,
} from "../../services/propertyTypeService";
import {
  successToast,
  errorToast,
} from "../../utils/toast";
import {
  getCategories,
} from "../../services/categoryService";

import { confirmDelete } from "../../utils/confirm";
function CategoryDetails() {
  usePageTitle("تفاصيل القسم — سكني");
  const { id } = useParams();

  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);

  // بيانات مؤقتة لحد الباك إند
  const [items, setItems] = useState([]);
  const [categoryName, setCategoryName] = useState("");
const loadItems = async () => {
    try {

        const data = await getPropertyTypes();

        setItems(
            data.filter(item => item.category_id == id)
        );

    } catch (error) {
        console.error(error);
    }
};

const loadCategory = async () => {
  try {
    const data = await getCategories();

    const category = data.find(
      (item) => item.id == id
    );

    setCategoryName(category?.name || "");
  } catch (error) {
    console.error(error);
  }
};

useEffect(() => {
  loadItems();
  loadCategory();
}, [id]);
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

 const handleDelete = async (id) => {

  const confirmed = await confirmDelete("النوع");

  if (!confirmed) return;

  try {

    await deletePropertyType(id);

    successToast("تم حذف النوع بنجاح");

    await loadItems();

  } catch (error) {

    errorToast(
      error.response?.data?.message ||
      "حدث خطأ أثناء حذف النوع"
    );

    console.error(error);

  }
};

  return (
    <div className="p-8">

      <CategoryDetailsHeader
       categoryName={categoryName || "جارٍ التحميل..."}
        onAdd={() => {
          setSelectedItem(null);
          setOpenForm(true);
        }}
      />

      <CategoryItemToolbar
        search={search}
        setSearch={setSearch}
      />

   <CategoryItemsTable
  items={filteredItems}
  onEdit={(item) => {
    setSelectedItem(item);
    setOpenForm(true);
  }}
  onDelete={handleDelete}
/>

      {openForm && (
       <CategoryItemForm
  item={selectedItem}
  categoryId={id}
  loadItems={loadItems}
  onClose={() => {
    setOpenForm(false);
    setSelectedItem(null);
  }}
/>
      )}

    </div>
  );
}

export default CategoryDetails;