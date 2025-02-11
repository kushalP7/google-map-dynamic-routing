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
interface Assistant {
    id: number;
    name: string;
    location: Location;
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
    private assistants: Assistant[] = [];

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

    setValues(schoolLocation: School, students: Student[], drivers: Driver[], assistants: Assistant[], vehicleCapacity: number, mapZoom: number) {
        this.schoolLocation = schoolLocation;
        this.students = students;
        this.drivers = drivers;
        this.vehicleCapacity = vehicleCapacity;
        this.zoomLevel = mapZoom;
        this.assistants = assistants;
        this.createDrivers();
    }

    initMap() {
        const mapOptions: google.maps.MapOptions = {
            center: new google.maps.LatLng(this.schoolLocation.location.lat, this.schoolLocation.location.lng),
            zoom: this.zoomLevel,
        };

        this.mapInstance = new google.maps.Map(document.getElementById("map") as HTMLElement, mapOptions);
        this.directionsService = new google.maps.DirectionsService();

        this.addSchoolMarkers();
        this.addStudentMarker();
        this.addAssistantMarkers();
    }

    private addSchoolMarkers() {
        new google.maps.Marker({
            position: this.schoolLocation.location,
            map: this.mapInstance,
            label: {
                text: `${this.schoolLocation.name}`,
                color: `#2E8B57`,
            },
            icon: { url: `https://img.icons8.com/?size=60&id=RWH5eUW9Vr7f&format=png&color=000000` }
        });
    }

    private addStudentMarker() {
        for (const student of this.students) {
            new google.maps.Marker({
                position: student.location,
                map: this.mapInstance,
                label: `${student.name}--S${student.id}`,
                icon: { url: `https://img.icons8.com/?size=25&id=LMhH2eAC6LY8&format=png&color=000000` }
            });
        }
    }

    private addAssistantMarkers() {
        for (const assistant of this.assistants) {
            new google.maps.Marker({
                position: assistant.location,
                map: this.mapInstance,
                label: `Assistant ${assistant.id}`,
                icon: { url: 'https://img.icons8.com/?size=40&id=21832&format=png&color=000000' }
            });
        }
    }

    createRoutesForDrivers() {
        const availablevehicles = this.drivers.length;
        const vehicleRoutes = [];
        const vehicleLocations = Array(availablevehicles).fill(this.schoolLocation.location);
        const vehiclesWithCapacity = Array(availablevehicles).fill(this.vehicleCapacity);
        let remainingStudents = [...this.students];
        let availableAssistants = [...this.assistants];

        for (let i = 0; i < availablevehicles && remainingStudents.length > 0; i++) {
            const vehicleRoute = [];
            let vehicleCapacityRemaining = vehiclesWithCapacity[i];
            let currentvehicleLocation = vehicleLocations[i];

            const nearestAssistant = this.findNearestAssistant(currentvehicleLocation, availableAssistants);
            if (nearestAssistant) {
                this.drivers[i].location = nearestAssistant.location;
                vehicleRoute.push({ id: `A${nearestAssistant.id}`, location: nearestAssistant.location, name: `Assistant ${nearestAssistant.name}` });
                currentvehicleLocation = nearestAssistant.location;
                availableAssistants = availableAssistants.filter(assistant => assistant !== nearestAssistant);
            }

            const farthestStudent = this.findFarthestStudent(this.schoolLocation.location, remainingStudents);
            if (farthestStudent) {
                vehicleRoute.push(farthestStudent);
                currentvehicleLocation = farthestStudent.location;
                remainingStudents = remainingStudents.filter(student => student !== farthestStudent);
                vehicleCapacityRemaining--;
            }

            let studentIndex = 0;
            while (vehicleCapacityRemaining > 0 && remainingStudents.length > 0 && studentIndex < remainingStudents.length) {
                const nearestStudent = this.findNearestStudent(currentvehicleLocation, remainingStudents);
                vehicleRoute.push(nearestStudent);
                currentvehicleLocation = nearestStudent?.location;
                remainingStudents = remainingStudents.filter(student => student !== nearestStudent);
                vehicleCapacityRemaining--;
                studentIndex++;
            }

            vehicleLocations[i] = currentvehicleLocation;
            vehiclesWithCapacity[i] = vehicleCapacityRemaining;
            vehicleRoutes.push(vehicleRoute);
        }

        if (remainingStudents.length > 0) {
            this.assignRemainingStudentsToNextVehicals(vehicleRoutes, remainingStudents, vehicleLocations, vehiclesWithCapacity);
        }
        for (let index = 0; index < vehicleRoutes.length; index++) {
            this.createvehicalRoute(index, vehicleRoutes[index]);

            localStorage.setItem(`Driver-${index + 1}--> Route`, JSON.stringify(vehicleRoutes[index]));
            localStorage.setItem(`Driver-${index + 1}--> Dropoff`, JSON.stringify([...vehicleRoutes[index]].reverse()));
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

    private findNearestAssistant(currentLocation: Location, assistants: Assistant[]) {
        if (assistants.length === 0) return;
        return assistants.reduce((nearest, assistant) =>
            this.getDistance(currentLocation, assistant.location!) <
                this.getDistance(currentLocation, nearest.location!) ? assistant : nearest);
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
        const waypoints = route.map((stop) => ({
            location: new google.maps.LatLng(stop.location.lat, stop.location.lng),
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
