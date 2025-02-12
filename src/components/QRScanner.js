import React, { useEffect, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useTranslation } from 'react-i18next';

const QRScanner = ({ onScanSuccess, onScanError }) => {
    const { t } = useTranslation();
  const [scanResult, setScanResult] = useState(null);

  useEffect(() => {
    // Инициализация сканера
    const scanner = new Html5QrcodeScanner(
      "qr-scanner", // ID элемента, в котором будет отображаться сканер
      {
        fps: 10, // Количество кадров в секунду
        qrbox: 250, // Размер области сканирования
      },
      false // verbose (подробный вывод в консоль)
    );

    // Обработка успешного сканирования
    const onScanSuccessHandler = (decodedText) => {
      setScanResult(decodedText);
      scanner.clear(); // Остановить сканирование после успешного сканирования
      if (onScanSuccess) onScanSuccess(decodedText); // Вызов callback-функции
    };

    // Обработка ошибок сканирования
    const onScanErrorHandler = (error) => {
      console.error("Ошибка при сканировании:", error);
      if (onScanError) onScanError(error); // Вызов callback-функции
    };

    // Запуск сканера
    scanner.render(onScanSuccessHandler, onScanErrorHandler);

    // Очистка сканера при размонтировании компонента
    return () => {
      scanner.clear();
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div>
      <div id="qr-scanner"></div>
      {scanResult && <p>{t('scaned')} {scanResult}</p>}
    </div>
  );
};

export default QRScanner;