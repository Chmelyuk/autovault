import { useEffect, useState } from "react";

const SPEED_THRESHOLD_CAR = 30; // Минимальная скорость для автомобиля (км/ч)

export default function CarTracker({ user, car, supabase, setCar }) {
  const [lastCoords, setLastCoords] = useState(null);

  useEffect(() => {
    if (!user || !car) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed } = position.coords;
        const speedKmh = (speed || 0) * 3.6; // Конвертируем м/с в км/ч

        console.log(`📍 Скорость: ${speedKmh} км/ч`);

        // Исключаем ходьбу и велосипед
        if (speedKmh >= SPEED_THRESHOLD_CAR) {
          if (lastCoords) {
            const distance = calculateDistance(lastCoords, { latitude, longitude });

            if (distance > 0.05) { // Только если проехали больше 50 метров
              console.log(`🛣 Пройдено: ${distance.toFixed(2)} км`);
              updateCarMileage(distance);
            }
          }
          setLastCoords({ latitude, longitude }); // Сохраняем новые координаты
        }
      },
      (error) => console.error("❌ Ошибка геолокации:", error),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, car, lastCoords]);

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

  // 🔹 Функция обновления пробега в базе данных
  async function updateCarMileage(distance) {
    if (!car || distance <= 0) return;

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

      // Обновляем состояние машины в React
      setCar((prevCar) => ({ ...prevCar, mileage: newMileage }));
    }
  }

  return (
    <div>
           {lastCoords ? (
        <p>📍 Отслеживание включено</p>
      ) : (
        <p>⏳ Ожидание GPS...</p>
      )}
    </div>
  );
}
