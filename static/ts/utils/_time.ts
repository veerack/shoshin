export function getCurrentTime(): string {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    };

    // Get the user's local time in "Today at HH:MM AM/PM" format
    const timeString = now.toLocaleTimeString(undefined, options);
    
    return `Today at ${timeString}`;
}