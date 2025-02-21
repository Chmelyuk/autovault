import React from 'react';
import './CircularProgressBar.css'; // Новый файл стилей
import { useTranslation } from 'react-i18next';

const CircularProgressBar = ({ progress, total }) => {
  const { t } = useTranslation();
  const percentage = Math.min((progress / total) * 100, 100); // Ограничиваем до 100%
  let color = '#4caf50'; // Зеленый по умолчанию

  if (percentage < 30) {
    color = '#f44336'; // Красный
  } else if (percentage < 60) {
    color = '#ff9800'; // Оранжевый
  }

  // Рассчитываем длину окружности для SVG
  const radius = 50; // Радиус круга
  const circumference = 2 * Math.PI * radius; // Длина окружности
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="circular-progress-container">
      <svg className="circular-progress" width="120" height="120">
        {/* Фоновая окружность */}
        <circle
          className="circular-progress-background"
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
        />
        {/* Прогресс */}
        <circle
          className="circular-progress-bar"
          cx="60"
          cy="60"
          r={radius}
          strokeWidth="10"
          stroke={color}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="circular-progress-text">
        <span>{progress} {t('km')}</span>
        <span>{Math.round(percentage)}%</span>
      </div>
    </div>
  );
};

export default CircularProgressBar;