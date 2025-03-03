import { useEffect, useState, useRef } from "react";
import { useTranslation } from 'react-i18next';

const SPEED_THRESHOLD_CAR = 30; // Минимальная скорость для автомобиля (км/ч)

export default function CarTracker({ user, car, supabase, setCar }) {
  const { t } = useTranslation();
  const [lastCoords, setLastCoords] = useState(null); // Для UI и последних координат
  const [hasLocationPermission, setHasLocationPermission] = useState(false); // Статус доступа к геолокации
  const lastCoordsRef = useRef(null); // Для логики отслеживания

  useEffect(() => {
    if (!navigator.geolocation) {
      console.error("Геолокация не поддерживается вашим браузером");
       
      setHasLocationPermission(false);
      return;
    }

    if (!user || !car) return;

    // Проверка начального статуса разрешения геолокации
    const checkPermission = async () => {
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          setHasLocationPermission(permissionStatus.state === 'granted');
          permissionStatus.onchange = () => {
            setHasLocationPermission(permissionStatus.state === 'granted');
          };
        } catch (error) {
          console.error("Ошибка проверки разрешения геолокации:", error);
        }
      }
    };

    checkPermission();

    console.log("Запуск отслеживания геолокации...");

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const speedKmh = (speed || 0) * 3.6;

        console.log(`📍 Скорость: ${speedKmh} км/ч, Координаты: ${latitude}, ${longitude}`);

        // Устанавливаем разрешение как true, если получили позицию
        setHasLocationPermission(true);

        if (speedKmh >= SPEED_THRESHOLD_CAR) {
          if (lastCoordsRef.current) {
            const distance = calculateDistance(lastCoordsRef.current, { latitude, longitude });

            if (distance > 0.05) { // Только если проехали больше 50 метров
              console.log(`🛣 Пройдено: ${distance.toFixed(2)} км`);
              updateCarMileage(distance);
            }
          }
          lastCoordsRef.current = { latitude, longitude };
          setLastCoords({ latitude, longitude });
        }
      },
      (error) => {
        console.error("❌ Ошибка геолокации:", error);
        // Определяем статус разрешения на основе ошибки
        if (error.code === error.PERMISSION_DENIED) {
          setHasLocationPermission(false);
        }
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 10000 }
    );

    return () => {
      console.log("Остановка отслеживания геолокации...");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [user, car, supabase, setCar, t]);

  // Функция расчёта расстояния между двумя координатами (Хаверсинова формула)
  function calculateDistance(coord1, coord2) {
    const R = 6371; // Радиус Земли в км
    const dLat = toRad(coord2.latitude - coord1.latitude);
    const dLon = toRad(coord2.longitude - coord1.longitude);
    const lat1 = toRad(coord1.latitude);
    const lat2 = toRad(coord2.latitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Расстояние в км
  }

  function toRad(value) {
    return (value * Math.PI) / 180;
  }

  const DEBOUNCE_DELAY = 5000; // Задержка 5 секунд между обновлениями
  const lastUpdateTime = useRef(0);

  async function updateCarMileage(distance) {
    if (!car || distance <= 0) return;

    const now = Date.now();
    if (now - lastUpdateTime.current < DEBOUNCE_DELAY) return;

    const newMileage = car.mileage + distance;

    console.log(`🔹 Обновляем пробег: ${car.mileage} → ${newMileage} км`);

    const { error } = await supabase
      .from("cars")
      .update({ mileage: newMileage })
      .eq("id", car.id);

    if (error) {
      console.error("❌ Ошибка обновления пробега:", error.message);
    } else {
      console.log("✅ Пробег успешно обновлён");
      setCar((prevCar) => ({ ...prevCar, mileage: newMileage }));
      lastUpdateTime.current = now;
    }
  }

  return (
    <div>
      {hasLocationPermission ? (
        <p>📍 {t('gpsON')}</p>
      ) : (
        <p>⏳ {t('waitingGPS')}</p>
      )}
    </div>
  );
}