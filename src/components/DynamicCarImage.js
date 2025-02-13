import React from 'react';

const DynamicCarImage = ({ brand, model, bodyType }) => {
  // Функция для генерации SVG на основе параметров
  const generateCarSVG = () => {
    const baseWidth = 250;
    const baseHeight = 120;

    // Параметры для разных типов кузова
    const bodyStyles = {
      sedan: {
        bodyHeight: 50,
        roofHeight: 30,
        wheelRadius: 10,
        wheelOffsetY: 90,
      },
      hatchback: {
        bodyHeight: 50,
        roofHeight: 30,
        wheelRadius: 10,
        wheelOffsetY: 90,
        rearHeight: 40, // Высота задней части
      },
      suv: {
        bodyHeight: 60,
        roofHeight: 30,
        wheelRadius: 12,
        wheelOffsetY: 90,
      },
      coupe: {
        bodyHeight: 40,
        roofHeight: 30,
        wheelRadius: 10,
        wheelOffsetY: 90,
      },
    };

    const style = bodyStyles[bodyType] || bodyStyles.sedan;

    return (
      <svg width={baseWidth} height={baseHeight} viewBox={`0 0 ${baseWidth} ${baseHeight}`} xmlns="http://www.w3.org/2000/svg">
        {/* Кузов */}
        <rect
          x={20}
          y={baseHeight - style.bodyHeight - 10}
          width={210}
          height={style.bodyHeight}
          rx={10}
          fill="#4CAF50"
        />
        {/* Капот и крыша */}
        <rect
          x={30}
          y={baseHeight - style.bodyHeight - style.roofHeight - 10}
          width={190}
          height={style.roofHeight}
          rx={5}
          fill="#4CAF50"
        />
        {/* Фары */}
        <circle cx={15} cy={baseHeight - style.bodyHeight - 10} r={5} fill="#FFD700" />
        <circle cx={235} cy={baseHeight - style.bodyHeight - 10} r={5} fill="#FFD700" />
        {/* Решетка радиатора */}
        <rect
          x={100}
          y={baseHeight - style.bodyHeight - 15}
          width={50}
          height={10}
          fill="#333"
        />
        {/* Окна */}
        <rect
          x={40}
          y={baseHeight - style.bodyHeight - style.roofHeight - 5}
          width={50}
          height={20}
          rx={3}
          fill="#B0E0E6"
        />
        <rect
          x={110}
          y={baseHeight - style.bodyHeight - style.roofHeight - 5}
          width={50}
          height={20}
          rx={3}
          fill="#B0E0E6"
        />
        {/* Колеса */}
        <circle cx={60} cy={style.wheelOffsetY} r={style.wheelRadius} fill="#333" />
        <circle cx={190} cy={style.wheelOffsetY} r={style.wheelRadius} fill="#333" />
        {/* Надпись марки и модели */}
        <text
          x={125}
          y={20}
          textAnchor="middle"
          fontSize={12}
          fill="#000"
          fontFamily="Arial"
        >
          {brand} {model}
        </text>
      </svg>
    );
  };

  return (
    <div>
      {generateCarSVG()}
    </div>
  );
};

export default DynamicCarImage;