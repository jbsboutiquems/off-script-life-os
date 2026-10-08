import { FAMILIARS } from './regions';
import type { RegionProfile } from './regions';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export const APPROXIMATE_GRID_STEP_DEGREES = 0.02;
export const APPROXIMATE_GRID_UNCERTAINTY_KM = 1.5;

const EARTH_RADIUS_KM = 6371.0088;

export function quantizeCoordinates(coordinates: Coordinates): Coordinates {
  const roundToGrid = (value: number) => Number((Math.round(value / APPROXIMATE_GRID_STEP_DEGREES) * APPROXIMATE_GRID_STEP_DEGREES).toFixed(2));
  return {
    latitude: roundToGrid(coordinates.latitude),
    longitude: roundToGrid(coordinates.longitude),
  };
}

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export interface RegionMatch {
  region: RegionProfile;
  distanceKm: number;
}

export function findNearestRegion(coordinates: Coordinates, uncertaintyRadiusKm = 0): RegionMatch | null {
  const allMatches = FAMILIARS.map((region) => ({
    region,
    distanceKm: distanceKm(coordinates, region.coordinates),
  })).sort((left, right) => left.distanceKm - right.distanceKm);
  const eligible = allMatches.filter(({ region, distanceKm: distance }) => distance <= region.radiusKm);
  const nearest = eligible[0];
  if (!nearest) return null;

  if (!Number.isFinite(uncertaintyRadiusKm) || uncertaintyRadiusKm < 0) return null;
  const uncertainty = uncertaintyRadiusKm;
  if (uncertainty === 0) return nearest;
  if (nearest.distanceKm + uncertainty > nearest.region.radiusKm) return null;

  const boundaryIsAmbiguous = allMatches.some(({ region, distanceKm: distance }) =>
    region.id !== nearest.region.id &&
    distance - nearest.distanceKm <= 2 * uncertainty &&
    distance - uncertainty <= region.radiusKm,
  );

  return boundaryIsAmbiguous ? null : nearest;
}

export function describeDistance(kilometers: number): string {
  const miles = kilometers * 0.621371;
  return miles < 1 ? 'less than a mile away' : `${miles.toFixed(1)} mi from the Familiar zone`;
}
