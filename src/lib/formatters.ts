
export function formatCurrency(amount: number | undefined | null) {
    if (typeof amount !== 'number') return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
}

export function formatDate(timestamp: any, includeTime = false) {
    if (!timestamp) return 'N/A';
    
    let date;
    // Handle Firestore Timestamp object
    if (timestamp && typeof timestamp.toDate === 'function') {
        date = timestamp.toDate();
    } 
    // Handle object with seconds and nanoseconds (from server-side rendering or direct object)
    else if (timestamp && typeof timestamp.seconds === 'number') {
        date = new Date(timestamp.seconds * 1000);
    } 
    // Handle ISO string or number (milliseconds)
    else {
       date = new Date(timestamp);
    }

    if(isNaN(date.getTime())) return 'Invalid Date';

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    };

    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }

    return date.toLocaleString('en-US', options);
}
