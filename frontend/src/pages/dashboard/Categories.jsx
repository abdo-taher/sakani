import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import CategoryHeader from "../../components/categories/CategoryHeader";
import CategoryToolbar from "../../components/categories/CategoryItemToolbar";
import CategoryTable from "../../components/categories/CategoryTable";
import { getCategories } from "../../services/categoryService";
import { errorToast } from "../../utils/toast";

function Categories() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);

  const loadCategories = async () => {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (error) {
      errorToast("تعذر تحميل الأقسام");
      console.error(error);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">

      <CategoryHeader />

      <CategoryToolbar
        search={search}
        setSearch={setSearch}
      />

      <CategoryTable
        categories={filteredCategories}
        onManage={(category) =>
          navigate(`/dashboard/categories/${category.id}`)
        }
      />

    </div>
  );
}

export default Categories;