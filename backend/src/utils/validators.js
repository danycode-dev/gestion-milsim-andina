export function isValidNationalityCode(value) {
    if (value === null) return true;

    return (
        typeof value === "string" &&
        /^[A-Z]{2}$/.test(value)
    );
}
export function isValidJoinDate(value) {
    if (value === null) return true;

    if (typeof value !== "string") return false;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;

    const [year, month, day] = value.split("-").map(Number);

    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}