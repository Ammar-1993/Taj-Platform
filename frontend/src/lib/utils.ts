/**
 * يحول الوقت من تنسيق 24 ساعة (مثلاً 14:30) إلى تنسيق 12 ساعة بالعربي (مثلاً 02:30 مساءً)
 */
export const formatTimeTo12h = (time: string | undefined): string => {
    if (!time) return "";
    
    // تقسيم الوقت (يدعم HH:mm:ss أو HH:mm)
    const parts = time.split(':');
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    
    const ampm = hours >= 12 ? 'مساءً' : 'صباحاً';
    
    hours = hours % 12;
    hours = hours ? hours : 12; // الساعة 0 تصبح 12
    
    // إضافة صفر في البداية إذا كانت الساعة أقل من 10
    const strHours = hours < 10 ? `0${hours}` : hours;
    
    return `${strHours}:${minutes} ${ampm}`;
};
