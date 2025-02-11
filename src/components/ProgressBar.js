import React from 'react';
import './ProgressBar.css'; // Создайте файл стилей для прогресс-бара

const ProgressBar = ({ progress, total }) => {
  const percentage = (progress / total) * 100;
  let color = 'green';

  if (percentage < 30) {
    color = 'red';
  } else if (percentage < 60) {
    color = 'orange';
  }

  return (
    <div className="progress-bar-container">
      <div
        className="progress-bar"
        style={{ width: `${percentage}%`, backgroundColor: color }}
      ></div>
      <span className="progress-text">{progress} км до замены масла</span>
    </div>
  );
};

export default ProgressBar;