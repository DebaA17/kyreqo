import { useMemo } from 'react';
import Snowfall from 'react-snowfall';

export default function SeasonalSnowfall() {
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();

  const isWinterSeason =
    (month === 10 && date >= 1) || month === 11 || month === 0 || (month === 1 && date <= 28);

  const snowflakeImages = useMemo(() => {
    const snowflakeImage = new Image();
    snowflakeImage.src = '/snowflake.png';
    return [snowflakeImage];
  }, []);

  if (!isWinterSeason) {
    return null;
  }

  return (
    <Snowfall
      style={{
        position: 'fixed',
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      snowflakeCount={100}
      images={snowflakeImages}
      speed={[0.5, 2.0]}
      wind={[-0.5, 1.5]}
      rotationSpeed={[0, 0]}
      enable3DRotation={true}
      radius={[5, 10]}
    />
  );
}
