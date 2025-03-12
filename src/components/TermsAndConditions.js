import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';  
import './TermsAndConditions.css';
import { useTranslation } from 'react-i18next';

const TermsAndConditions = () => {
  const { i18n } = useTranslation();
  const language = i18n.language.split('-')[0];  
  const [terms, setTerms] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentDate = new Date().toLocaleDateString();

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        const { data, error } = await supabase
          .from('terms_and_conditions')
          .select('content, updated_at')
          .eq('language', language) 
          .single();

        if (error) {
          throw error;
        }

        setTerms(data.content);
      } catch (err) {
        setError('Failed to load terms and conditions.');
        console.error('Ошибка загрузки условий:', err.message || err);
      } finally {
        setLoading(false);
      }
    };

    fetchTerms();
  }, [language]);  

  if (loading) {
    return <div className="terms-container">Loading...</div>;
  }

  if (error || !terms) {
    return <div className="terms-container">{error || 'No terms available.'}</div>;
  }

  return (
    <div className="terms-container">
      <h1 className="terms-title">{terms.title}</h1>
      <p className="terms-date">Last updated: {currentDate}</p>
      <p className="terms-paragraph">{terms.intro}</p>

      {Object.keys(terms.sections).map((sectionKey, index) => (
        <div key={sectionKey}>
          <h2 className="terms-section-title">
            {index + 1}. {terms.sections[sectionKey].title}
          </h2>
          <ul className="terms-list">
            {terms.sections[sectionKey].items.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default TermsAndConditions;