import ReactGA from 'react-ga4';
import { GA_TRACKING_ID } from '../config/analytics';

/**
 * Initialize Google Analytics
 */
export const initGA = (): void => {
  if (GA_TRACKING_ID) {
    ReactGA.initialize(GA_TRACKING_ID);
  }
};

/**
 * Track page view
 * @param path - The page path
 */
export const pageview = (path: string): void => {
  if (GA_TRACKING_ID) {
    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

/**
 * Track custom event
 * @param category - Event category
 * @param action - Event action
 * @param label - Event label (optional)
 * @param value - Event value (optional)
 */
export const event = (category: string, action: string, label?: string, value?: number): void => {
  if (GA_TRACKING_ID) {
    ReactGA.event({
      category,
      action,
      label,
      value,
    });
  }
};
