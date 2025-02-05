interface Student {
    id: number;
    location: Location;
    name: string;
}

interface Driver {
    id: number;
    location?: Location,
    name?: string;
}

interface Location {
    lat: number;
    lng: number;
}

interface School {
    id: number;
    location: Location;
    name: string;
}

export class GoogleMapDynamicRouting {
    private schoolLocation!: School;
    private zoomLevel!: number;
    private mapInstance!: google.maps.Map;
    private directionsService!: google.maps.DirectionsService;
    private directionsRenderers: google.maps.DirectionsRenderer[] = [];
    private vehicleCapacity!: number;
    private students: Student[] = [];
    public drivers: Driver[] = [];

    constructor() { }

    private createDrivers() {
        const requiredDrivers = Math.ceil(this.students.length / this.vehicleCapacity);
        for (let i = 1; i <= requiredDrivers; i++) {
            const driver: Driver = {
                id: +(Math.random() * 100).toFixed(0),
            };
            this.drivers = [...this.drivers, driver];
        }
    }

    setValues(schoolLocation: School, students: Student[], drivers: Driver[], vehicleCapacity: number, mapZoom: number) {
        this.schoolLocation = schoolLocation;
        this.students = students;
        this.drivers = drivers;
        this.vehicleCapacity = vehicleCapacity;
        this.zoomLevel = mapZoom;
        this.createDrivers();
    }

    initMap() {
        const mapOptions: google.maps.MapOptions = {
            center: new google.maps.LatLng(this.schoolLocation.location.lat, this.schoolLocation.location.lng),
            zoom: this.zoomLevel,
        };

        this.mapInstance = new google.maps.Map(document.getElementById("map") as HTMLElement, mapOptions);
        this.directionsService = new google.maps.DirectionsService();

        this.addSchoolMarker();
        this.addStudentMarkers();
    }

    private addSchoolMarker() {
        new google.maps.Marker({
            position: this.schoolLocation.location,
            map: this.mapInstance,
            label: {
                text: this.schoolLocation.name,
                color: '#2E8B57',
            },
        });
    }

    private addStudentMarkers() {
        for (const student of this.students) {
            new google.maps.Marker({
                position: student.location,
                map: this.mapInstance,
                label: `${student.name} - S${student.id}`,
            });
        }
    }


    createRoutesForDrivers() {
        const availablevehicals = this.drivers.length;
        const vehicalRoutes = [];
        const vehicalLocations = Array(availablevehicals).fill(this.schoolLocation.location);
        const vehicalsWithCapacity = Array(availablevehicals).fill(this.vehicleCapacity);
        let remainingStudents = [...this.students];

        for (let i = 0; i < availablevehicals && remainingStudents.length > 0; i++) {
            const vehicalRoute = [];
            let vehicalCapacityRemaining = vehicalsWithCapacity[i];
            let currentVehicalLocation = vehicalLocations[i];

            const farthestStudent = this.findFarthestStudent(this.schoolLocation.location, remainingStudents);
            if (farthestStudent) {
                vehicalRoute.push(farthestStudent);
                currentVehicalLocation = farthestStudent.location;
                remainingStudents = remainingStudents.filter(student => student !== farthestStudent);
                vehicalCapacityRemaining--;
            }

            let studentIndex = 0;
            while (vehicalCapacityRemaining > 0 && remainingStudents.length > 0 && studentIndex < remainingStudents.length) {
                const nearestStudent = this.findNearestStudent(currentVehicalLocation, remainingStudents);
                vehicalRoute.push(nearestStudent);
                currentVehicalLocation = nearestStudent?.location;
                remainingStudents = remainingStudents.filter(student => student !== nearestStudent);
                vehicalCapacityRemaining--;
                studentIndex++;
            }

            vehicalLocations[i] = currentVehicalLocation;
            vehicalsWithCapacity[i] = vehicalCapacityRemaining;
            vehicalRoutes.push(vehicalRoute);
        }

        if (remainingStudents.length > 0) {
            this.assignRemainingStudentsToNextVehicals(vehicalRoutes, remainingStudents, vehicalLocations, vehicalsWithCapacity);
        }

        for (let index = 0; index < vehicalRoutes.length; index++) {
            this.createvehicalRoute(index, vehicalRoutes[index]);
        }

    }

    private assignRemainingStudentsToNextVehicals(vehicalRoutes: any[], remainingStudents: Student[], vehicalLocations: Location[], vehicalsWithCapacity: number[]) {
        let vehicalIndex = 0;
        while (remainingStudents.length > 0) {
            const vehicalRoute = vehicalRoutes[vehicalIndex];

            let vehicalCapacityRemaining = vehicalsWithCapacity[vehicalIndex];

            while (vehicalCapacityRemaining > 0 && remainingStudents.length > 0) {
                const nearestStudent = this.findNearestStudent(vehicalLocations[vehicalIndex], remainingStudents);
                vehicalRoute.push(nearestStudent);
                remainingStudents = remainingStudents.filter(student => student !== nearestStudent);
                vehicalCapacityRemaining--;
            }

            vehicalLocations[vehicalIndex] = vehicalRoute[vehicalRoute.length - 1].location;
            vehicalIndex = (vehicalIndex + 1) % vehicalRoutes.length;
        }
    }

    private findFarthestStudent(currentLocation: Location, students: Student[]) {
        if (students.length === 0) return;
        return students.reduce((far, curr) =>
            this.getDistance(currentLocation, curr.location) >
                this.getDistance(currentLocation, far.location) ? curr : far
        );
    }

    private findNearestStudent(currentLocation: Location, students: Student[]) {
        if (students.length === 0) return;
        return students.reduce((nearest, student) =>
            this.getDistance(currentLocation, student.location) <
                this.getDistance(currentLocation, nearest.location) ? student : nearest
        );
    }

    private getDistance(pointA: Location, pointB: Location): number {
        const R = 6371; // Radius of Earth in kilometers
        const dLat = (pointB.lat - pointA.lat) * (Math.PI / 180);
        const dLon = (pointB.lng - pointA.lng) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(pointA.lat * (Math.PI / 180)) *
            Math.cos(pointB.lat * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }


    private createvehicalRoute(driverIndex: number, route: any[]) {
        const waypoints = route.map((student) => ({
            location: new google.maps.LatLng(student.location.lat, student.location.lng),
            stopover: true,
        }));

        const request: google.maps.DirectionsRequest = {
            origin: this.schoolLocation.location,
            destination: this.schoolLocation.location,
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
            optimizeWaypoints: true,
        };

        const directionsRenderer = new google.maps.DirectionsRenderer({
            map: this.mapInstance,
            polylineOptions: {
                strokeColor: this.getColorForDriver(driverIndex),
            },
        });

        this.directionsRenderers.push(directionsRenderer);
        this.directionsService.route(request, (response, status) => {
            status === google.maps.DirectionsStatus.OK ? directionsRenderer.setDirections(response) : console.error("Directions request failed due to: " + status);
        });
    }

    private getColorForDriver(driverIndex: number): string {
        const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00"];
        return colors[driverIndex % colors.length];
    }

    getRouteForDriver(driverIndex: number) {
        for (let renderer of this.directionsRenderers) {
            renderer.setMap(null);
        }
        const selectedRenderer = this.directionsRenderers[driverIndex];
        selectedRenderer.setMap(this.mapInstance);
        const request = selectedRenderer.getDirections();
        if (request) {
            const route = request.routes[0];
            const legs = route.legs;
            let totalDistance = 0;
            let totalDuration = 0;

            for (let leg of legs) {
                totalDistance += leg.distance ? leg.distance.value : 0;
                totalDuration += leg.duration ? leg.duration.value : 0;
            }
            console.log('Driver:', `${driverIndex + 1} =>`, 'TotalDistance:', (totalDistance / 1000).toFixed(2) + 'KM', 'TotalDuration:', (totalDuration / 60).toFixed(2) + ' min');
        }
    }

}
