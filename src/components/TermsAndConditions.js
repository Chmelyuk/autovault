import React from 'react';
import { useTranslation } from 'react-i18next';  // Импортируем хук для перевода
import './TermsAndConditions.css';

const TermsAndConditions = () => {
  const { t } = useTranslation();  // Используем хук для перевода

  const currentDate = new Date().toLocaleDateString();

  return (
    <div className="terms-container">
      <h1 className="terms-title">{t('termsAndConditionsTitle')}</h1>
      <p className="terms-date">{t('lastUpdated')}: {currentDate}</p>
      
      <p className="terms-paragraph">
        {t('termsIntro')}
      </p>
      
      <h2 className="terms-section-title">1. {t('generalTerms')}</h2>
      <ul className="terms-list">
        <li>{t('generalTerms1')}</li>
        <li>{t('generalTerms2')}</li>
      </ul>

      <h2 className="terms-section-title">2. {t('registration')}</h2>
      <ul className="terms-list">
        <li>{t('registration1')}</li>
        <li>{t('registration2')}</li>
      </ul>

      <h2 className="terms-section-title">3. {t('privacy')}</h2>
      <ul className="terms-list">
        <li>{t('privacy1')}</li>
        <li>{t('privacy2')}</li>
        <li>{t('privacy3')}</li>
      </ul>

      <h2 className="terms-section-title">4. {t('usage')}</h2>
      <ul className="terms-list">
        <li>{t('usage1')}</li>
        <li>{t('usage2')}</li>
        <li>{t('usage3')}</li>
      </ul>

      <h2 className="terms-section-title">5. {t('disclaimer')}</h2>
      <ul className="terms-list">
        <li>{t('disclaimer1')}</li>
        <li>{t('disclaimer2')}</li>
        <li>{t('disclaimer3')}</li>
      </ul>

      <h2 className="terms-section-title">6. {t('changes')}</h2>
      <ul className="terms-list">
        <li>{t('changes1')}</li>
        <li>{t('changes2')}</li>
      </ul>

      <h2 className="terms-section-title">7. {t('disputeResolution')}</h2>
      <ul className="terms-list">
        <li>{t('disputeResolution1')}</li>
        <li>{t('disputeResolution2')}</li>
      </ul>

      <h2 className="terms-section-title">8. {t('contact')}</h2>
      <p className="terms-paragraph">
        {t('contactText')}
      </p>

      <p className="terms-paragraph">
        {t('acceptance')}
      </p>
    </div>
  );
};

export default TermsAndConditions;
