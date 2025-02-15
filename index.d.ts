declare module 'google-map-dynamic-routing' {

    export interface Location {
        lat: number;
        lng: number;
    }

    export interface Student {
        id: number;
        location: Location;
        name: string;
    }

    export interface Driver {
        id: number;
        location?: Location,
        name?: string;
    }

    export interface School {
        id: number;
        location: Location;
        name: string;
    }

    export interface Assistant {
        id: number;
        name: string;
        location: Location;
    }

    export interface RouteOptions {
        origin: Location | string;
        destination: Location | string;
        waypoints?: google.maps.DirectionsWaypoint[];
        travelMode?: google.maps.TravelMode;
        optimizeWaypoints?: boolean;
    }

    export interface RouteResult {
        status: google.maps.DirectionsStatus;
        directions: google.maps.DirectionsResult;
    }

    export class GoogleMapDynamicRouting {
        constructor();
        setValues(schoolLocation: School, students: Student[], drivers: Driver[], assistants: Assistant[], busCapacity: number, mapZoom: number): void;
        initMap(mapElement: HTMLElement, schoolLocation: Location): void;
        createRoutesForDrivers(): void;
        getRouteForDriver(driverIndex: number): void;
        drivers: Driver[];
    }
}
