import { useEffect, useState } from 'react';
import api from '../../../utils/axiosConfig';

export const useCompanySlug = () => {
  const [companySlug, setCompanySlug] = useState<string>('');
  useEffect(() => {
    const loadCompanyInfo = async () => {
      try {
        const res = await api.get('/companies/current');
        if (res.data.success && res.data.company?.slug) {
          setCompanySlug(res.data.company.slug);
        }
      } catch (err) {
        // noop
      }
    };
    loadCompanyInfo();
  }, []);
  return companySlug;
};
