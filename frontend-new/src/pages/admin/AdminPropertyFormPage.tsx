import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PropertyFormWizard } from '../../components/PropertyFormWizard';

export const AdminPropertyFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="py-2">
      <PropertyFormWizard
        initialPropertyId={id}
        isAdmin={true}
        onSuccess={() => {
          navigate('/admin/properties');
        }}
        onCancel={() => {
          navigate('/admin/properties');
        }}
      />
    </div>
  );
};
