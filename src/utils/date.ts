import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

/**
 * Formats a date string or Date object to a relative time string (e.g., "2 hours ago")
 * @param date - The date to format
 * @returns The relative time string
 */
export const formatRelativeTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).fromNow();
};

/**
 * Formats a date string or Date object to the specified format: DD-MM-YYYY hh:mm A
 * @param date - The date to format (string, number, or Date object)
 * @returns The formatted date string
 */
export const formatDateTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD-MM-YYYY hh:mm A');
};

/**
 * Formats a date string or Date object to date only: DD-MM-YYYY
 * @param date - The date to format
 * @returns The formatted date string
 */
export const formatDate = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).format('DD-MM-YYYY');
};

/**
 * Formats a date string or Date object to time only: hh:mm A
 * @param date - The date to format
 * @returns The formatted time string
 */
export const formatTime = (date: string | number | Date | null | undefined): string => {
  if (!date) return 'N/A';
  return dayjs(date).format('hh:mm A');
};
