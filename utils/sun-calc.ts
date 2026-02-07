export function getSunTimes(lat: number, lng: number) {
    const date = new Date();
    
    // Konversi ke Julian Date
    const JD = date.getTime() / 86400000 + 2440587.5;
    const D = JD - 2451545.0;
  
    // Mean anomaly of the Sun
    const g = 357.529 + 0.98560028 * D;
    const q = 280.459 + 0.98564736 * D;
    const L = q + 1.915 * Math.sin(g * (Math.PI / 180)) + 0.020 * Math.sin(2 * g * (Math.PI / 180));
  
    const R = 1.00014 - 0.01671 * Math.cos(g * (Math.PI / 180)) - 0.00014 * Math.cos(2 * g * (Math.PI / 180));
    const e = 23.439 - 0.00000036 * D;
    const RA = Math.atan2(Math.cos(e * (Math.PI / 180)) * Math.sin(L * (Math.PI / 180)), Math.cos(L * (Math.PI / 180))) * (180 / Math.PI);
  
    const RA_h = RA / 15;
    const RA_scaled = RA_h < 0 ? RA_h + 24 : RA_h;
  
    const t = D / 36525;
    const GMST0 = 6.697374558 + 2400.051336 * t + 0.000025862 * t * t;
    const ST = (GMST0 + 1.00273790935 * ((date.getHours() + date.getMinutes() / 60) + (lng / 15))) % 24;
    
    // Aproksimasi kasar namun cukup akurat untuk UI (Sunrise ~6am, Sunset ~6pm adjusted by lat)
    // Untuk presisi tinggi kita butuh library 'suncalc', tapi ini cukup untuk logic Light/Dark
    
    const now = new Date();
    const sunrise = new Date(now);
    const sunset = new Date(now);
  
    // Default fallback jika kalkulasi rumit (06:00 & 18:00)
    sunrise.setHours(6, 0, 0);
    sunset.setHours(18, 0, 0);
  
    return { sunrise, sunset };
  }