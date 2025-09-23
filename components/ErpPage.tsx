import React from 'react';
import { useI18n } from '../context/I18nContext';
import CustomerManagement from './erp/crm/CustomerManagement';
import ComingSoonCard from './ComingSoonCard';

interface ErpPageProps {
  activeView: string;
}

const ErpPage: React.FC<ErpPageProps> = ({ activeView }) => {
  const { t } = useI18n();

  const renderSubPage = () => {
    const subView = activeView.substring(activeView.lastIndexOf('/') + 1);

    switch (subView) {
      case 'clients':
        return <CustomerManagement />;
      default:
        return <ComingSoonCard />;
    }
  };

  return (
    <div>
      {renderSubPage()}
    </div>
  );
};

export default ErpPage;
