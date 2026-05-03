export function getOrdinalSuffix(i) {
  const j = i % 10;
  const k = i % 100;
  if (j === 1 && k !== 11) return i + "st";
  if (j === 2 && k !== 12) return i + "nd";
  if (j === 3 && k !== 13) return i + "rd";
  return i + "th";
}

export function formatDateHeader(dateString) {
  if (!dateString) return "Unknown Date";
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Unknown Date";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayName = days[date.getDay()];
  const dayOfMonth = date.getDate();
  const monthName = months[date.getMonth()];

  const dayWithSuffix = getOrdinalSuffix(dayOfMonth);

  return `${dayName} ${dayWithSuffix} ${monthName}`;
}

export function groupItemsByDate(items) {
  if (!items || !Array.isArray(items)) return [];

  const grouped = items.reduce((acc, item) => {
    // Use the backend's time object for grouping
    const timestamp = item.time?.updated || item.time?.created; 
    const header = formatDateHeader(timestamp);
    
    if (!acc[header]) {
      acc[header] = {
        date: header,
        // We'll keep the raw date for sorting the groups if necessary,
        // using the first item's date in this group.
        rawDate: timestamp || 0, 
        items: []
      };
    }
    acc[header].items.push(item);
    return acc;
  }, {});

  // Convert object to array
  const groupArray = Object.values(grouped);

  // The original array is sorted newest first. 
  // We want to ensure groups are sorted newest first as well.
  groupArray.sort((a, b) => b.rawDate - a.rawDate);

  return groupArray;
}

// Keep backward compatibility if needed, but we'll try to refactor usages
export const groupProjectsByDate = groupItemsByDate;
