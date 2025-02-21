import React from 'react';
import './ProgressBar.css';
import { useTranslation } from 'react-i18next';

const ProgressBar = ({ progress, total }) => {
  const { t } = useTranslation();
  const percentage = Math.min((progress / total) * 100, 100); // Ограничиваем до 100%
  let statusClass = ''; // Класс для стилизации

  if (percentage < 30) {
    statusClass = 'low'; // Красный
  } else if (percentage < 60) {
    statusClass = 'medium'; // Оранжевый
  }

  return (
    <div className="progress-bar-container">
      <div
        className={`progress-bar ${statusClass}`}
        style={{ width: `${percentage}%` }}
      ></div>
      <span className="progress-text">{progress} {t('rangeToChange')}</span>
    </div>
  );
};

export default ProgressBar;